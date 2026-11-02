// ============================================================================
// card-join — сервис подключения игроков к матчу по ссылке-приглашению.
// Только подключение: хост создаёт матч и получает ссылку /m/{КОД},
// гость открывает её и присоединяется. Игровая логика не входит в объём.
// Zero-dependency Node.js (http + fs), матчи хранятся в памяти.
// ============================================================================
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- матч-код: 6 символов без похожих (0/O, 1/I/L) ---
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,14}[\p{L}\p{N}]$/u; // 3–16 символов

/** @type {Map<string, {
 *   code: string,
 *   host: {id: string, name: string},
 *   guest: {id: string, name: string} | null,
 *   status: 'WAITING'|'READY'|'CLOSED',
 *   closeReason: 'CANCELLED'|'LEFT'|null,
 *   createdAt: number
 * }>} */
const matches = new Map();

function makeCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 6; i++) c += ALPHABET[crypto.randomInt(ALPHABET.length)];
    if (!matches.has(c)) return c;
  }
}

function publicMatch(m, playerId) {
  const youAre = playerId && m.host.id === playerId ? 'host' : playerId && m.guest && m.guest.id === playerId ? 'guest' : null;
  return {
    code: m.code,
    status: m.status,
    closeReason: m.closeReason,
    hostName: m.host.name,
    guestName: m.guest ? m.guest.name : null,
    youAre,
  };
}

// ============================== HTTP-хелперы ==============================
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (ch) => {
      size += ch.length;
      if (size > 10 * 1024) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); return; }
      chunks.push(ch);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('BAD_JSON')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { sendJson(res, 404, { error: 'NOT_FOUND' }); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

// ============================== API ==============================
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]

  // GET /api/health
  if (req.method === 'GET' && parts[1] === 'health') {
    sendJson(res, 200, { ok: true, service: 'card-join' });
    return;
  }

  // POST /api/matches  {playerId, name} — хост создаёт матч
  if (req.method === 'POST' && parts[1] === 'matches' && parts.length === 2) {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const playerId = String(body.playerId || '').slice(0, 64);
    if (!NAME_RE.test(name)) { sendJson(res, 400, { error: 'BAD_NAME', message: 'Имя: от 3 до 16 символов' }); return; }
    if (!playerId) { sendJson(res, 400, { error: 'BAD_PLAYER' }); return; }
    const code = makeCode();
    matches.set(code, {
      code, host: { id: playerId, name }, guest: null,
      status: 'WAITING', closeReason: null, createdAt: Date.now(),
    });
    sendJson(res, 201, { code, ...publicMatch(matches.get(code), playerId) });
    return;
  }

  // всё дальше — /api/matches/{code}[/{action}]
  if (parts[1] === 'matches' && parts[2]) {
    const code = parts[2].toUpperCase();
    const m = matches.get(code);

    // GET /api/matches/{code}?playerId=... — состояние матча (polling)
    if (req.method === 'GET' && parts.length === 3) {
      if (!m) { sendJson(res, 404, { error: 'MATCH_NOT_FOUND' }); return; }
      sendJson(res, 200, publicMatch(m, url.searchParams.get('playerId')));
      return;
    }

    // POST /api/matches/{code}/join  {playerId, name} — гость присоединяется
    if (req.method === 'POST' && parts[3] === 'join') {
      if (!m) { sendJson(res, 404, { error: 'MATCH_NOT_FOUND', message: 'Ссылка больше не работает: матч отменён или не существует' }); return; }
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const playerId = String(body.playerId || '').slice(0, 64);
      if (!NAME_RE.test(name) || !playerId) { sendJson(res, 400, { error: 'BAD_NAME', message: 'Имя: от 3 до 16 символов' }); return; }
      if (m.host.id === playerId) { sendJson(res, 200, publicMatch(m, playerId)); return; } // хост не может войти как гость
      if (m.guest && m.guest.id === playerId) { sendJson(res, 200, publicMatch(m, playerId)); return; } // уже в матче
      if (m.status !== 'WAITING' || m.guest) {
        sendJson(res, 409, { error: 'MATCH_FULL', message: 'Ссылка больше не работает: матч отменён или в нём уже два игрока' });
        return;
      }
      m.guest = { id: playerId, name };
      m.status = 'READY';
      sendJson(res, 200, publicMatch(m, playerId));
      return;
    }

    // POST /api/matches/{code}/leave  {playerId} — выйти / отменить матч
    if (req.method === 'POST' && parts[3] === 'leave') {
      if (!m) { sendJson(res, 200, { ok: true }); return; }
      const body = await readBody(req);
      const playerId = String(body.playerId || '').slice(0, 64);
      if (m.host.id === playerId) {
        m.closeReason = m.status === 'WAITING' ? 'CANCELLED' : 'LEFT';
        m.status = 'CLOSED';
      } else if (m.guest && m.guest.id === playerId) {
        m.closeReason = 'LEFT';
        m.status = 'CLOSED';
      }
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  sendJson(res, 404, { error: 'NOT_FOUND' });
}

// ============================== раздача статики ==============================
function handleStatic(req, res, url) {
  let p = url.pathname;
  if (p === '/') p = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, p));
  if (!filePath.startsWith(PUBLIC_DIR)) { sendJson(res, 403, { error: 'FORBIDDEN' }); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) { sendFile(res, filePath); return; }
  // SPA-маршруты: /m/{КОД} (и всё остальное) — отдаём приложение
  sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
}

// ============================== сервер ==============================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else handleStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) sendJson(res, e.message === 'BAD_JSON' ? 400 : 500, { error: e.message });
  }
});

// очистка устаревших матчей: закрытые и старше часа, незакрытые старше 12 часов
setInterval(() => {
  const now = Date.now();
  for (const [code, m] of matches) {
    const age = now - m.createdAt;
    if ((m.status === 'CLOSED' && age > 60 * 60 * 1000) || age > 12 * 60 * 60 * 1000) matches.delete(code);
  }
}, 5 * 60 * 1000).unref();

server.listen(PORT, () => console.log(`card-join: http://0.0.0.0:${PORT}`));
