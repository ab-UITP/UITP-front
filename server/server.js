// ============================================================================
// Временный сервис: аккаунты и подключение игроков к матчу по ссылке.
// Хост создаёт матч и получает ссылку /m/{КОД}, гость открывает её и входит.
// Игровой логики нет. Zero-dependency Node.js (http), всё хранится в памяти.
// Пути совпадают с API из устава, сервер заменит Kotlin-бэкенд.
// ============================================================================
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const LONG_POLL_MS = Number(process.env.LONG_POLL_MS) || 25000;

// --- матч-код: 6 символов без похожих (0/O, 1/I/L) ---
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,14}[\p{L}\p{N}]$/u; // 3–16 символов
const MIN_PASSWORD = 8;
const SESSION_COOKIE = 'sid';

/** @type {Map<string, {name: string, salt: string, hash: string}>} ключ — имя в нижнем регистре */
const users = new Map();
/** @type {Map<string, string>} sid → ключ пользователя */
const sessions = new Map();

/** @type {Map<string, {
 *   code: string,
 *   host: {key: string, name: string},
 *   guest: {key: string, name: string} | null,
 *   status: 'WAITING'|'READY'|'CLOSED',
 *   closeReason: 'CANCELLED'|'LEFT'|null,
 *   createdAt: number,
 *   version: number,
 *   waiters: Set<() => void>
 * }>} */
const matches = new Map();

function makeCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 6; i++) c += ALPHABET[crypto.randomInt(ALPHABET.length)];
    if (!matches.has(c)) return c;
  }
}

function publicMatch(m, userKey, req) {
  const youAre = m.host.key === userKey ? 'host' : m.guest && m.guest.key === userKey ? 'guest' : null;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return {
    matchId: m.code,
    inviteLink: `${proto}://${req.headers.host}/m/${m.code}`,
    status: m.status,
    closeReason: m.closeReason,
    hostName: m.host.name,
    guestName: m.guest ? m.guest.name : null,
    youAre,
    stateVersion: m.version,
  };
}

function touch(m) {
  m.version += 1;
  for (const wake of m.waiters) wake();
  m.waiters.clear();
}

// ============================== аккаунты ==============================
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function passwordMatches(user, password) {
  return crypto.timingSafeEqual(Buffer.from(user.hash, 'hex'), Buffer.from(hashPassword(password, user.salt), 'hex'));
}

function sessionUserKey(req) {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]+)`));
  return match ? sessions.get(match[1]) : undefined;
}

function startSession(res, req, userKey) {
  const sid = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, userKey);
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/${secure}`);
}

function endSession(res, req) {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]+)`));
  if (match) sessions.delete(match[1]);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
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

// Ждём изменения версии матча, но не дольше LONG_POLL_MS.
function waitForChange(m, req) {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      m.waiters.delete(done);
      req.off('close', done);
      resolve();
    };
    const timer = setTimeout(done, LONG_POLL_MS);
    m.waiters.add(done);
    req.on('close', done);
  });
}

// ============================== API ==============================
async function handleAuth(req, res, action) {
  if (action === 'logout') {
    endSession(res, req);
    sendJson(res, 200, { ok: true });
    return;
  }
  const body = await readBody(req);
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  const key = name.toLowerCase();

  if (action === 'register') {
    if (!NAME_RE.test(name)) { sendJson(res, 400, { error: 'BAD_NAME', message: 'Имя: от 3 до 16 символов' }); return; }
    if (password.length < MIN_PASSWORD) { sendJson(res, 400, { error: 'BAD_PASSWORD', message: 'Пароль: не короче 8 символов' }); return; }
    if (users.has(key)) { sendJson(res, 409, { error: 'NAME_TAKEN', message: 'Это имя уже занято' }); return; }
    const salt = crypto.randomBytes(16).toString('hex');
    users.set(key, { name, salt, hash: hashPassword(password, salt) });
    startSession(res, req, key);
    sendJson(res, 201, { name });
    return;
  }

  if (action === 'login') {
    const user = users.get(key);
    if (!user || !passwordMatches(user, password)) { sendJson(res, 401, { error: 'BAD_CREDENTIALS', message: 'Неверное имя или пароль' }); return; }
    startSession(res, req, key);
    sendJson(res, 200, { name: user.name });
    return;
  }

  sendJson(res, 404, { error: 'NOT_FOUND' });
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(2); // без ['api', 'v1']

  // GET /api/v1/health
  if (req.method === 'GET' && parts[0] === 'health') {
    sendJson(res, 200, { ok: true, service: 'card-join' });
    return;
  }

  // POST /api/v1/auth/{register|login|logout}
  if (req.method === 'POST' && parts[0] === 'auth' && parts[1]) {
    await handleAuth(req, res, parts[1]);
    return;
  }

  // дальше — только с сессией
  const userKey = sessionUserKey(req);
  const user = userKey && users.get(userKey);
  if (!user) { sendJson(res, 401, { error: 'UNAUTHORIZED' }); return; }

  // GET /api/v1/me
  if (req.method === 'GET' && parts[0] === 'me') {
    sendJson(res, 200, { name: user.name });
    return;
  }

  // POST /api/v1/matches — хост создаёт матч
  if (req.method === 'POST' && parts[0] === 'matches' && parts.length === 1) {
    const code = makeCode();
    matches.set(code, {
      code, host: { key: userKey, name: user.name }, guest: null,
      status: 'WAITING', closeReason: null, createdAt: Date.now(),
      version: 0, waiters: new Set(),
    });
    sendJson(res, 201, publicMatch(matches.get(code), userKey, req));
    return;
  }

  // всё дальше — /api/v1/matches/{id}/{action}
  if (parts[0] === 'matches' && parts[1]) {
    const code = parts[1].toUpperCase();
    const m = matches.get(code);

    // GET /api/v1/matches/{id}/state?since=N — состояние матча (long-poll)
    if (req.method === 'GET' && parts[2] === 'state') {
      if (!m) { sendJson(res, 404, { error: 'MATCH_NOT_FOUND' }); return; }
      const since = url.searchParams.get('since');
      if (since !== null && Number(since) === m.version && m.status !== 'CLOSED') await waitForChange(m, req);
      if (!req.destroyed) sendJson(res, 200, publicMatch(m, userKey, req));
      return;
    }

    // POST /api/v1/matches/{id}/join — гость присоединяется
    if (req.method === 'POST' && parts[2] === 'join') {
      if (!m) { sendJson(res, 404, { error: 'MATCH_NOT_FOUND', message: 'Ссылка больше не работает: матч отменён или не существует' }); return; }
      if (m.host.key === userKey || (m.guest && m.guest.key === userKey)) { sendJson(res, 200, publicMatch(m, userKey, req)); return; } // уже в матче
      if (m.status !== 'WAITING' || m.guest) {
        sendJson(res, 409, { error: 'MATCH_FULL', message: 'Ссылка больше не работает: матч отменён или в нём уже два игрока' });
        return;
      }
      m.guest = { key: userKey, name: user.name };
      m.status = 'READY';
      touch(m);
      sendJson(res, 200, publicMatch(m, userKey, req));
      return;
    }

    // POST /api/v1/matches/{id}/leave — выйти / отменить матч
    if (req.method === 'POST' && parts[2] === 'leave') {
      if (m && m.status !== 'CLOSED' && (m.host.key === userKey || (m.guest && m.guest.key === userKey))) {
        m.closeReason = m.status === 'WAITING' ? 'CANCELLED' : 'LEFT';
        m.status = 'CLOSED';
        touch(m);
      }
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  sendJson(res, 404, { error: 'NOT_FOUND' });
}

// ============================== сервер ==============================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/v1/')) await handleApi(req, res, url);
    else sendJson(res, 404, { error: 'NOT_FOUND' });
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
