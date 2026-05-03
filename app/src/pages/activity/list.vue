<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as activityApi from '@/services/activity'
import type { Activity } from '@/types/activity'
import ActivityCard from '@/components/ActivityCard.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== 搜索与筛选 ====================
const keyword = ref('')
const categories = ['全部', '慰问老人', '爱心助学', '环保活动', '抗灾救援', '其他']
const currentCategory = ref('全部')

/** 分类值映射 */
const categoryValueMap: Record<string, string> = {
  '全部': '',
  '慰问老人': 'elderly_care',
  '爱心助学': 'education',
  '环保活动': 'environmental',
  '抗灾救援': 'disaster_relief',
  '其他': 'other',
}

// ==================== 列表数据 ====================
const activityList = ref<Activity[]>([])
const page = ref(1)
const pageSize = 10
const loadStatus = ref<'more' | 'loading' | 'noMore'>('more')
const isRefreshing = ref(false)

/** 加载活动列表 */
async function fetchActivityList(isLoadMore = false) {
  if (loadStatus.value === 'loading') return

  try {
    loadStatus.value = 'loading'

    if (!isLoadMore) {
      page.value = 1
    }

    const category = categoryValueMap[currentCategory.value] || undefined
    const res = await activityApi.getActivityList({
      category,
      status: 'published',
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize,
    })

    if (isLoadMore) {
      activityList.value = [...activityList.value, ...res.list]
    } else {
      activityList.value = res.list
    }

    loadStatus.value = res.hasMore ? 'more' : 'noMore'
  } catch (err: any) {
    console.error('获取活动列表失败', err)
    if (!isLoadMore) {
      activityList.value = []
    }
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    loadStatus.value = 'more'
  }
}

/** 搜索 */
function handleSearch(val: string) {
  keyword.value = val
  fetchActivityList()
}

/** 切换分类 */
function handleCategoryChange(category: string) {
  if (currentCategory.value === category) return
  currentCategory.value = category
  fetchActivityList()
}

/** 点击活动卡片 */
function handleActivityClick(activity: Activity) {
  uni.navigateTo({
    url: `/pages/activity/detail?id=${activity.id}`,
  })
}

// ==================== 生命周期 ====================
onShow(() => {
  fetchActivityList()
})

onPullDownRefresh(async () => {
  isRefreshing.value = true
  await fetchActivityList()
  isRefreshing.value = false
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (loadStatus.value === 'more') {
    page.value++
    fetchActivityList(true)
  }
})
</script>

<template>
  <view class="activity-list">
    <!-- 搜索框 -->
    <view class="activity-list__search">
      <wd-search
        v-model="keyword"
        placeholder="搜索活动"
        cancel-txt="搜索"
        @search="handleSearch"
        @clear="handleSearch('')"
      />
    </view>

    <!-- 分类筛选 -->
    <scroll-view scroll-x class="activity-list__categories" :show-scrollbar="false">
      <view class="activity-list__categories-inner">
        <view
          v-for="cat in categories"
          :key="cat"
          class="activity-list__category-item"
          @click="handleCategoryChange(cat)"
        >
          <wd-tag
            :type="currentCategory === cat ? 'primary' : 'default'"
            :plain="currentCategory !== cat"
            round
          >
            {{ cat }}
          </wd-tag>
        </view>
      </view>
    </scroll-view>

    <!-- 活动列表 -->
    <view class="activity-list__content">
      <!-- 空状态 -->
      <EmptyState
        v-if="!activityList.length && loadStatus !== 'loading'"
        text="暂无活动"
        icon="calendar"
      />

      <!-- 活动卡片列表 -->
      <view v-else class="activity-list__cards">
        <ActivityCard
          v-for="item in activityList"
          :key="item.id"
          :activity="item"
          @click="handleActivityClick"
        />

        <!-- 加载更多 -->
        <LoadMore :status="loadStatus" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.activity-list {
  min-height: 100vh;
  background-color: $color-bg;

  &__search {
    padding: 16rpx 24rpx;
    background-color: #fff;
  }

  &__categories {
    white-space: nowrap;
    background-color: #fff;
    border-bottom: 1rpx solid $color-border;
  }

  &__categories-inner {
    display: inline-flex;
    padding: 16rpx 24rpx;
    gap: 16rpx;
  }

  &__category-item {
    flex-shrink: 0;
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
