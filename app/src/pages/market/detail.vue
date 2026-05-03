<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as marketApi from '@/services/market'
import type { MarketPost, MarketPostType } from '@/types/market'

const userStore = useUserStore()

// ==================== 数据 ====================
const postId = ref<number>(0)
const post = ref<MarketPost | null>(null)
const loading = ref(true)

/** 是否是自己的帖子 */
const isOwnPost = computed<boolean>(() => {
  return !!post.value && post.value.userId === userStore.userInfo?.id
})

/** 帖子类型配置 */
const postTypeConfig: Record<MarketPostType, { label: string; color: string; bgColor: string }> = {
  job_recruit: { label: '招聘', color: '#1989fa', bgColor: '#ecf5ff' },
  job_seek: { label: '求职', color: '#07c160', bgColor: '#e8f8ef' },
  idle_sell: { label: '闲置出售', color: '#ff9900', bgColor: '#fff7e6' },
  idle_buy: { label: '求购', color: '#7232dd', bgColor: '#f4efff' },
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/** 积分类型标签 */
function getPointTypeLabel(type: 'activity' | 'donation'): string {
  return type === 'activity' ? '活动积分' : '捐助积分'
}

/** 加载帖子详情 */
async function fetchPostDetail() {
  try {
    loading.value = true
    post.value = await marketApi.getPostDetail(postId.value)
  } catch (err: any) {
    console.error('获取帖子详情失败', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 预览图片 */
function previewImage(index: number) {
  if (!post.value) return
  uni.previewImage({
    current: index,
    urls: post.value.images,
  })
}

/** 删除帖子 */
async function handleDelete() {
  try {
    await uni.showModal({
      title: '提示',
      content: '确定要删除该帖子吗？删除后不可恢复。',
      confirmColor: '#ee0a24',
    })

    await marketApi.deletePost(postId.value)
    uni.showToast({ title: '删除成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err: any) {
    // 用户取消操作
    if (err?.errMsg?.includes('cancel')) return
    console.error('删除帖子失败', err)
    uni.showToast({ title: err.message || '删除失败', icon: 'none' })
  }
}

/** 复制联系方式 */
function handleCopyContact() {
  if (!post.value) return
  uni.setClipboardData({
    data: post.value.contactInfo,
    success: () => {
      uni.showToast({ title: '已复制联系方式', icon: 'success' })
    },
  })
}

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options?.id) {
    postId.value = Number(options.id)
    fetchPostDetail()
  }
})
</script>

<template>
  <view class="post-detail">
    <!-- 加载状态 -->
    <view v-if="loading" class="post-detail__loading">
      <wd-loading size="48rpx" color="#999" />
    </view>

    <template v-else-if="post">
      <!-- 帖子类型标签 + 标题 -->
      <view class="post-detail__header">
        <view
          class="post-detail__tag"
          :style="{ color: postTypeConfig[post.postType].color, backgroundColor: postTypeConfig[post.postType].bgColor }"
        >
          {{ postTypeConfig[post.postType].label }}
        </view>
        <view class="post-detail__title">{{ post.title }}</view>
      </view>

      <!-- 发布人信息 -->
      <view class="post-detail__author">
        <view class="post-detail__author-avatar">
          <wd-icon name="user" size="36rpx" color="#ccc" />
        </view>
        <view class="post-detail__author-info">
          <text class="post-detail__author-name">用户{{ post.userId }}</text>
          <text class="post-detail__author-time">{{ formatTime(post.createdAt) }}</text>
        </view>
      </view>

      <!-- 帖子内容 -->
      <view class="post-detail__content">
        <text class="post-detail__content-text">{{ post.content }}</text>
      </view>

      <!-- 图片展示 -->
      <view v-if="post.images && post.images.length" class="post-detail__images">
        <view
          v-for="(img, index) in post.images"
          :key="index"
          class="post-detail__image-item"
          @click="previewImage(index)"
        >
          <wd-img
            :src="img"
            width="100%"
            height="100%"
            mode="aspectFill"
            custom-style="border-radius: 12rpx;"
          />
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="post-detail__contact">
        <view class="post-detail__contact-card">
          <view class="post-detail__contact-header">
            <wd-icon name="phone" size="32rpx" color="#07c160" />
            <text class="post-detail__contact-title">联系方式</text>
          </view>
          <view class="post-detail__contact-body">
            <text class="post-detail__contact-value">{{ post.contactInfo }}</text>
          </view>
          <view class="post-detail__contact-action" @click="handleCopyContact">
            <text class="post-detail__contact-btn">复制</text>
          </view>
        </view>
      </view>

      <!-- 积分消耗信息 -->
      <view class="post-detail__points">
        <view class="post-detail__points-card">
          <text class="post-detail__points-label">发布消耗</text>
          <view class="post-detail__points-info">
            <text class="post-detail__points-value">{{ post.pointsCost }}</text>
            <text class="post-detail__points-unit">{{ getPointTypeLabel(post.pointTypeUsed) }}</text>
          </view>
        </view>
      </view>

      <!-- 删除按钮（仅自己的帖子） -->
      <view v-if="isOwnPost" class="post-detail__delete">
        <wd-button type="error" plain block @click="handleDelete">删除帖子</wd-button>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="post-detail__empty">
      <wd-icon name="warning" size="80rpx" color="#ddd" />
      <text class="post-detail__empty-text">帖子不存在或已被删除</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.post-detail {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 40rpx;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120rpx 0;
  }

  // ==================== 头部 ====================
  &__header {
    background-color: #fff;
    padding: $spacing-md $spacing-md $spacing-md;
    border-bottom: 1rpx solid $color-border;
  }

  &__tag {
    display: inline-block;
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: $border-radius-round;
    font-weight: 500;
    margin-bottom: 16rpx;
  }

  &__title {
    font-size: 36rpx;
    font-weight: 700;
    color: $color-text;
    line-height: 1.4;
  }

  // ==================== 发布人 ====================
  &__author {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background-color: #fff;
    padding: $spacing-md;
    border-bottom: 1rpx solid $color-border;
  }

  &__author-avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__author-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__author-name {
    font-size: 28rpx;
    color: $color-text;
    font-weight: 500;
  }

  &__author-time {
    font-size: 24rpx;
    color: #999;
  }

  // ==================== 内容 ====================
  &__content {
    background-color: #fff;
    padding: $spacing-md;
    margin-top: $spacing-sm;
  }

  &__content-text {
    font-size: 28rpx;
    color: $color-text;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-all;
  }

  // ==================== 图片 ====================
  &__images {
    background-color: #fff;
    padding: 0 $spacing-md $spacing-md;
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  &__image-item {
    width: calc((100% - 32rpx) / 3);
    height: 220rpx;
    border-radius: 12rpx;
    overflow: hidden;
  }

  // ==================== 联系方式 ====================
  &__contact {
    padding: $spacing-md;
  }

  &__contact-card {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    border: 1rpx solid $color-border;
  }

  &__contact-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;
  }

  &__contact-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $color-text;
  }

  &__contact-body {
    margin-bottom: 16rpx;
  }

  &__contact-value {
    font-size: 28rpx;
    color: $color-text-secondary;
    line-height: 1.5;
    word-break: break-all;
  }

  &__contact-action {
    display: flex;
    justify-content: flex-end;
  }

  &__contact-btn {
    font-size: 26rpx;
    color: $color-primary;
    padding: 8rpx 24rpx;
    border: 1rpx solid $color-primary;
    border-radius: $border-radius-round;
  }

  // ==================== 积分 ====================
  &__points {
    padding: 0 $spacing-md;
  }

  &__points-card {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1rpx solid $color-border;
  }

  &__points-label {
    font-size: 28rpx;
    color: $color-text-secondary;
  }

  &__points-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__points-value {
    font-size: 36rpx;
    font-weight: 700;
    color: $color-warning;
  }

  &__points-unit {
    font-size: 24rpx;
    color: #999;
  }

  // ==================== 删除 ====================
  &__delete {
    padding: $spacing-lg $spacing-md;
  }

  // ==================== 空状态 ====================
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 160rpx 0;
    gap: 24rpx;
  }

  &__empty-text {
    font-size: 28rpx;
    color: #ccc;
  }
}
</style>
