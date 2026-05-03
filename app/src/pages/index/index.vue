<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as statsApi from '@/services/stats'
import * as activityApi from '@/services/activity'
import StatsCard from '@/components/StatsCard.vue'
import RankingItem from '@/components/RankingItem.vue'
import ActivityCard from '@/components/ActivityCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Activity } from '@/types/activity'

const userStore = useUserStore()

// ==================== Banner 数据 ====================
const bannerList = ref<any[]>([])

// ==================== 平台统计数据 ====================
const overview = reactive({
  totalVolunteers: 0,
  totalServiceHours: 0,
  totalHelpCount: 0,
})

// ==================== 荣誉榜单 ====================
const activeTab = ref(0)
const activityRanking = ref<any[]>([])
const donationRanking = ref<any[]>([])

// ==================== 活跃之星 ====================
const activeStars = ref<any[]>([])

// ==================== 近期活动 ====================
const recentActivities = ref<Activity[]>([])

// ==================== 加载状态 ====================
const loading = ref(false)

// ==================== 快捷入口配置 ====================
const quickEntries = [
  { text: '活动大厅', icon: 'calendar', url: '/pages/activity/list' },
  { text: '捐助通道', icon: 'gift', url: '/pages/donation/submit' },
  { text: '我的积分', icon: 'star', url: '/pages/points/index' },
  { text: '爱心集市', icon: 'shop', url: '/pages/market/list' },
  { text: '积分商城', icon: 'goods-collect', url: '/pages/mall/list' },
  { text: '排行榜', icon: 'chart-bar', url: '/pages/ranking/index' },
]

// ==================== Banner 占位数据 ====================
const defaultBanners = [
  { id: 1, image: '', title: '加入众爱联盟，传递温暖力量', color: '#07c160' },
  { id: 2, image: '', title: '志愿服务，让世界更美好', color: '#10aeff' },
  { id: 3, image: '', title: '每一份爱心都值得被记录', color: '#fa9d3b' },
]

// ==================== 数据加载 ====================

/**
 * 加载所有首页数据
 */
async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      loadBanners(),
      loadOverview(),
      loadRankings(),
      loadActiveStars(),
      loadRecentActivities(),
    ])
  } catch (err) {
    console.error('加载首页数据失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 加载 Banner 数据
 */
async function loadBanners() {
  try {
    // 尝试从接口获取，失败则使用占位数据
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: '/api/banners',
        method: 'GET',
        success: (res: any) => resolve(res.data),
        fail: () => resolve(null),
      })
    })
    if (res && Array.isArray(res.data)) {
      bannerList.value = res.data
    } else {
      bannerList.value = defaultBanners
    }
  } catch {
    bannerList.value = defaultBanners
  }
}

/**
 * 加载平台统计数据
 */
async function loadOverview() {
  try {
    const res = await statsApi.getOverview()
    if (res) {
      overview.totalVolunteers = res.totalVolunteers || 0
      overview.totalServiceHours = res.totalServiceHours || 0
      overview.totalHelpCount = res.totalHelpCount || 0
    }
  } catch {
    // 使用默认占位数据
    overview.totalVolunteers = 12680
    overview.totalServiceHours = 89520
    overview.totalHelpCount = 35600
  }
}

/**
 * 加载荣誉榜单
 */
async function loadRankings() {
  try {
    // 尝试从接口获取榜单数据
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: '/api/rankings',
        method: 'GET',
        success: (res: any) => resolve(res.data),
        fail: () => resolve(null),
      })
    })
    if (res) {
      activityRanking.value = (res.activityRanking || []).slice(0, 3)
      donationRanking.value = (res.donationRanking || []).slice(0, 3)
    } else {
      // 占位数据
      activityRanking.value = [
        { id: '1', nickname: '爱心达人小王', avatarUrl: '', points: 12860 },
        { id: '2', nickname: '志愿者小李', avatarUrl: '', points: 10520 },
        { id: '3', nickname: '公益先锋', avatarUrl: '', points: 9380 },
      ]
      donationRanking.value = [
        { id: '4', nickname: '大爱无疆', avatarUrl: '', points: 25600 },
        { id: '5', nickname: '温暖传递者', avatarUrl: '', points: 18900 },
        { id: '6', nickname: '爱心使者', avatarUrl: '', points: 15200 },
      ]
    }
  } catch {
    activityRanking.value = []
    donationRanking.value = []
  }
}

/**
 * 加载活跃之星
 */
async function loadActiveStars() {
  try {
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: '/api/active-stars',
        method: 'GET',
        success: (res: any) => resolve(res.data),
        fail: () => resolve(null),
      })
    })
    if (res && Array.isArray(res.data)) {
      activeStars.value = res.data
    } else {
      // 占位数据
      activeStars.value = [
        { id: '1', nickname: '小王', avatarUrl: '' },
        { id: '2', nickname: '小李', avatarUrl: '' },
        { id: '3', nickname: '小张', avatarUrl: '' },
        { id: '4', nickname: '小赵', avatarUrl: '' },
        { id: '5', nickname: '小陈', avatarUrl: '' },
        { id: '6', nickname: '小刘', avatarUrl: '' },
      ]
    }
  } catch {
    activeStars.value = []
  }
}

/**
 * 加载近期活动
 */
async function loadRecentActivities() {
  try {
    const res = await activityApi.getActivityList({
      status: 'published',
      pageSize: 3,
    })
    if (res && res.list) {
      recentActivities.value = res.list
    }
  } catch {
    recentActivities.value = []
  }
}

// ==================== 事件处理 ====================

/**
 * 格式化数字（超过万显示 x.xw）
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return String(num)
}

/**
 * 快捷入口点击
 */
function onQuickEntryClick(entry: { url: string }) {
  uni.navigateTo({ url: entry.url })
}

/**
 * 查看全部排行榜
 */
function goRanking() {
  uni.navigateTo({ url: '/pages/ranking/index' })
}

/**
 * 查看全部活动
 */
function goActivityList() {
  uni.switchTab({ url: '/pages/activity/list' })
}

/**
 * 活动卡片点击
 */
function onActivityClick(activity: Activity) {
  uni.navigateTo({ url: `/pages/activity/detail?id=${activity.id}` })
}

// ==================== 生命周期 ====================

onShow(() => {
  loadAllData()
})

onPullDownRefresh(async () => {
  try {
    await loadAllData()
  } finally {
    uni.stopPullDownRefresh()
  }
})
</script>

<template>
  <view class="home-page">
    <!-- 下拉刷新 + 滚动容器 -->
    <scroll-view scroll-y class="home-page__scroll" :refresher-enabled="true" refresher-default-style="none" @refresherrefresh="loadAllData">
      <!-- 自定义下拉刷新提示 -->
      <template #refresher>
        <view class="home-page__refresh">
          <wd-loading size="40rpx" color="#07c160" />
          <text class="home-page__refresh-text">刷新中...</text>
        </view>
      </template>

      <!-- Banner 轮播图 -->
      <view class="home-page__banner">
        <swiper
          class="home-page__swiper"
          indicator-dots
          indicator-color="rgba(255,255,255,0.4)"
          indicator-active-color="#fff"
          autoplay
          circular
          :interval="4000"
          :duration="500"
        >
          <swiper-item v-for="item in bannerList" :key="item.id">
            <view
              class="home-page__banner-item"
              :style="{ backgroundColor: item.color || '#07c160' }"
            >
              <image
                v-if="item.image"
                :src="item.image"
                class="home-page__banner-img"
                mode="aspectFill"
              />
              <text v-else class="home-page__banner-title">{{ item.title }}</text>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 平台公益数据 -->
      <view class="home-page__section">
        <view class="home-page__stats">
          <StatsCard
            label="总志愿者数"
            :value="formatNumber(overview.totalVolunteers)"
            icon="friends"
            color="primary"
          />
          <StatsCard
            label="总服务时长(h)"
            :value="formatNumber(overview.totalServiceHours)"
            icon="clock"
            color="warning"
          />
          <StatsCard
            label="总帮助人次"
            :value="formatNumber(overview.totalHelpCount)"
            icon="heart"
            color="danger"
          />
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="home-page__section">
        <view class="home-page__card">
          <wd-grid :column="3" :border="false" clickable>
            <wd-grid-item
              v-for="entry in quickEntries"
              :key="entry.text"
              :text="entry.text"
              :icon="entry.icon"
              icon-size="48rpx"
              icon-color="#07c160"
              @click="onQuickEntryClick(entry)"
            />
          </wd-grid>
        </view>
      </view>

      <!-- 荣誉榜单 -->
      <view class="home-page__section">
        <view class="home-page__card">
          <view class="home-page__section-header">
            <text class="home-page__section-title">荣誉榜单</text>
          </view>

          <wd-tabs v-model="activeTab" custom-class="home-page__tabs">
            <wd-tab title="活动积分榜" name="activity">
              <view class="home-page__ranking-list">
                <template v-if="activityRanking.length > 0">
                  <RankingItem
                    v-for="(item, index) in activityRanking"
                    :key="item.id"
                    :rank="index + 1"
                    :user="item"
                  />
                </template>
                <EmptyState v-else text="暂无排行数据" />
              </view>
            </wd-tab>
            <wd-tab title="捐助大爱榜" name="donation">
              <view class="home-page__ranking-list">
                <template v-if="donationRanking.length > 0">
                  <RankingItem
                    v-for="(item, index) in donationRanking"
                    :key="item.id"
                    :rank="index + 1"
                    :user="item"
                  />
                </template>
                <EmptyState v-else text="暂无排行数据" />
              </view>
            </wd-tab>
          </wd-tabs>

          <!-- 查看全部 -->
          <view class="home-page__more" @click="goRanking">
            <text class="home-page__more-text">查看全部</text>
            <wd-icon name="arrow-right" size="28rpx" color="#999" />
          </view>
        </view>
      </view>

      <!-- 近期活跃之星 -->
      <view class="home-page__section" v-if="activeStars.length > 0">
        <view class="home-page__card">
          <view class="home-page__section-header">
            <text class="home-page__section-title">近期活跃之星</text>
          </view>
          <scroll-view scroll-x class="home-page__stars-scroll">
            <view class="home-page__stars-list">
              <view
                v-for="star in activeStars"
                :key="star.id"
                class="home-page__star-item"
              >
                <view class="home-page__star-avatar">
                  <image
                    v-if="star.avatarUrl"
                    :src="star.avatarUrl"
                    class="home-page__star-img"
                    mode="aspectFill"
                  />
                  <view v-else class="home-page__star-placeholder">
                    <wd-icon name="user" size="36rpx" color="#ccc" />
                  </view>
                </view>
                <text class="home-page__star-name">{{ star.nickname }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 近期活动推荐 -->
      <view class="home-page__section">
        <view class="home-page__section-header">
          <text class="home-page__section-title">近期活动推荐</text>
          <view class="home-page__more-inline" @click="goActivityList">
            <text class="home-page__more-text">更多</text>
            <wd-icon name="arrow-right" size="24rpx" color="#999" />
          </view>
        </view>

        <template v-if="recentActivities.length > 0">
          <ActivityCard
            v-for="activity in recentActivities"
            :key="activity.id"
            :activity="activity"
            @click="onActivityClick(activity)"
          />
        </template>
        <EmptyState v-else text="暂无活动" icon="calendar" />
      </view>

      <!-- 底部安全区域 -->
      <view class="home-page__safe-bottom" />
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background-color: #f5f5f5;

  &__scroll {
    height: 100vh;
  }

  // 下拉刷新
  &__refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 0;
    gap: 12rpx;
  }

  &__refresh-text {
    font-size: 24rpx;
    color: #999;
  }

  // Banner 轮播
  &__banner {
    padding: 24rpx 24rpx 0;
  }

  &__swiper {
    height: 300rpx;
    border-radius: 16rpx;
    overflow: hidden;
  }

  &__banner-item {
    width: 100%;
    height: 300rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__banner-img {
    width: 100%;
    height: 100%;
  }

  &__banner-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 2rpx;
    padding: 0 40rpx;
    text-align: center;
  }

  // 通用区块
  &__section {
    padding: 24rpx 24rpx 0;
  }

  &__card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
  }

  &__section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }

  // 统计卡片
  &__stats {
    display: flex;
    gap: 16rpx;
  }

  &__stats > * {
    flex: 1;
  }

  // Tabs
  &__tabs {
    margin: 0 -24rpx;
  }

  // 排行榜
  &__ranking-list {
    padding: 0 24rpx;
  }

  // 查看更多
  &__more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 16rpx;
    margin-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;
    gap: 4rpx;
  }

  &__more-inline {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  &__more-text {
    font-size: 26rpx;
    color: #999;
  }

  // 活跃之星
  &__stars-scroll {
    white-space: nowrap;
  }

  &__stars-list {
    display: flex;
    gap: 32rpx;
    padding: 8rpx 0;
  }

  &__star-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
  }

  &__star-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    overflow: hidden;
    border: 4rpx solid #07c160;
  }

  &__star-img {
    width: 100%;
    height: 100%;
  }

  &__star-placeholder {
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__star-name {
    font-size: 22rpx;
    color: #666;
    max-width: 96rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  // 底部安全区域
  &__safe-bottom {
    height: 120rpx;
  }
}
</style>
