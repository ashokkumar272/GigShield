const ACCESS_TOKEN_KEY = 'gigshield.access_token'

export const tokenStorage = {
  get: (): string | null => window.localStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string): void => window.localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clear: (): void => window.localStorage.removeItem(ACCESS_TOKEN_KEY),
}
