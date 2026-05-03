<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as marketApi from '@/services/market'
import type { MarketPost, MarketPostType } from '@/types/market'
import MarketPostCard from '@/components/MarketPostCard.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== 搜索与筛选 ====================
const keyword = ref('')
const categories: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: '招聘', value: 'job_recruit' },
  { label: '求职', value: 'job_seek' },
  { label: '闲置出售', value: 'idle_sell' },
  { label: '求购', value: 'idle_buy' },
]
const currentCategory = ref('')

// ==================== 列表数据 ====================
const postList = ref<MarketPost[]>([])
const page = ref(1)
const pageSize = 10
const loadStatus = ref<'more' | 'loading' | 'noMore'>('more')

/** 加载帖子列表 */
async function fetchPostList(isLoadMore = false) {
  if (loadStatus.value === 'loading') return

  try {
    loadStatus.value = 'loading'

    if (!isLoadMore) {
      page.value = 1
    }

    const res = await marketApi.getPostList({
      postType: currentCategory.value || undefined,
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize,
    })

    if (isLoadMore) {
      postList.value = [...postList.value, ...res.list]
    } else {
      postList.value = res.list
    }

    loadStatus.value = res.hasMore ? 'more' : 'noMore'
  } catch (err: any) {
    console.error('获取帖子列表失败', err)
    if (!isLoadMore) {
      postList.value = []
    }
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    loadStatus.value = 'more'
  }
}

/** 搜索 */
function handleSearch(val: string) {
  keyword.value = val
  fetchPostList()
}

/** 切换分类 */
function handleCategoryChange(value: string) {
  if (currentCategory.value === value) return
  currentCategory.value = value
  fetchPostList()
}

/** 点击帖子 */
function handlePostClick(post: MarketPost) {
  uni.navigateTo({
    url: `/pages/market/detail?id=${post.id}`,
  })
}

/** 点击发布按钮 */
function handlePublish() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/index' })
    }, 1500)
    return
  }
  uni.navigateTo({ url: '/pages/market/publish' })
}

// ==================== 生命周期 ====================
onShow(() => {
  fetchPostList()
})

onPullDownRefresh(async () => {
  await fetchPostList()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (loadStatus.value === 'more') {
    page.value++
    fetchPostList(true)
  }
})
</script>

<template>
  <view class="market-list">
    <!-- 搜索框 -->
    <view class="market-list__search">
      <wd-search
        v-model="keyword"
        placeholder="搜索帖子"
        cancel-txt="搜索"
        @search="handleSearch"
        @clear="handleSearch('')"
      />
    </view>

    <!-- 分类筛选 -->
    <scroll-view scroll-x class="market-list__categories" :show-scrollbar="false">
      <view class="market-list__categories-inner">
        <view
          v-for="cat in categories"
          :key="cat.value"
          class="market-list__category-item"
          @click="handleCategoryChange(cat.value)"
        >
          <wd-tag
            :type="currentCategory === cat.value ? 'primary' : 'default'"
            :plain="currentCategory !== cat.value"
            round
          >
            {{ cat.label }}
          </wd-tag>
        </view>
      </view>
    </scroll-view>

    <!-- 帖子列表 -->
    <view class="market-list__content">
      <EmptyState
        v-if="!postList.length && loadStatus !== 'loading'"
        text="暂无帖子"
        icon="goods-collect"
      />

      <view v-else class="market-list__cards">
        <MarketPostCard
          v-for="item in postList"
          :key="item.id"
          :post="item"
          @click="handlePostClick"
        />
        <LoadMore :status="loadStatus" />
      </view>
    </view>

    <!-- 悬浮发布按钮 -->
    <view class="market-list__fab" @click="handlePublish">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.market-list {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 120rpx;

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
    padding: $spacing-md;
  }

  &__cards {
    display: flex;
    flex-direction: column;
  }

  &__fab {
    position: fixed;
    right: 40rpx;
    bottom: 200rpx;
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $color-primary, $color-primary-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.4);
    z-index: 100;

    &:active {
      opacity: 0.85;
      transform: scale(0.95);
    }
  }
}
</style>
