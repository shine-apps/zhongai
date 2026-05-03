<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { usePointsStore } from '@/stores/points'
import { formatDate } from '@/utils/format'

const userStore = useUserStore()
const pointsStore = usePointsStore()

const loading = ref<boolean>(true)

/** 是否已登录 */
const isLoggedIn = computed(() => userStore.isLoggedIn)

/** 用户信息 */
const userInfo = computed(() => userStore.userInfo)

/** 荣誉等级星星 */
const honorStars = computed(() => {
  const level = userInfo.value?.honorLevel || 0
  return Array.from({ length: 5 }, (_, i) => i < level)
})

/** 加入时间 */
const joinedAtText = computed(() => {
  if (!userInfo.value?.joinedAt) return ''
  return formatDate(userInfo.value.joinedAt, 'YYYY-MM-DD') + ' 加入'
})

/** 认证状态文字 */
const realNameStatus = computed(() => {
  return userInfo.value?.realNameVerified ? '已认证' : '未认证'
})

/** 加载数据 */
async function loadData() {
  loading.value = true
  try {
    if (isLoggedIn.value) {
      await Promise.all([
        userStore.fetchUserInfo(),
        pointsStore.refreshBalance(),
      ])
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 跳转登录 */
function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

/** 跳转积分页 */
function goPoints() {
  uni.switchTab({ url: '/pages/points/index' })
}

/** 跳转我的活动报名 */
function goMyActivities() {
  uni.navigateTo({ url: '/pages/activity/list' })
}

/** 跳转捐助记录 */
function goMyDonations() {
  uni.navigateTo({ url: '/pages/donation/records' })
}

/** 跳转我的集市帖子 */
function goMyPosts() {
  uni.navigateTo({ url: '/pages/market/list' })
}

/** 跳转兑换订单 */
function goMyOrders() {
  uni.navigateTo({ url: '/pages/mall/orders' })
}

/** 跳转编辑资料 */
function goEditProfile() {
  if (!isLoggedIn.value) {
    goLogin()
    return
  }
  uni.navigateTo({ url: '/pages/profile/edit' })
}

/** 跳转实名认证 */
function goRealName() {
  if (!isLoggedIn.value) {
    goLogin()
    return
  }
  uni.navigateTo({ url: '/pages/profile/realname' })
}

/** 联系客服 */
function contactService() {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

/** 跳转意见反馈 */
function goFeedback() {
  uni.navigateTo({ url: '/pages/profile/feedback' })
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<template>
  <view class="profile-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-card">
      <view class="user-card__bg" />
      <view class="user-card__content">
        <!-- 未登录 -->
        <view v-if="!isLoggedIn" class="user-card__login" @click="goLogin">
          <view class="user-card__avatar user-card__avatar--empty">
            <wd-icon name="user" size="60rpx" color="#ccc" />
          </view>
          <text class="user-card__login-text">点击登录</text>
        </view>

        <!-- 已登录 -->
        <view v-else class="user-card__info">
          <view class="user-card__top">
            <wd-img
              :src="userInfo?.avatarUrl || ''"
              round
              width="120rpx"
              height="120rpx"
              custom-style="border: 4rpx solid rgba(255,255,255,0.5);"
              @click="goEditProfile"
            />
            <view class="user-card__detail">
              <text class="user-card__nickname">{{ userInfo?.nickname || '用户' }}</text>
              <text v-if="userInfo?.memberNo" class="user-card__member-no">
                会员编号: {{ userInfo.memberNo }}
              </text>
              <view class="user-card__honor">
                <wd-icon
                  v-for="(star, index) in honorStars"
                  :key="index"
                  name="star"
                  size="24rpx"
                  color="#ff9900"
                />
                <wd-icon
                  v-for="(star, index) in (5 - honorStars.length)"
                  :key="'empty-' + index"
                  name="star"
                  size="24rpx"
                  color="#ddd"
                />
              </view>
            </view>
          </view>
          <text v-if="joinedAtText" class="user-card__joined">{{ joinedAtText }}</text>
        </view>
      </view>
    </view>

    <!-- 我的双积分 -->
    <view class="points-section">
      <view class="points-card points-card--activity" @click="goPoints">
        <text class="points-card__label">活动积分</text>
        <text class="points-card__value">{{ pointsStore.activityBalance }}</text>
      </view>
      <view class="points-card points-card--donation" @click="goPoints">
        <text class="points-card__label">捐助积分</text>
        <text class="points-card__value">{{ pointsStore.donationBalance }}</text>
      </view>
    </view>

    <!-- 我的足迹 -->
    <view class="section">
      <view class="section__header">
        <text class="section__title">我的足迹</text>
      </view>
      <wd-cell-group border>
        <wd-cell title="我的活动报名" is-link @click="goMyActivities" />
        <wd-cell title="我的捐助记录" is-link @click="goMyDonations" />
        <wd-cell title="我的集市帖子" is-link @click="goMyPosts" />
        <wd-cell title="我的兑换订单" is-link @click="goMyOrders" />
      </wd-cell-group>
    </view>

    <!-- 功能列表 -->
    <view class="section">
      <view class="section__header">
        <text class="section__title">功能</text>
      </view>
      <wd-cell-group border>
        <wd-cell title="编辑资料" is-link @click="goEditProfile" />
        <wd-cell
          title="实名认证"
          is-link
          :value="realNameStatus"
          @click="goRealName"
        />
        <wd-cell title="联系客服" is-link @click="contactService" />
        <wd-cell title="意见反馈" is-link @click="goFeedback" />
      </wd-cell-group>
    </view>
  </view>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.user-card {
  position: relative;
  overflow: hidden;

  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 400rpx;
    background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
    border-radius: 0 0 40rpx 40rpx;
  }

  &__content {
    position: relative;
    z-index: 1;
    padding: calc(40rpx + env(safe-area-inset-top)) 32rpx 32rpx;
  }

  &__login {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 40rpx 0;
  }

  &__avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    overflow: hidden;
    border: 4rpx solid rgba(255, 255, 255, 0.5);

    &--empty {
      background-color: rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__login-text {
    font-size: 30rpx;
    color: #fff;
    font-weight: 500;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  &__detail {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__nickname {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
  }

  &__member-no {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  &__honor {
    display: flex;
    gap: 4rpx;
    margin-top: 4rpx;
  }

  &__joined {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 8rpx;
  }
}

.points-section {
  display: flex;
  gap: 20rpx;
  padding: 0 24rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 2;
}

.points-card {
  flex: 1;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  &--activity {
    border-top: 6rpx solid #07c160;
  }

  &--donation {
    border-top: 6rpx solid #ff9900;
  }

  &__label {
    font-size: 24rpx;
    color: #999;
  }

  &__value {
    font-size: 44rpx;
    font-weight: 700;
    color: #333;
  }
}

.section {
  margin: 24rpx 24rpx 0;

  &__header {
    padding: 16rpx 0;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }
}
</style>
