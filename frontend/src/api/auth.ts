import client from './client'
import type { User } from '@/types'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  email?: string
}

export const authApi = {
  login: (data: LoginData) =>
    client.post<{ access_token: string; token_type: string }>('/auth/login', data),

  register: (data: RegisterData) =>
    client.post<User>('/auth/register', data),

  getMe: () =>
    client.get<User>('/auth/me'),

  updateMe: (data: Partial<User>) =>
    client.put<User>('/auth/me', data),
}