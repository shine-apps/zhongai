<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import * as userApi from '@/services/user'
import { isEmpty, isIdCard } from '@/utils/validator'

const userStore = useUserStore()

// ==================== 表单数据 ====================
const realName = ref<string>('')
const idCardNo = ref<string>('')
const submitting = ref<boolean>(false)

/** 是否已认证 */
const isVerified = computed(() => userStore.userInfo?.realNameVerified || false)

/** 已认证的姓名 */
const verifiedName = computed(() => userStore.userInfo?.realName || '')

/** 表单校验 */
function validate(): boolean {
  if (isEmpty(realName.value)) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return false
  }
  if (realName.value.length < 2) {
    uni.showToast({ title: '姓名至少2个字符', icon: 'none' })
    return false
  }
  if (isEmpty(idCardNo.value)) {
    uni.showToast({ title: '请输入身份证号', icon: 'none' })
    return false
  }
  if (!isIdCard(idCardNo.value)) {
    uni.showToast({ title: '请输入正确的身份证号', icon: 'none' })
    return false
  }
  return true
}

/** 提交实名认证 */
async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    await userApi.submitRealName(realName.value, idCardNo.value)
    uni.showToast({ title: '认证提交成功', icon: 'success' })

    // 刷新用户信息
    await userStore.fetchUserInfo()

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="realname-page">
    <!-- 已认证状态 -->
    <view v-if="isVerified" class="verified-section">
      <view class="verified-card">
        <view class="verified-card__icon">
          <wd-icon name="check-circle" size="80rpx" color="#07c160" />
        </view>
        <text class="verified-card__title">已完成实名认证</text>
        <text class="verified-card__name">姓名：{{ verifiedName }}</text>
        <text class="verified-card__status">认证状态：已认证</text>
      </view>
    </view>

    <!-- 未认证状态 -->
    <view v-else class="form-wrapper">
      <!-- 提示 -->
      <view class="notice-bar">
        <wd-icon name="warning" size="28rpx" color="#ff9900" />
        <text class="notice-bar__text">
          实名信息仅用于公益记录，严格保密
        </text>
      </view>

      <!-- 真实姓名 -->
      <view class="form-section">
        <view class="form-label">真实姓名</view>
        <wd-input
          v-model="realName"
          placeholder="请输入真实姓名"
          :maxlength="20"
          clearable
        />
      </view>

      <!-- 身份证号 -->
      <view class="form-section">
        <view class="form-label">身份证号</view>
        <wd-input
          v-model="idCardNo"
          placeholder="请输入18位身份证号"
          :maxlength="18"
          clearable
        />
      </view>

      <!-- 提交按钮 -->
      <view class="submit-action">
        <wd-button
          type="primary"
          block
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          提交认证
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.realname-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.verified-section {
  padding: 60rpx 24rpx;
}

.verified-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 60rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;

  &__icon {
    margin-bottom: 16rpx;
  }

  &__title {
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
  }

  &__name {
    font-size: 28rpx;
    color: #666;
  }

  &__status {
    font-size: 26rpx;
    color: #07c160;
    font-weight: 500;
  }
}

.form-wrapper {
  padding: 20rpx 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background-color: #fff8ee;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;

  &__text {
    font-size: 24rpx;
    color: #ff9900;
    line-height: 1.5;
  }
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.submit-action {
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
