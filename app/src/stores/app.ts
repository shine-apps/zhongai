import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SystemInfo {
  statusBarHeight: number
  navBarHeight: number
  windowHeight: number
  windowWidth: number
  platform: string
  pixelRatio: number
}

export const useAppStore = defineStore('app', () => {
  // ==================== State ====================
  const statusBarHeight = ref<number>(0)
  const navBarHeight = ref<number>(44)
  const systemInfo = ref<SystemInfo | null>(null)

  // ==================== Actions ====================

  /**
   * 获取系统信息（状态栏高度、导航栏高度等）
   */
  function initSystemInfo() {
    const info = uni.getSystemInfoSync()

    statusBarHeight.value = info.statusBarHeight || 0

    // 导航栏高度 = 状态栏高度 + 标题栏高度（胶囊按钮计算）
    // #ifdef MP-WEIXIN
    try {
      const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
      // 标题栏高度 = (胶囊底部 - 状态栏高度) + (胶囊顶部 - 状态栏高度)
      const navTop = menuButtonInfo.top
      const navBottom = menuButtonInfo.bottom
      navBarHeight.value = (navBottom - info.statusBarHeight) + (navTop - info.statusBarHeight)
    } catch {
      navBarHeight.value = 44
    }
    // #endif
    // #ifndef MP-WEIXIN
    navBarHeight.value = 44
    // #endif

    systemInfo.value = {
      statusBarHeight: info.statusBarHeight || 0,
      navBarHeight: navBarHeight.value,
      windowHeight: info.windowHeight || 0,
      windowWidth: info.windowWidth || 0,
      platform: info.platform || 'unknown',
      pixelRatio: info.pixelRatio || 1,
    }
  }

  return {
    // state
    statusBarHeight,
    navBarHeight,
    systemInfo,
    // actions
    initSystemInfo,
  }
})
