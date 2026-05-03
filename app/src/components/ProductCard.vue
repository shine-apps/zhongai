<script setup lang="ts">
import type { MallProduct } from '@/types/mall'

interface Props {
  product: MallProduct
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', product: MallProduct): void
}>()

/** 两种积分价格是否相同 */
const isSamePrice = computed(() => {
  return props.product.activityPointsPrice === props.product.donationPointsPrice
})

/** 是否仅允许活动积分 */
const isActivityOnly = computed(() => {
  return (
    props.product.allowedPointTypes.length === 1 &&
    props.product.allowedPointTypes[0] === 'activity'
  )
})

/** 是否仅允许捐助积分 */
const isDonationOnly = computed(() => {
  return (
    props.product.allowedPointTypes.length === 1 &&
    props.product.allowedPointTypes[0] === 'donation'
  )
})

/** 库存是否紧张（剩余 <= 总库存的 20% 且大于 0） */
const isLowStock = computed(() => {
  const { stock, stockRemaining } = props.product
  return stockRemaining > 0 && stockRemaining <= Math.ceil(stock * 0.2)
})

/** 是否已售罄 */
const isSoldOut = computed(() => {
  return props.product.stockRemaining <= 0
})

function handleClick() {
  emit('click', props.product)
}
</script>

<template>
  <view class="product-card" @click="handleClick">
    <!-- 封面图 -->
    <view class="product-card__cover">
      <wd-img
        v-if="product.coverImage"
        :src="product.coverImage"
        width="100%"
        height="320rpx"
        mode="aspectFill"
        custom-style="border-radius: 16rpx 16rpx 0 0;"
      />
      <view v-else class="product-card__cover-placeholder">
        <wd-icon name="picture" size="80rpx" color="#ccc" />
      </view>

      <!-- 推荐角标 -->
      <view v-if="product.isFeatured" class="product-card__badge">
        <wd-tag type="danger" plain round size="small">推荐</wd-tag>
      </view>

      <!-- 售罄遮罩 -->
      <view v-if="isSoldOut" class="product-card__sold-out">
        <text class="product-card__sold-out-text">已售罄</text>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="product-card__content">
      <!-- 商品名称 -->
      <view class="product-card__name">{{ product.name }}</view>

      <!-- 积分价格区域 -->
      <view class="product-card__price">
        <template v-if="isSamePrice">
          <text class="product-card__price-value">{{ product.activityPointsPrice }}</text>
          <text class="product-card__price-unit">积分</text>
        </template>
        <template v-else>
          <view class="product-card__price-row">
            <text class="product-card__price-label">活动积分:</text>
            <text class="product-card__price-value">{{ product.activityPointsPrice }}</text>
          </view>
          <view class="product-card__price-row">
            <text class="product-card__price-label">捐助积分:</text>
            <text class="product-card__price-value">{{ product.donationPointsPrice }}</text>
          </view>
        </template>
      </view>

      <!-- 积分类型限制标签 -->
      <view class="product-card__tags">
        <wd-tag v-if="isActivityOnly" type="primary" plain round size="small">仅活动积分</wd-tag>
        <wd-tag v-if="isDonationOnly" type="warning" plain round size="small">仅捐助积分</wd-tag>
        <wd-tag v-if="isLowStock" type="danger" plain round size="small">库存紧张</wd-tag>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.product-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  &__cover {
    position: relative;
    width: 100%;
    height: 320rpx;
    overflow: hidden;
  }

  &__cover-placeholder {
    width: 100%;
    height: 320rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
  }

  &__badge {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
  }

  &__sold-out {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__sold-out-text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 600;
  }

  &__content {
    padding: 16rpx 20rpx 20rpx;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 12rpx;
  }

  &__price {
    margin-bottom: 12rpx;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
  }

  &__price-label {
    font-size: 22rpx;
    color: #999;
  }

  &__price-value {
    font-size: 32rpx;
    font-weight: 700;
    color: $color-danger;
  }

  &__price-unit {
    font-size: 22rpx;
    color: $color-danger;
    margin-left: 4rpx;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
  }
}
</style>
