import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { AUTH_ACCESS_TOKEN_KEY, AUTH_USER_KEY } from '../../../shared/utils/storageKeys'
import type { AuthUser, LoginCredentials, LoginResponse } from '../types/auth.types'

const toAuthUser = (data: AuthUser): AuthUser => ({
  username: data.username,
  nombres: data.nombres,
  apellidos: data.apellidos,
  email: data.email,
  roles: data.roles ?? [],
  permisos: data.permisos ?? [],
})

export const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await apiClient.post('/api/auth/login', credentials)
    return unwrapApiData<LoginResponse>(data)
  },

  async me() {
    const { data } = await apiClient.get('/api/auth/me')
    return toAuthUser(unwrapApiData<AuthUser>(data))
  },
}

export function persistAuthSession(response: LoginResponse) {
  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.accessToken)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(toAuthUser(response)))
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)
}

export function getStoredUser() {
  const value = localStorage.getItem(AUTH_USER_KEY)

  if (!value) {
    return null
  }

  try {
    return toAuthUser(JSON.parse(value) as AuthUser)
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export function persistUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(toAuthUser(user)))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
