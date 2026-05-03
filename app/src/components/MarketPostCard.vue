<script setup lang="ts">
import type { MarketPost, MarketPostType } from '@/types/market'

interface Props {
  post: MarketPost
}

defineProps<Props>()

defineEmits<{
  (e: 'click', post: MarketPost): void
}>()

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
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<template>
  <view class="post-card" @click="$emit('click', post)">
    <!-- 帖子类型标签 -->
    <view class="post-card__header">
      <view
        class="post-card__tag"
        :style="{ color: postTypeConfig[post.postType].color, backgroundColor: postTypeConfig[post.postType].bgColor }"
      >
        {{ postTypeConfig[post.postType].label }}
      </view>
    </view>

    <!-- 标题 -->
    <view class="post-card__title">
      {{ post.title }}
    </view>

    <!-- 内容摘要 -->
    <view class="post-card__summary">
      {{ post.content }}
    </view>

    <!-- 底部信息 -->
    <view class="post-card__footer">
      <text class="post-card__author">发布人</text>
      <view class="post-card__points-tag">
        <text class="post-card__points-value">{{ post.pointsCost }}积分</text>
      </view>
      <text class="post-card__time">{{ formatTime(post.createdAt) }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.post-card {
  background-color: #fff;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &__header {
    margin-bottom: 12rpx;
  }

  &__tag {
    display: inline-block;
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: $border-radius-round;
    font-weight: 500;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 12rpx;
  }

  &__summary {
    font-size: 26rpx;
    color: $color-text-secondary;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 16rpx;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__author {
    font-size: 24rpx;
    color: #999;
    flex-shrink: 0;
  }

  &__points-tag {
    flex-shrink: 0;
    background-color: #fff7e6;
    padding: 2rpx 12rpx;
    border-radius: $border-radius-round;
  }

  &__points-value {
    font-size: 22rpx;
    color: $color-warning;
    font-weight: 500;
  }

  &__time {
    font-size: 22rpx;
    color: #ccc;
    margin-left: auto;
    flex-shrink: 0;
  }
}
</style>
