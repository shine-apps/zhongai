<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import * as userApi from '@/services/user'
import * as uploadApi from '@/services/upload'
import { isEmpty } from '@/utils/validator'

const userStore = useUserStore()

// ==================== 表单数据 ====================
const nickname = ref<string>(userStore.userInfo?.nickname || '')
const avatarUrl = ref<string>(userStore.userInfo?.avatarUrl || '')
const phone = ref<string>(userStore.userInfo?.phone || '')
const submitting = ref<boolean>(false)

/** 手机号脱敏显示 */
const maskedPhone = computed(() => {
  if (!phone.value) return ''
  return phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

/** 表单校验 */
function validate(): boolean {
  if (isEmpty(nickname.value)) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return false
  }
  if (nickname.value.length > 20) {
    uni.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
    return false
  }
  return true
}

/** 选择头像 */
function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      try {
        uni.showLoading({ title: '上传中...' })
        const result = await uploadApi.uploadImage(tempFilePath)
        avatarUrl.value = result.url
        uni.hideLoading()
      } catch (e: any) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      }
    },
  })
}

/** 保存资料 */
async function handleSave() {
  if (!validate()) return

  submitting.value = true
  try {
    const data: Record<string, any> = {
      nickname: nickname.value,
    }
    if (avatarUrl.value) {
      data.avatarUrl = avatarUrl.value
    }

    const updatedUser = await userApi.updateMyInfo(data)
    userStore.updateUserInfo(updatedUser)
    uni.showToast({ title: '保存成功', icon: 'success' })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="edit-profile-page">
    <!-- 头像 -->
    <view class="form-section">
      <view class="avatar-row">
        <text class="form-label">头像</text>
        <view class="avatar-wrapper" @click="chooseAvatar">
          <wd-img
            v-if="avatarUrl"
            :src="avatarUrl"
            round
            width="120rpx"
            height="120rpx"
            custom-style="border: 2rpx solid #eee;"
          />
          <view v-else class="avatar-placeholder">
            <wd-icon name="camera" size="48rpx" color="#ccc" />
          </view>
          <wd-icon name="arrow-right" size="28rpx" color="#ccc" />
        </view>
      </view>
    </view>

    <!-- 昵称 -->
    <view class="form-section">
      <view class="form-label">昵称</view>
      <wd-input
        v-model="nickname"
        placeholder="请输入昵称"
        :maxlength="20"
        clearable
      />
    </view>

    <!-- 手机号 -->
    <view class="form-section">
      <view class="form-label">手机号</view>
      <wd-input
        v-if="phone"
        :model-value="maskedPhone"
        placeholder="已绑定手机号"
        disabled
      />
      <wd-input
        v-else
        model-value=""
        placeholder="未绑定手机号"
        disabled
      />
    </view>

    <!-- 保存按钮 -->
    <view class="submit-action">
      <wd-button
        type="primary"
        block
        :loading="submitting"
        :disabled="submitting"
        @click="handleSave"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.edit-profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
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

.avatar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar-row .form-label {
  margin-bottom: 0;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #eee;
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
