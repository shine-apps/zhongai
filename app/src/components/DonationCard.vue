<script setup lang="ts">
interface Donation {
  id: string
  userId: string
  donationType: string
  amount?: string | number
  materialDesc?: string
  materialValue?: string | number
  evidenceImages?: string[]
  evidenceDesc?: string
  status: string
  reviewerId?: string
  reviewedAt?: string
  reviewRemark?: string
  pointsGranted?: boolean
  createdAt: string
  updatedAt?: string
}

interface Props {
  donation: Donation
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', donation: Donation): void
}>()

/** 捐赠类型映射 */
const donationTypeMap: Record<string, string> = {
  money: '资金捐助',
  goods: '物资捐助',
  service: '服务捐助',
}

/** 状态映射 */
const statusMap: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

/** 状态标签类型 */
function getStatusType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'default'
}

/** 获取显示内容 */
function getDisplayContent(donation: Donation): string {
  if (donation.donationType === 'money' && donation.amount) {
    return `¥${Number(donation.amount).toFixed(2)}`
  }
  if (donation.materialDesc) {
    return donation.materialDesc
  }
  return donationTypeMap[donation.donationType] || '捐助'
}

/** 格式化时间 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<template>
  <view class="donation-card" @click="$emit('click', donation)">
    <!-- 头部：类型 + 状态 -->
    <view class="donation-card__header">
      <wd-tag type="primary" plain round size="small">
        {{ donationTypeMap[donation.donationType] || donation.donationType }}
      </wd-tag>
      <wd-tag :type="getStatusType(donation.status)" plain round size="small">
        {{ statusMap[donation.status] || donation.status }}
      </wd-tag>
    </view>

    <!-- 内容 -->
    <view class="donation-card__body">
      <view class="donation-card__content">
        <text class="donation-card__amount">{{ getDisplayContent(donation) }}</text>
        <text v-if="donation.materialValue && donation.donationType !== 'money'" class="donation-card__value">
          估值: ¥{{ Number(donation.materialValue).toFixed(2) }}
        </text>
      </view>
    </view>

    <!-- 底部 -->
    <view class="donation-card__footer">
      <view class="donation-card__time">
        <wd-icon name="clock" size="24rpx" color="#bbb" />
        <text class="donation-card__time-text">{{ formatDate(donation.createdAt) }}</text>
      </view>
      <view v-if="donation.pointsGranted" class="donation-card__points">
        <wd-icon name="check-circle" size="24rpx" color="#07c160" />
        <text class="donation-card__points-text">已发放积分</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.donation-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
  }

  &__body {
    margin-bottom: 16rpx;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__amount {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    word-break: break-all;
  }

  &__value {
    font-size: 24rpx;
    color: #999;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16rpx;
    border-top: 1rpx solid #f5f5f5;
  }

  &__time {
    display: flex;
    align-items: center;
    gap: 6rpx;
  }

  &__time-text {
    font-size: 22rpx;
    color: #bbb;
  }

  &__points {
    display: flex;
    align-items: center;
    gap: 6rpx;
  }

  &__points-text {
    font-size: 22rpx;
    color: #07c160;
  }
}
</style>
