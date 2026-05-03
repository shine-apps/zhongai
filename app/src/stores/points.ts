import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as pointsApi from '@/services/points'

export const usePointsStore = defineStore('points', () => {
  // ==================== State ====================
  const activityBalance = ref<number>(0)
  const activityTotal = ref<number>(0)
  const donationBalance = ref<number>(0)
  const donationTotal = ref<number>(0)

  // ==================== Getters ====================
  /** 总可用积分 */
  const totalBalance = computed<number>(() => activityBalance.value + donationBalance.value)

  // ==================== Actions ====================

  /**
   * 从 API 获取最新余额
   */
  async function refreshBalance() {
    const data = await pointsApi.getBalance()
    activityBalance.value = data.activityBalance
    activityTotal.value = data.activityTotal
    donationBalance.value = data.donationBalance
    donationTotal.value = data.donationTotal
  }

  return {
    // state
    activityBalance,
    activityTotal,
    donationBalance,
    donationTotal,
    // getters
    totalBalance,
    // actions
    refreshBalance,
  }
})
