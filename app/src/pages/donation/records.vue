<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as donationApi from '@/services/donation'
import type { Donation } from '@/types/donation'
import DonationCard from '@/components/DonationCard.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== 捐助记录 ====================
const list = ref<Donation[]>([])
const page = ref<number>(1)
const hasMore = ref<boolean>(true)
const loading = ref<boolean>(false)
const refreshing = ref<boolean>(false)

/** 加载捐助记录 */
async function loadRecords(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  try {
    const currentPage = isRefresh ? 1 : page.value
    const res = await donationApi.getMyDonations({
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
    refreshing.value = false
    uni.stopPullDownRefresh()
  }
}

/** 加载状态 */
const loadStatus = computed(() => {
  if (loading.value) return 'loading'
  if (!hasMore.value) return 'noMore'
  return 'more'
})

/** 跳转捐助登记 */
function goDonationSubmit() {
  uni.navigateTo({ url: '/pages/donation/submit' })
}

/** 点击记录 */
function onDonationClick(donation: Donation) {
  // 可跳转详情页
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadRecords()
})

onPullDownRefresh(() => {
  refreshing.value = true
  loadRecords(true)
})

onReachBottom(() => {
  loadRecords()
})
</script>

<template>
  <view class="donation-records-page">
    <!-- 记录列表 -->
    <view class="records-list">
      <template v-if="list.length > 0">
        <DonationCard
          v-for="item in list"
          :key="item.id"
          :donation="item"
          @click="onDonationClick(item)"
        />
      </template>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!loading"
        text="暂无捐助记录"
        icon="gift"
      >
        <template #action>
          <wd-button type="primary" size="small" plain @click="goDonationSubmit">
            去捐助
          </wd-button>
        </template>
      </EmptyState>

      <!-- 加载状态 -->
      <LoadMore v-if="list.length > 0" :status="loadStatus" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.donation-records-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.records-list {
  padding: 20rpx 24rpx;
}
</style>
