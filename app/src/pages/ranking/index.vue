<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as rankingApi from '@/services/ranking'
import type { RankingItem, ActiveStar } from '@/types/ranking'
import RankingItemComp from '@/components/RankingItem.vue'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'

const userStore = useUserStore()

// ==================== Tab 状态 ====================
const mainTab = ref(0) // 0: 活动积分榜, 1: 捐助大爱榜
const activitySubTab = ref('all') // all | monthly
const donationSubTab = ref('all') // all | yearly

// ==================== 列表数据 ====================
const rankingList = ref<RankingItem[]>([])
const page = ref(1)
const pageSize = 20
const loadStatus = ref<'more' | 'loading' | 'noMore'>('more')

// ==================== 活跃之星 ====================
const activeStars = ref<ActiveStar[]>([])

/** 加载排行榜数据 */
async function fetchRankingList(isLoadMore = false) {
  if (loadStatus.value === 'loading') return

  try {
    loadStatus.value = 'loading'

    if (!isLoadMore) {
      page.value = 1
    }

    let res
    if (mainTab.value === 0) {
      // 活动积分榜
      res = await rankingApi.getActivityRanking({
        period: activitySubTab.value,
        page: page.value,
        pageSize,
      })
    } else {
      // 捐助大爱榜
      res = await rankingApi.getDonationRanking({
        period: donationSubTab.value,
        page: page.value,
        pageSize,
      })
    }

    if (isLoadMore) {
      rankingList.value = [...rankingList.value, ...res.list]
    } else {
      rankingList.value = res.list
    }

    loadStatus.value = res.hasMore ? 'more' : 'noMore'
  } catch (err: any) {
    console.error('获取排行榜失败', err)
    if (!isLoadMore) {
      rankingList.value = []
    }
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    loadStatus.value = 'more'
  }
}

/** 加载活跃之星 */
async function fetchActiveStars() {
  try {
    activeStars.value = await rankingApi.getActiveStars()
  } catch (err: any) {
    console.error('获取活跃之星失败', err)
  }
}

/** 主 Tab 切换 */
function handleMainTabChange({ index }: { index: number }) {
  mainTab.value = index
  rankingList.value = []
  loadStatus.value = 'more'
  fetchRankingList()
}

/** 活动子 Tab 切换 */
function handleActivitySubTabChange(val: string) {
  activitySubTab.value = val
  rankingList.value = []
  loadStatus.value = 'more'
  fetchRankingList()
}

/** 捐助子 Tab 切换 */
function handleDonationSubTabChange(val: string) {
  donationSubTab.value = val
  rankingList.value = []
  loadStatus.value = 'more'
  fetchRankingList()
}

/** 点击排行项 */
function handleRankingClick(user: any) {
  // 可跳转到用户主页
  console.log('点击排行项', user)
}

// ==================== 生命周期 ====================
onShow(() => {
  fetchRankingList()
  fetchActiveStars()
})

onPullDownRefresh(async () => {
  await Promise.all([fetchRankingList(), fetchActiveStars()])
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (loadStatus.value === 'more') {
    page.value++
    fetchRankingList(true)
  }
})
</script>

<template>
  <view class="ranking-page">
    <!-- 近期活跃之星 -->
    <view class="ranking-page__stars">
      <view class="ranking-page__stars-title">
        <text class="ranking-page__stars-title-text">近期活跃之星</text>
      </view>
      <scroll-view scroll-x class="ranking-page__stars-scroll" :show-scrollbar="false">
        <view class="ranking-page__stars-list">
          <view
            v-for="star in activeStars"
            :key="star.userId"
            class="ranking-page__star-item"
          >
            <view class="ranking-page__star-avatar">
              <wd-img
                v-if="star.avatarUrl"
                :src="star.avatarUrl"
                width="88rpx"
                height="88rpx"
                mode="aspectFill"
                round
              />
              <view v-else class="ranking-page__star-placeholder">
                <wd-icon name="user" size="40rpx" color="#ccc" />
              </view>
            </view>
            <text class="ranking-page__star-name">{{ star.nickname }}</text>
            <text class="ranking-page__star-count">{{ star.checkinCount }}次签到</text>
          </view>
          <view v-if="!activeStars.length" class="ranking-page__star-empty">
            <text class="ranking-page__star-empty-text">暂无数据</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 主 Tab 切换 -->
    <wd-tabs v-model="mainTab" @change="handleMainTabChange">
      <!-- 活动积分榜 -->
      <wd-tab title="活动积分榜">
        <view class="ranking-page__sub-tabs">
          <wd-radio-group v-model="activitySubTab" shape="button" @change="handleActivitySubTabChange">
            <wd-radio value="all">总榜</wd-radio>
            <wd-radio value="monthly">月度榜</wd-radio>
          </wd-radio-group>
        </view>

        <view class="ranking-page__list">
          <EmptyState
            v-if="!rankingList.length && loadStatus !== 'loading'"
            text="暂无排行数据"
            icon="trophy"
          />

          <template v-else>
            <RankingItemComp
              v-for="item in rankingList"
              :key="item.userId"
              :rank="item.rank"
              :user="{
                id: String(item.userId),
                nickname: item.nickname,
                avatarUrl: item.avatarUrl,
                points: item.points,
              }"
              @click="handleRankingClick"
            />
            <LoadMore :status="loadStatus" />
          </template>
        </view>
      </wd-tab>

      <!-- 捐助大爱榜 -->
      <wd-tab title="捐助大爱榜">
        <view class="ranking-page__sub-tabs">
          <wd-radio-group v-model="donationSubTab" shape="button" @change="handleDonationSubTabChange">
            <wd-radio value="all">总榜</wd-radio>
            <wd-radio value="yearly">年度榜</wd-radio>
          </wd-radio-group>
        </view>

        <view class="ranking-page__list">
          <EmptyState
            v-if="!rankingList.length && loadStatus !== 'loading'"
            text="暂无排行数据"
            icon="heart"
          />

          <template v-else>
            <RankingItemComp
              v-for="item in rankingList"
              :key="item.userId"
              :rank="item.rank"
              :user="{
                id: String(item.userId),
                nickname: item.nickname,
                avatarUrl: item.avatarUrl,
                points: item.points,
              }"
              @click="handleRankingClick"
            />
            <LoadMore :status="loadStatus" />
          </template>
        </view>
      </wd-tab>
    </wd-tabs>
  </view>
</template>

<style scoped lang="scss">
.ranking-page {
  min-height: 100vh;
  background-color: $color-bg;

  // ==================== 活跃之星 ====================
  &__stars {
    background-color: #fff;
    padding: $spacing-md;
    margin-bottom: $spacing-sm;
  }

  &__stars-title {
    margin-bottom: $spacing-md;
  }

  &__stars-title-text {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text;
  }

  &__stars-scroll {
    white-space: nowrap;
  }

  &__stars-list {
    display: inline-flex;
    gap: 32rpx;
    padding: 8rpx 0;
  }

  &__star-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 120rpx;
  }

  &__star-avatar {
    margin-bottom: 8rpx;
  }

  &__star-placeholder {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__star-name {
    font-size: 22rpx;
    color: $color-text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120rpx;
    text-align: center;
  }

  &__star-count {
    font-size: 20rpx;
    color: #999;
    margin-top: 4rpx;
  }

  &__star-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 40rpx;
  }

  &__star-empty-text {
    font-size: 24rpx;
    color: #ccc;
  }

  // ==================== 子 Tab ====================
  &__sub-tabs {
    padding: $spacing-md;
    background-color: #fff;
    border-bottom: 1rpx solid $color-border;
  }

  // ==================== 列表 ====================
  &__list {
    padding: 0 $spacing-md;
  }
}
</style>
