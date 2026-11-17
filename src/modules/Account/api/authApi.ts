import { ApiError, postJson, request } from '@/common/utilities/http'

export interface Account {
  name: string
}

export interface Credentials {
  name: string
  password: string
}

export async function fetchMe(): Promise<Account | null> {
  try {
    return await request<Account>('/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function register(credentials: Credentials): Promise<Account> {
  return postJson('/auth/register', credentials)
}

export function login(credentials: Credentials): Promise<Account> {
  return postJson('/auth/login', credentials)
}

export function logout(): Promise<unknown> {
  return postJson('/auth/logout', {})
}
