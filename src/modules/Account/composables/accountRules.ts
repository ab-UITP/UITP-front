// То же правило, что и на сервере: 3–16 символов, буквы и цифры по краям.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,14}[\p{L}\p{N}]$/u

export function isValidName(name: string): boolean {
  return NAME_RE.test(name.trim())
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}
