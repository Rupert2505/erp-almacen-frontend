export type AuthUser = {
  username: string
  nombres: string
  apellidos: string
  email: string
  roles: string[]
  permisos: string[]
}

export type LoginCredentials = {
  username: string
  password: string
}

export type LoginResponse = AuthUser & {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'
