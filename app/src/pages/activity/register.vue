<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as activityApi from '@/services/activity'
import type { Activity } from '@/types/activity'
import { formatDate } from '@/utils/format'

const userStore = useUserStore()

// ==================== 数据 ====================
const activityId = ref<number>(0)
const activity = ref<Activity | null>(null)
const loading = ref(true)
const submitting = ref(false)
const remark = ref('')

// ==================== 方法 ====================

/** 获取活动详情 */
async function fetchActivityDetail() {
  try {
    loading.value = true
    const detail = await activityApi.getActivityDetail(activityId.value)
    activity.value = detail
  } catch (err: any) {
    console.error('获取活动详情失败', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 提交报名 */
async function handleSubmit() {
  if (!activityId.value) {
    uni.showToast({ title: '活动信息异常', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    await activityApi.registerActivity(activityId.value)

    uni.showToast({
      title: '报名成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      },
    })
  } catch (err: any) {
    console.error('报名失败', err)
    uni.showToast({ title: err.message || '报名失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options?.activityId) {
    activityId.value = Number(options.activityId)
  }
})

onShow(() => {
  if (activityId.value) {
    fetchActivityDetail()
  }
})
</script>

<template>
  <view class="activity-register">
    <!-- 加载状态 -->
    <view v-if="loading" class="activity-register__loading">
      <wd-loading size="48rpx" />
    </view>

    <template v-else-if="activity">
      <!-- 活动简要信息 -->
      <view class="activity-register__info">
        <view class="activity-register__info-card">
          <text class="activity-register__info-title">{{ activity.title }}</text>
          <view class="activity-register__info-row">
            <wd-icon name="clock" size="28rpx" color="#999" />
            <text class="activity-register__info-text">
              {{ formatDate(activity.startTime) }} ~ {{ formatDate(activity.endTime) }}
            </text>
          </view>
          <view class="activity-register__info-row">
            <wd-icon name="location" size="28rpx" color="#999" />
            <text class="activity-register__info-text">{{ activity.location || '待定' }}</text>
          </view>
          <view class="activity-register__info-row">
            <wd-icon name="gift" size="28rpx" color="#999" />
            <text class="activity-register__info-text">+{{ activity.rewardPoints }}积分奖励</text>
          </view>
        </view>
      </view>

      <!-- 报名表单 -->
      <view class="activity-register__form">
        <view class="activity-register__form-title">报名信息</view>

        <wd-textarea
          v-model="remark"
          placeholder="请输入备注信息（选填）"
          :maxlength="200"
          show-word-limit
          :rows="4"
        />
      </view>

      <!-- 提交按钮 -->
      <view class="activity-register__submit">
        <wd-button
          type="primary"
          block
          size="large"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          确认报名
        </wd-button>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="activity-register__empty">
      <wd-icon name="warning" size="120rpx" color="#ddd" />
      <text class="activity-register__empty-text">活动信息不存在</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.activity-register {
  min-height: 100vh;
  background-color: $color-bg;
  padding: 24rpx;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__info {
    margin-bottom: 24rpx;
  }

  &__info-card {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  &__info-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 20rpx;
    line-height: 1.4;
  }

  &__info-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
  }

  &__info-text {
    font-size: 26rpx;
    color: #999;
  }

  &__form {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: 24rpx;
    margin-bottom: 48rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  &__form-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 20rpx;
    padding-left: 16rpx;
    border-left: 6rpx solid $color-primary;
  }

  &__submit {
    padding: 0 24rpx;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #ccc;
  }
}
</style>
