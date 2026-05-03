<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as mallApi from '@/services/mall'
import type { MallOrder, OrderStatus } from '@/types/mall'
import OrderCard from '@/components/OrderCard.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== Tab 切换 ====================
const tabs = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]
const activeTab = ref('')

function handleTabChange({ value }: { value: string }) {
  activeTab.value = value
  fetchOrderList()
}

// ==================== 列表数据 ====================
const orderList = ref<MallOrder[]>([])
const page = ref(1)
const pageSize = 10
const loadStatus = ref<'more' | 'loading' | 'noMore'>('more')
const isRefreshing = ref(false)

/** 加载订单列表 */
async function fetchOrderList(isLoadMore = false) {
  if (loadStatus.value === 'loading') return

  try {
    loadStatus.value = 'loading'

    if (!isLoadMore) {
      page.value = 1
    }

    const params: Record<string, any> = {
      page: page.value,
      pageSize,
    }
    if (activeTab.value) {
      params.status = activeTab.value
    }

    const res = await mallApi.getMyOrders(params)

    if (isLoadMore) {
      orderList.value = [...orderList.value, ...res.list]
    } else {
      orderList.value = res.list
    }

    loadStatus.value = res.hasMore ? 'more' : 'noMore'
  } catch (err: any) {
    console.error('获取订单列表失败', err)
    if (!isLoadMore) {
      orderList.value = []
    }
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    loadStatus.value = 'more'
  }
}

/** 点击订单卡片 */
function handleOrderClick(order: MallOrder) {
  uni.navigateTo({
    url: `/pages/mall/detail?orderId=${order.id}`,
  })
}

// ==================== 生命周期 ====================
onShow(() => {
  fetchOrderList()
})

onPullDownRefresh(async () => {
  isRefreshing.value = true
  await fetchOrderList()
  isRefreshing.value = false
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (loadStatus.value === 'more') {
    page.value++
    fetchOrderList(true)
  }
})
</script>

<template>
  <view class="order-list">
    <!-- 顶部 Tab 切换 -->
    <view class="order-list__tabs">
      <wd-tabs v-model="activeTab" @change="handleTabChange">
        <wd-tab
          v-for="tab in tabs"
          :key="tab.value"
          :title="tab.label"
          :name="tab.value"
        />
      </wd-tabs>
    </view>

    <!-- 订单列表 -->
    <view class="order-list__content">
      <!-- 空状态 -->
      <EmptyState
        v-if="!orderList.length && loadStatus !== 'loading'"
        text="暂无订单"
        icon="order"
      />

      <!-- 订单卡片列表 -->
      <view v-else class="order-list__cards">
        <OrderCard
          v-for="item in orderList"
          :key="item.id"
          :order="item"
          @click="handleOrderClick"
        />

        <!-- 加载更多 -->
        <LoadMore :status="loadStatus" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.order-list {
  min-height: 100vh;
  background-color: $color-bg;

  &__tabs {
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  &__content {
    padding: 24rpx;
  }

  &__cards {
    display: flex;
    flex-direction: column;
  }
}
</style>
