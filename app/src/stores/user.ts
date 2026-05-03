import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'
import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken, getUserInfo, setUserInfo, removeUserInfo } from '@/utils/storage'
import * as authApi from '@/services/auth'
import * as userApi from '@/services/user'

export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  const token = ref<string>(getToken())
  const refreshToken = ref<string>(getRefreshToken())
  const userInfo = ref<UserInfo | null>(getUserInfo())

  // ==================== Getters ====================
  /** 是否已登录 */
  const isLoggedIn = computed<boolean>(() => !!token.value)

  /** 是否管理员 */
  const isAdmin = computed<boolean>(() => userInfo.value?.role === 'admin')

  /** 是否领队 */
  const isLeader = computed<boolean>(() => userInfo.value?.role === 'leader' || userInfo.value?.role === 'admin')

  // ==================== Actions ====================

  /**
   * 登录并存储 token 和用户信息
   */
  async function login(code: string, nickname?: string, avatarUrl?: string) {
    const result = await authApi.login(code, nickname, avatarUrl)
    token.value = result.token
    refreshToken.value = result.refreshToken
    userInfo.value = result.user

    setToken(result.token)
    setRefreshToken(result.refreshToken)
    setUserInfo(result.user)
  }

  /**
   * 退出登录，清除所有状态并跳转登录页
   */
  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null

    removeToken()
    removeRefreshToken()
    removeUserInfo()

    uni.reLaunch({ url: '/pages/login/index' })
  }

  /**
   * 获取最新用户信息
   */
  async function fetchUserInfo() {
    const info = await userApi.getMyInfo()
    userInfo.value = info
    setUserInfo(info)
  }

  /**
   * 更新本地用户信息
   */
  function updateUserInfo(data: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...data }
      setUserInfo(userInfo.value)
    }
  }

  return {
    // state
    token,
    refreshToken,
    userInfo,
    // getters
    isLoggedIn,
    isAdmin,
    isLeader,
    // actions
    login,
    logout,
    fetchUserInfo,
    updateUserInfo,
  }
})
