import { describe, expect, it } from 'vitest'
import { isValidName, isValidPassword } from './accountRules'

describe('isValidName', () => {
  it.each(['Аня', 'Alice', 'Игрок 1', 'a_b-c.d', '  Боб  ', 'а'.repeat(16)])('accepts %j', (name) => {
    expect(isValidName(name)).toBe(true)
  })

  it.each(['', 'ab', 'а'.repeat(17), '!abc', 'abc!', 'a@b'])('rejects %j', (name) => {
    expect(isValidName(name)).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('requires at least 8 characters', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
  })
})
