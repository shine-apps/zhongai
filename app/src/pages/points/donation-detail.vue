<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as pointsApi from '@/services/points'
import type { PointTransaction } from '@/types/points'
import PointTransactionItem from '@/components/PointTransactionItem.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== 积分流水 ====================
const list = ref<PointTransaction[]>([])
const page = ref<number>(1)
const hasMore = ref<boolean>(true)
const loading = ref<boolean>(false)

/** 加载捐助积分流水 */
async function loadTransactions(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  try {
    const currentPage = isRefresh ? 1 : page.value
    const res = await pointsApi.getTransactions({
      pointType: 'donation',
      page: currentPage,
      pageSize: 10,
    })

    list.value = isRefresh ? res.list : [...list.value, ...res.list]
    page.value = currentPage + 1
    hasMore.value = res.hasMore
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 加载状态 */
const loadStatus = computed(() => {
  if (loading.value) return 'loading'
  if (!hasMore.value) return 'noMore'
  return 'more'
})

// ==================== 生命周期 ====================
onMounted(() => {
  loadTransactions()
})

onReachBottom(() => {
  loadTransactions()
})
</script>

<template>
  <view class="donation-detail-page">
    <!-- 流水列表 -->
    <view class="transaction-list">
      <template v-if="list.length > 0">
        <PointTransactionItem
          v-for="item in list"
          :key="item.id"
          :transaction="item"
        />
      </template>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!loading"
        text="暂无捐助积分记录"
        icon="list"
      />

      <!-- 加载状态 -->
      <LoadMore v-if="list.length > 0" :status="loadStatus" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.donation-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.transaction-list {
  padding: 20rpx 24rpx;
  background-color: #fff;
  min-height: 60vh;
}
</style>
