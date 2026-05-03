<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { usePointsStore } from '@/stores/points'
import * as marketApi from '@/services/market'
import * as uploadApi from '@/services/upload'
import type { MarketPostType } from '@/types/market'

const userStore = useUserStore()
const pointsStore = usePointsStore()

// ==================== 表单数据 ====================
const postType = ref<MarketPostType>('job_recruit')
const title = ref('')
const content = ref('')
const imageList = ref<string[]>([])
const contactInfo = ref('')
const pointTypeUsed = ref<'activity' | 'donation'>('activity')

// ==================== 提交状态 ====================
const submitting = ref(false)

/** 帖子类型选项 */
const postTypeOptions: { label: string; value: MarketPostType }[] = [
  { label: '招聘', value: 'job_recruit' },
  { label: '求职', value: 'job_seek' },
  { label: '闲置出售', value: 'idle_sell' },
  { label: '求购', value: 'idle_buy' },
]

/** 当前选中积分余额 */
const currentPointsBalance = computed<number>(() => {
  return pointTypeUsed.value === 'activity'
    ? pointsStore.activityBalance
    : pointsStore.donationBalance
})

/** 当前积分类型标签 */
const currentPointsLabel = computed<string>(() => {
  return pointTypeUsed.value === 'activity' ? '活动积分' : '捐助积分'
})

/** 发布消耗积分（固定值） */
const publishCost = 10

/** 表单验证 */
function validateForm(): boolean {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return false
  }
  if (title.value.trim().length > 50) {
    uni.showToast({ title: '标题不能超过50个字', icon: 'none' })
    return false
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入详细内容', icon: 'none' })
    return false
  }
  if (!contactInfo.value.trim()) {
    uni.showToast({ title: '请输入联系方式', icon: 'none' })
    return false
  }
  if (currentPointsBalance.value < publishCost) {
    uni.showToast({ title: `${currentPointsLabel.value}余额不足`, icon: 'none' })
    return false
  }
  return true
}

/** 选择图片 */
function handleChooseImage() {
  const remainCount = 9 - imageList.value.length
  if (remainCount <= 0) {
    uni.showToast({ title: '最多上传9张图片', icon: 'none' })
    return
  }

  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths
      uni.showLoading({ title: '上传中...', mask: true })

      try {
        for (const filePath of tempFilePaths) {
          const result = await uploadApi.uploadImage(filePath)
          imageList.value.push(result.url)
        }
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (err: any) {
        uni.hideLoading()
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      }
    },
  })
}

/** 删除图片 */
function handleRemoveImage(index: number) {
  imageList.value.splice(index, 1)
}

/** 预览图片 */
function handlePreviewImage(index: number) {
  uni.previewImage({
    current: index,
    urls: imageList.value,
  })
}

/** 提交发布 */
async function handleSubmit() {
  if (submitting.value) return

  if (!validateForm()) return

  try {
    // 确认弹窗
    await uni.showModal({
      title: '确认发布',
      content: `确认消耗 ${publishCost} ${currentPointsLabel.value} 发布该信息？`,
      confirmText: '确认发布',
      confirmColor: '#07c160',
    })

    submitting.value = true
    uni.showLoading({ title: '发布中...', mask: true })

    await marketApi.createPost({
      postType: postType.value,
      title: title.value.trim(),
      content: content.value.trim(),
      images: imageList.value.length ? imageList.value : undefined,
      contactInfo: contactInfo.value.trim(),
      pointTypeUsed: pointTypeUsed.value,
    })

    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })

    // 刷新积分余额
    await pointsStore.refreshBalance()

    setTimeout(() => {
      uni.redirectTo({ url: '/pages/market/list' })
    }, 1500)
  } catch (err: any) {
    uni.hideLoading()
    // 用户取消操作
    if (err?.errMsg?.includes('cancel')) return
    console.error('发布失败', err)
    uni.showToast({ title: err.message || '发布失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================
onShow(async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  // 刷新积分余额
  await pointsStore.refreshBalance()
})
</script>

<template>
  <view class="publish-page">
    <!-- 信息类型选择 -->
    <view class="publish-page__section">
      <text class="publish-page__label">信息类型</text>
      <wd-radio-group v-model="postType" shape="button" cell>
        <wd-radio
          v-for="opt in postTypeOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </wd-radio>
      </wd-radio-group>
    </view>

    <!-- 标题 -->
    <view class="publish-page__section">
      <text class="publish-page__label">标题</text>
      <wd-input
        v-model="title"
        placeholder="请输入标题（最多50字）"
        :maxlength="50"
        show-word-limit
        clearable
      />
    </view>

    <!-- 详细内容 -->
    <view class="publish-page__section">
      <text class="publish-page__label">详细内容</text>
      <wd-textarea
        v-model="content"
        placeholder="请输入详细描述信息"
        :maxlength="2000"
        show-word-limit
        :auto-height="false"
        custom-style="min-height: 240rpx;"
      />
    </view>

    <!-- 上传图片 -->
    <view class="publish-page__section">
      <text class="publish-page__label">上传图片（选填，最多9张）</text>
      <view class="publish-page__images">
        <view
          v-for="(img, index) in imageList"
          :key="index"
          class="publish-page__image-item"
          @click="handlePreviewImage(index)"
        >
          <wd-img
            :src="img"
            width="100%"
            height="100%"
            mode="aspectFill"
            custom-style="border-radius: 12rpx;"
          />
          <view class="publish-page__image-remove" @click.stop="handleRemoveImage(index)">
            <wd-icon name="close" size="24rpx" color="#fff" />
          </view>
        </view>
        <view
          v-if="imageList.length < 9"
          class="publish-page__image-add"
          @click="handleChooseImage"
        >
          <wd-icon name="add" size="48rpx" color="#ccc" />
          <text class="publish-page__image-add-text">{{ imageList.length }}/9</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="publish-page__section">
      <text class="publish-page__label">联系方式</text>
      <wd-input
        v-model="contactInfo"
        placeholder="请输入联系电话或微信号"
        clearable
      />
    </view>

    <!-- 积分支付方式 -->
    <view class="publish-page__section">
      <text class="publish-page__label">积分支付方式</text>
      <view class="publish-page__points-options">
        <view
          class="publish-page__points-option"
          :class="{ 'publish-page__points-option--active': pointTypeUsed === 'activity' }"
          @click="pointTypeUsed = 'activity'"
        >
          <view class="publish-page__points-option-header">
            <wd-radio :model-value="pointTypeUsed" value="activity" @change="pointTypeUsed = 'activity'" />
            <text class="publish-page__points-option-name">活动积分</text>
          </view>
          <text class="publish-page__points-option-balance">当前余额：{{ pointsStore.activityBalance }}</text>
        </view>
        <view
          class="publish-page__points-option"
          :class="{ 'publish-page__points-option--active': pointTypeUsed === 'donation' }"
          @click="pointTypeUsed = 'donation'"
        >
          <view class="publish-page__points-option-header">
            <wd-radio :model-value="pointTypeUsed" value="donation" @change="pointTypeUsed = 'donation'" />
            <text class="publish-page__points-option-name">捐助积分</text>
          </view>
          <text class="publish-page__points-option-balance">当前余额：{{ pointsStore.donationBalance }}</text>
        </view>
      </view>
    </view>

    <!-- 积分消耗提示 -->
    <view class="publish-page__cost-tip">
      <text class="publish-page__cost-text">发布消耗：{{ publishCost }} {{ currentPointsLabel }}</text>
    </view>

    <!-- 底部占位 -->
    <view class="publish-page__bottom-placeholder" />

    <!-- 底部固定按钮 -->
    <view class="publish-page__footer">
      <wd-button
        type="primary"
        block
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        确认发布
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.publish-page {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 140rpx;

  &__section {
    background-color: #fff;
    padding: $spacing-md;
    margin-bottom: $spacing-sm;
  }

  &__label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 16rpx;
  }

  // ==================== 图片上传 ====================
  &__images {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  &__image-item {
    position: relative;
    width: calc((100% - 32rpx) / 3);
    height: 200rpx;
    border-radius: 12rpx;
    overflow: hidden;
  }

  &__image-remove {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__image-add {
    width: calc((100% - 32rpx) / 3);
    height: 200rpx;
    border-radius: 12rpx;
    border: 2rpx dashed #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background-color: #fafafa;
  }

  &__image-add-text {
    font-size: 22rpx;
    color: #ccc;
  }

  // ==================== 积分选项 ====================
  &__points-options {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &__points-option {
    padding: $spacing-md;
    border: 2rpx solid $color-border;
    border-radius: $border-radius-md;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    &--active {
      border-color: $color-primary;
      background-color: #f0faf4;
    }
  }

  &__points-option-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__points-option-name {
    font-size: 28rpx;
    color: $color-text;
    font-weight: 500;
  }

  &__points-option-balance {
    font-size: 24rpx;
    color: #999;
    padding-left: 56rpx;
  }

  // ==================== 消耗提示 ====================
  &__cost-tip {
    padding: $spacing-md;
    text-align: center;
  }

  &__cost-text {
    font-size: 26rpx;
    color: $color-warning;
    font-weight: 500;
  }

  // ==================== 底部 ====================
  &__bottom-placeholder {
    height: 120rpx;
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: $spacing-md;
    padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
    background-color: #fff;
    box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    z-index: 100;
  }
}
</style>
