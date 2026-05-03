<script setup lang="ts">
interface User {
  id: string
  nickname: string
  avatarUrl?: string
  points: number
}

interface Props {
  rank: number
  user: User
}

defineProps<Props>()

defineEmits<{
  (e: 'click', user: User): void
}>()

/** 获取奖牌样式 */
function getMedalStyle(rank: number): { emoji: string; bg: string; color: string } | null {
  const medals: Record<number, { emoji: string; bg: string; color: string }> = {
    1: { emoji: '🥇', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#fff' },
    2: { emoji: '🥈', bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#fff' },
    3: { emoji: '🥉', bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', color: '#fff' },
  }
  return medals[rank] || null
}

/** 格式化积分 */
function formatPoints(points: number): string {
  if (points >= 10000) {
    return (points / 10000).toFixed(1) + 'w'
  }
  return String(points)
}
</script>

<template>
  <view class="ranking-item" @click="$emit('click', user)">
    <!-- 排名 -->
    <view class="ranking-item__rank">
      <template v-if="getMedalStyle(rank)">
        <view
          class="ranking-item__medal"
          :style="{ background: getMedalStyle(rank)!.bg }"
        >
          <text class="ranking-item__medal-emoji">{{ getMedalStyle(rank)!.emoji }}</text>
        </view>
      </template>
      <template v-else>
        <text class="ranking-item__rank-num">{{ rank }}</text>
      </template>
    </view>

    <!-- 头像 -->
    <view class="ranking-item__avatar">
      <wd-img
        v-if="user.avatarUrl"
        :src="user.avatarUrl"
        width="80rpx"
        height="80rpx"
        mode="aspectFill"
        round
      />
      <view v-else class="ranking-item__avatar-placeholder">
        <wd-icon name="user" size="40rpx" color="#ccc" />
      </view>
    </view>

    <!-- 昵称 -->
    <view class="ranking-item__name">
      <text class="ranking-item__name-text">{{ user.nickname }}</text>
    </view>

    <!-- 积分 -->
    <view class="ranking-item__points">
      <text class="ranking-item__points-value">{{ formatPoints(user.points) }}</text>
      <text class="ranking-item__points-label">积分</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.ranking-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  gap: 20rpx;

  &__rank {
    width: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__medal {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__medal-emoji {
    font-size: 30rpx;
  }

  &__rank-num {
    font-size: 32rpx;
    font-weight: 700;
    color: #999;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__avatar-placeholder {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    flex: 1;
    min-width: 0;
  }

  &__name-text {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  &__points {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  &__points-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #fa9d3b;
    line-height: 1.2;
  }

  &__points-label {
    font-size: 20rpx;
    color: #999;
    line-height: 1.2;
  }
}
</style>
