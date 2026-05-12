// ============================================================
// 认证 composable — 管理员登录状态管理
// ============================================================

import { useApiPost } from './useApi'

/** 管理员用户信息 */
interface AdminUser {
  id: number
  nickname: string
  avatarUrl?: string
  role: string
}

export function useAuth() {
  const isAdminLoggedIn = useState<boolean>('admin-logged-in', () => false)
  const adminUser = useState<AdminUser | null>('admin-user', () => null)

  /** 管理员登录 */
  async function login(username: string, password: string) {
    const res = await useApiPost<{ token: string; refreshToken: string; user: AdminUser }>(
      '/auth/login',
      { username, password },
    )

    if (res.code === 0 && res.data) {
      if (import.meta.client) {
        localStorage.setItem('admin_token', res.data.token)
        localStorage.setItem('admin_refresh_token', res.data.refreshToken)
      }
      isAdminLoggedIn.value = true
      adminUser.value = res.data.user
      return res.data
    }

    throw new Error(res.message || '登录失败')
  }

  /** 管理员退出登录 */
  function logout() {
    if (import.meta.client) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
    }
    isAdminLoggedIn.value = false
    adminUser.value = null
    navigateTo('/login')
  }

  /** 检查是否已登录（从 localStorage 恢复状态） */
  function checkAuth(): boolean {
    if (import.meta.client) {
      const token = localStorage.getItem('admin_token')
      if (token) {
        isAdminLoggedIn.value = true
        return true
      }
      isAdminLoggedIn.value = false
      return false
    }
    return isAdminLoggedIn.value
  }

  /** 获取当前 token */
  function getToken(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('admin_token')
    }
    return null
  }

  return {
    isAdminLoggedIn: readonly(isAdminLoggedIn),
    adminUser: readonly(adminUser),
    login,
    logout,
    checkAuth,
    getToken,
  }
}
