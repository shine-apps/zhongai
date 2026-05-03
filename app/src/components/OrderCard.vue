<script setup lang="ts">
import type { MallOrder, OrderStatus } from '@/types/mall'
import { formatDate } from '@/utils/format'

interface Props {
  order: MallOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', order: MallOrder): void
}>()

/** 状态中文映射 */
const statusMap: Record<OrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

/** 状态标签类型映射 */
function getStatusType(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'warning',
    processing: 'primary',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

function handleClick() {
  emit('click', props.order)
}
</script>

<template>
  <view class="order-card" @click="handleClick">
    <!-- 顶部：订单编号 + 状态标签 -->
    <view class="order-card__header">
      <text class="order-card__order-no">订单号: {{ order.orderNo }}</text>
      <wd-tag
        :type="getStatusType(order.status)"
        plain
        round
        size="small"
      >
        {{ statusMap[order.status] || order.status }}
      </wd-tag>
    </view>

    <!-- 中间：商品数量 + 积分消耗 -->
    <view class="order-card__body">
      <view class="order-card__info-row">
        <text class="order-card__info-label">商品数量</text>
        <text class="order-card__info-value">{{ order.totalItems }} 件</text>
      </view>
      <view v-if="order.activityPointsUsed > 0" class="order-card__info-row">
        <text class="order-card__info-label">活动积分</text>
        <text class="order-card__info-value order-card__info-value--points">
          -{{ order.activityPointsUsed }}
        </text>
      </view>
      <view v-if="order.donationPointsUsed > 0" class="order-card__info-row">
        <text class="order-card__info-label">捐助积分</text>
        <text class="order-card__info-value order-card__info-value--points">
          -{{ order.donationPointsUsed }}
        </text>
      </view>
    </view>

    <!-- 底部：创建时间 -->
    <view class="order-card__footer">
      <text class="order-card__time">{{ formatDate(order.createdAt) }}</text>
      <view class="order-card__arrow">
        <wd-icon name="arrow-right" size="28rpx" color="#ccc" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid $color-border;
  }

  &__order-no {
    font-size: 24rpx;
    color: #999;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 16rpx;
  }

  &__body {
    padding: 20rpx 0;
    border-bottom: 1rpx solid $color-border;
  }

  &__info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__info-label {
    font-size: 26rpx;
    color: #666;
  }

  &__info-value {
    font-size: 26rpx;
    color: #333;
    font-weight: 500;

    &--points {
      color: $color-danger;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16rpx;
  }

  &__time {
    font-size: 24rpx;
    color: #ccc;
  }

  &__arrow {
    display: flex;
    align-items: center;
  }
}
</style>
