<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { usePointsStore } from '@/stores/points'
import * as pointsApi from '@/services/points'
import type { PointTransaction } from '@/types/points'
import PointTransactionItem from '@/components/PointTransactionItem.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()
const pointsStore = usePointsStore()

// ==================== Tabs ====================
const activeTab = ref<number>(0)

// ==================== 积分流水 ====================
const activityList = ref<PointTransaction[]>([])
const donationList = ref<PointTransaction[]>([])
const activityPage = ref<number>(1)
const donationPage = ref<number>(1)
const activityHasMore = ref<boolean>(true)
const donationHasMore = ref<boolean>(true)
const activityLoading = ref<boolean>(false)
const donationLoading = ref<boolean>(false)
const balanceLoading = ref<boolean>(true)

/** 当前 tab 对应的列表状态 */
const currentList = computed(() => activeTab.value === 0 ? activityList.value : donationList.value)
const currentHasMore = computed(() => activeTab.value === 0 ? activityHasMore.value : donationHasMore.value)
const currentLoading = computed(() => activeTab.value === 0 ? activityLoading.value : donationLoading.value)

/** 加载余额 */
async function loadBalance() {
  balanceLoading.value = true
  try {
    await pointsStore.refreshBalance()
  } catch (e: any) {
    uni.showToast({ title: e.message || '获取余额失败', icon: 'none' })
  } finally {
    balanceLoading.value = false
  }
}

/** 加载积分流水 */
async function loadTransactions(pointType: 'activity' | 'donation', isRefresh = false) {
  if (pointType === 'activity' && activityLoading.value) return
  if (pointType === 'donation' && donationLoading.value) return

  const page = pointType === 'activity' ? activityPage.value : donationPage.value
  const hasMore = pointType === 'activity' ? activityHasMore.value : donationHasMore.value

  if (!isRefresh && !hasMore) return

  if (pointType === 'activity') {
    activityLoading.value = true
  } else {
    donationLoading.value = true
  }

  try {
    const currentPage = isRefresh ? 1 : page
    const res = await pointsApi.getTransactions({
      pointType,
      page: currentPage,
      pageSize: 10,
    })

    const list = res.list || []
    if (pointType === 'activity') {
      activityList.value = isRefresh ? list : [...activityList.value, ...list]
      activityPage.value = currentPage + 1
      activityHasMore.value = res.hasMore
    } else {
      donationList.value = isRefresh ? list : [...donationList.value, ...list]
      donationPage.value = currentPage + 1
      donationHasMore.value = res.hasMore
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    if (pointType === 'activity') {
      activityLoading.value = false
    } else {
      donationLoading.value = false
    }
  }
}

/** Tab 切换 */
function onTabChange({ index }: { index: number }) {
  activeTab.value = index
  const pointType = index === 0 ? 'activity' : 'donation'
  const list = index === 0 ? activityList.value : donationList.value
  if (list.length === 0) {
    loadTransactions(pointType)
  }
}

/** 上拉加载更多 */
function onReachBottom() {
  const pointType = activeTab.value === 0 ? 'activity' : 'donation'
  loadTransactions(pointType)
}

/** 跳转捐助登记 */
function goDonationSubmit() {
  uni.navigateTo({ url: '/pages/donation/submit' })
}

/** 加载状态文字 */
const loadStatus = computed(() => {
  if (currentLoading.value) return 'loading'
  if (!currentHasMore.value) return 'noMore'
  return 'more'
})

/** 空状态文字 */
const emptyText = computed(() => {
  return activeTab.value === 0 ? '暂无活动积分记录' : '暂无捐助积分记录'
})

// ==================== 生命周期 ====================
onMounted(() => {
  loadBalance()
  loadTransactions('activity')
})

onShow(() => {
  loadBalance()
})
</script>

<template>
  <view class="points-page">
    <!-- 顶部双积分卡片 -->
    <view class="balance-section">
      <view v-if="balanceLoading" class="balance-section__loading">
        <wd-loading size="48rpx" color="#fff" />
      </view>
      <view v-else class="balance-section__cards">
        <!-- 活动积分卡片 -->
        <view class="balance-card balance-card--activity">
          <view class="balance-card__header">
            <wd-icon name="calendar" size="32rpx" color="#fff" />
            <text class="balance-card__title">活动积分</text>
          </view>
          <view class="balance-card__amount">
            <text class="balance-card__value">{{ pointsStore.activityBalance }}</text>
            <text class="balance-card__label">可用余额</text>
          </view>
          <view class="balance-card__footer">
            <text class="balance-card__total">累计获取 {{ pointsStore.activityTotal }}</text>
          </view>
        </view>

        <!-- 捐助积分卡片 -->
        <view class="balance-card balance-card--donation">
          <view class="balance-card__header">
            <wd-icon name="gift" size="32rpx" color="#fff" />
            <text class="balance-card__title">捐助积分</text>
          </view>
          <view class="balance-card__amount">
            <text class="balance-card__value">{{ pointsStore.donationBalance }}</text>
            <text class="balance-card__label">可用余额</text>
          </view>
          <view class="balance-card__footer">
            <text class="balance-card__total">累计获取 {{ pointsStore.donationTotal }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 积分明细 Tabs -->
    <view class="detail-section">
      <wd-tabs v-model="activeTab" @change="onTabChange">
        <wd-tab title="活动积分明细" />
        <wd-tab title="捐助积分明细" />
      </wd-tabs>

      <!-- 流水列表 -->
      <view class="transaction-list">
        <template v-if="currentList.length > 0">
          <PointTransactionItem
            v-for="item in currentList"
            :key="item.id"
            :transaction="item"
          />
        </template>

        <!-- 空状态 -->
        <EmptyState
          v-else-if="!currentLoading"
          :text="emptyText"
          icon="list"
        />

        <!-- 加载状态 -->
        <LoadMore v-if="currentList.length > 0" :status="loadStatus" />
      </view>
    </view>

    <!-- 底部捐助登记按钮 -->
    <view class="bottom-action">
      <wd-button type="primary" block @click="goDonationSubmit">
        捐助登记通道
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.points-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 140rpx;
}

.balance-section {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  padding: 32rpx 24rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));

  &__loading {
    display: flex;
    justify-content: center;
    padding: 60rpx 0;
  }

  &__cards {
    display: flex;
    gap: 20rpx;
  }
}

.balance-card {
  flex: 1;
  border-radius: 16rpx;
  padding: 24rpx;
  color: #fff;

  &--activity {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10rpx);
  }

  &--donation {
    background: rgba(255, 153, 0, 0.25);
    backdrop-filter: blur(10rpx);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 20rpx;
  }

  &__title {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
  }

  &__amount {
    margin-bottom: 16rpx;
  }

  &__value {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    line-height: 1.2;
    color: #fff;
  }

  &__label {
    display: block;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4rpx;
  }

  &__footer {
    padding-top: 16rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.2);
  }

  &__total {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}

.detail-section {
  margin: 20rpx 24rpx 0;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.transaction-list {
  padding: 0 24rpx;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}
</style>
