<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as mallApi from '@/services/mall'
import type { MallProduct } from '@/types/mall'
import ProductCard from '@/components/ProductCard.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== 搜索与筛选 ====================
const keyword = ref('')
const categories = ['全部', '实物奖品', '虚拟权益', '推荐商品']
const currentCategory = ref('全部')

/** 分类值映射 */
const categoryValueMap: Record<string, { productType?: string; isFeatured?: boolean }> = {
  '全部': {},
  '实物奖品': { productType: 'physical' },
  '虚拟权益': { productType: 'virtual' },
  '推荐商品': { isFeatured: true },
}

// ==================== 列表数据 ====================
const productList = ref<MallProduct[]>([])
const page = ref(1)
const pageSize = 10
const loadStatus = ref<'more' | 'loading' | 'noMore'>('more')
const isRefreshing = ref(false)

/** 加载商品列表 */
async function fetchProductList(isLoadMore = false) {
  if (loadStatus.value === 'loading') return

  try {
    loadStatus.value = 'loading'

    if (!isLoadMore) {
      page.value = 1
    }

    const filter = categoryValueMap[currentCategory.value] || {}
    const res = await mallApi.getProductList({
      keyword: keyword.value || undefined,
      productType: filter.productType,
      isFeatured: filter.isFeatured,
      page: page.value,
      pageSize,
    })

    if (isLoadMore) {
      productList.value = [...productList.value, ...res.list]
    } else {
      productList.value = res.list
    }

    loadStatus.value = res.hasMore ? 'more' : 'noMore'
  } catch (err: any) {
    console.error('获取商品列表失败', err)
    if (!isLoadMore) {
      productList.value = []
    }
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    loadStatus.value = 'more'
  }
}

/** 搜索 */
function handleSearch(val: string) {
  keyword.value = val
  fetchProductList()
}

/** 切换分类 */
function handleCategoryChange(category: string) {
  if (currentCategory.value === category) return
  currentCategory.value = category
  fetchProductList()
}

/** 点击商品卡片 */
function handleProductClick(product: MallProduct) {
  uni.navigateTo({
    url: `/pages/mall/detail?id=${product.id}`,
  })
}

// ==================== 生命周期 ====================
onShow(() => {
  fetchProductList()
})

onPullDownRefresh(async () => {
  isRefreshing.value = true
  await fetchProductList()
  isRefreshing.value = false
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (loadStatus.value === 'more') {
    page.value++
    fetchProductList(true)
  }
})
</script>

<template>
  <view class="mall-list">
    <!-- 搜索框 -->
    <view class="mall-list__search">
      <wd-search
        v-model="keyword"
        placeholder="搜索商品"
        cancel-txt="搜索"
        @search="handleSearch"
        @clear="handleSearch('')"
      />
    </view>

    <!-- 分类筛选 -->
    <scroll-view scroll-x class="mall-list__categories" :show-scrollbar="false">
      <view class="mall-list__categories-inner">
        <view
          v-for="cat in categories"
          :key="cat"
          class="mall-list__category-item"
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

    <!-- 商品列表 -->
    <view class="mall-list__content">
      <!-- 空状态 -->
      <EmptyState
        v-if="!productList.length && loadStatus !== 'loading'"
        text="暂无商品"
        icon="goods"
      />

      <!-- 两列网格布局 -->
      <view v-else class="mall-list__grid">
        <view
          v-for="item in productList"
          :key="item.id"
          class="mall-list__grid-item"
        >
          <ProductCard
            :product="item"
            @click="handleProductClick"
          />
        </view>

        <!-- 加载更多 -->
        <view class="mall-list__load-more">
          <LoadMore :status="loadStatus" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.mall-list {
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

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  &__grid-item {
    width: calc((100% - 20rpx) / 2);
  }

  &__load-more {
    width: 100%;
  }
}
</style>
