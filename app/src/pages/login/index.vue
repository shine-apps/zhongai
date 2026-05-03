<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

/** 登录加载状态 */
const loading = ref(false)

/** 协议勾选状态 */
const agreed = ref(false)

/**
 * 微信一键登录
 */
async function handleLogin() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return
  }

  if (loading.value) return
  loading.value = true

  try {
    // 1. 调用 uni.login 获取微信 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      })
    })

    if (!loginRes.code) {
      uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
      return
    }

    // 2. 将 code 发送到后端，完成登录并存储 token 和用户信息
    await userStore.login(loginRes.code)

    uni.showToast({ title: '登录成功', icon: 'success' })

    // 3. 跳转到首页（TabBar 页使用 switchTab）
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (err: any) {
    console.error('登录失败:', err)
    uni.showToast({
      title: err?.message || '登录失败，请重试',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

/**
 * 跳转用户协议
 */
function goAgreement() {
  uni.navigateTo({ url: '/pages/profile/agreement' })
}

/**
 * 跳转隐私政策
 */
function goPrivacy() {
  uni.navigateTo({ url: '/pages/profile/privacy' })
}
</script>

<template>
  <view class="login-page">
    <!-- 顶部装饰背景 -->
    <view class="login-page__bg">
      <view class="login-page__bg-circle login-page__bg-circle--1" />
      <view class="login-page__bg-circle login-page__bg-circle--2" />
    </view>

    <!-- 主内容区 -->
    <view class="login-page__content">
      <!-- Logo 区域 -->
      <view class="login-page__logo">
        <view class="login-page__logo-icon">
          <wd-icon name="heart" size="96rpx" color="#fff" />
        </view>
        <text class="login-page__app-name">众爱联盟</text>
        <text class="login-page__app-desc">让每一份爱心都被看见</text>
      </view>

      <!-- 登录按钮 -->
      <view class="login-page__action">
        <wd-button
          type="primary"
          block
          round
          size="large"
          :loading="loading"
          loading-type="ring"
          custom-class="login-page__btn"
          @click="handleLogin"
        >
          <wd-icon name="chat" size="36rpx" />
          <text class="login-page__btn-text">微信一键登录</text>
        </wd-button>

        <!-- 协议勾选 -->
        <view class="login-page__agreement">
          <wd-checkbox
            v-model="agreed"
            shape="square"
            size="28rpx"
            custom-class="login-page__checkbox"
          />
          <text class="login-page__agreement-text">
            登录即表示同意
            <text class="login-page__agreement-link" @click="goAgreement">《用户协议》</text>
            和
            <text class="login-page__agreement-link" @click="goPrivacy">《隐私政策》</text>
          </text>
        </view>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="login-page__footer">
      <text class="login-page__footer-text">众爱联盟 v1.0.0</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
  padding: 0 60rpx;

  // 装饰背景
  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 600rpx;
    background: linear-gradient(135deg, #07c160 0%, #38d976 100%);
    border-radius: 0 0 60rpx 60rpx;
    z-index: 0;
  }

  &__bg-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);

    &--1 {
      width: 300rpx;
      height: 300rpx;
      top: -80rpx;
      right: -60rpx;
    }

    &--2 {
      width: 200rpx;
      height: 200rpx;
      top: 200rpx;
      left: -40rpx;
    }
  }

  // 主内容
  &__content {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-top: 120rpx;
  }

  // Logo
  &__logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 160rpx;
  }

  &__logo-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 40rpx;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    backdrop-filter: blur(10px);
  }

  &__app-name {
    font-size: 52rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 4rpx;
    margin-bottom: 16rpx;
  }

  &__app-desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 2rpx;
  }

  // 操作区
  &__action {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__btn {
    width: 100% !important;
    height: 96rpx !important;
    background: linear-gradient(135deg, #07c160, #06ad56) !important;
    border: none !important;
    font-size: 32rpx !important;
    box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
  }

  &__btn-text {
    margin-left: 12rpx;
    font-size: 32rpx;
  }

  // 协议
  &__agreement {
    display: flex;
    align-items: flex-start;
    margin-top: 32rpx;
    padding: 0 20rpx;
  }

  &__checkbox {
    margin-top: 4rpx;
    margin-right: 12rpx;
    flex-shrink: 0;
  }

  &__agreement-text {
    font-size: 22rpx;
    color: #999;
    line-height: 1.6;
  }

  &__agreement-link {
    color: #07c160;
  }

  // 底部
  &__footer {
    position: relative;
    z-index: 1;
    padding-bottom: 60rpx;
  }

  &__footer-text {
    font-size: 22rpx;
    color: #ccc;
  }
}
</style>
