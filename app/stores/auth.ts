import type { AccountUser } from '~/types/api'

/** The signed-in customer (Sanctum cookie session). Client-side only. */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AccountUser | null>(null)
  /** True once /me has been asked at least once, so pages can tell "guest" from "not checked yet". */
  const checked = ref(false)

  async function fetchUser() {
    try {
      user.value = (await $send<{ data: AccountUser }>('GET', '/me')).data
    }
    catch {
      user.value = null // 401 for guests, or the API is unreachable: either way, not signed in
    }
    checked.value = true
  }

  async function login(login: string, password: string) {
    user.value = (await $send<{ data: AccountUser }>('POST', '/auth/login', { login, password })).data
    checked.value = true
  }

  async function register(payload: { name: string, phone: string, email?: string, password: string, password_confirmation: string }) {
    user.value = (await $send<{ data: AccountUser }>('POST', '/auth/register', payload)).data
    checked.value = true
  }

  async function logout() {
    await $send('POST', '/auth/logout')
    user.value = null
  }

  return { user, checked, fetchUser, login, register, logout }
})
