<script setup lang="ts">
interface PointTransaction {
  id: string
  userId: string
  pointType: string
  changeType: string
  amount: number
  balanceAfter: number
  sourceType: string
  sourceId?: string
  description?: string
  createdAt: string
}

interface Props {
  transaction: PointTransaction
}

defineProps<Props>()

defineEmits<{
  (e: 'click', transaction: PointTransaction): void
}>()

/** 积分类型图标映射 */
const sourceTypeIconMap: Record<string, string> = {
  activity_checkin: 'calendar',
  activity_organize: 'calendar',
  donation: 'gift',
  task_complete: 'task',
  admin_grant: 'add-circle',
  admin_deduct: 'move-circle',
  sign_in: 'calendar',
  other: 'list',
}

/** 积分类型中文映射 */
const sourceTypeMap: Record<string, string> = {
  activity_checkin: '活动签到',
  activity_organize: '组织活动',
  donation: '爱心捐助',
  task_complete: '完成任务',
  admin_grant: '管理员发放',
  admin_deduct: '管理员扣除',
  sign_in: '每日签到',
  other: '其他',
}

/** 是否为收入 */
function isIncome(changeType: string): boolean {
  return changeType === 'earn'
}

/** 获取图标名 */
function getIconName(sourceType: string): string {
  return sourceTypeIconMap[sourceType] || 'list'
}

/** 获取来源描述 */
function getSourceLabel(sourceType: string): string {
  return sourceTypeMap[sourceType] || sourceType
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
</script>

<template>
  <view class="transaction-item" @click="$emit('click', transaction)">
    <!-- 左侧：图标 -->
    <view class="transaction-item__icon">
      <wd-icon :name="getIconName(transaction.sourceType)" size="40rpx" color="#666" />
    </view>

    <!-- 中间：描述 -->
    <view class="transaction-item__center">
      <text class="transaction-item__label">
        {{ transaction.description || getSourceLabel(transaction.sourceType) }}
      </text>
      <text class="transaction-item__time">{{ formatTime(transaction.createdAt) }}</text>
    </view>

    <!-- 右侧：金额 -->
    <view class="transaction-item__amount">
      <text
        class="transaction-item__amount-value"
        :class="{
          'transaction-item__amount--income': isIncome(transaction.changeType),
          'transaction-item__amount--expense': !isIncome(transaction.changeType),
        }"
      >
        {{ isIncome(transaction.changeType) ? '+' : '-' }}{{ Math.abs(transaction.amount) }}
      </text>
    </view>

    <!-- 底部分割线 -->
    <view class="transaction-item__divider" />
  </view>
</template>

<style scoped lang="scss">
.transaction-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  position: relative;

  &__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 20rpx;
  }

  &__center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__label {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    font-size: 22rpx;
    color: #bbb;
  }

  &__amount {
    flex-shrink: 0;
    margin-left: 20rpx;
  }

  &__amount-value {
    font-size: 32rpx;
    font-weight: 700;
    line-height: 1;
  }

  &__amount--income {
    color: #07c160;
  }

  &__amount--expense {
    color: #ee0a24;
  }

  &__divider {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1rpx;
    background-color: #f0f0f0;
  }
}
</style>
