<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { usePointsStore } from '@/stores/points'
import * as mallApi from '@/services/mall'
import type { MallProduct, PointType } from '@/types/mall'

const userStore = useUserStore()
const pointsStore = usePointsStore()

// ==================== 数据 ====================
const productId = ref<number>(0)
const product = ref<MallProduct | null>(null)
const loading = ref(true)
const submitting = ref(false)

// ==================== 图片轮播 ====================
const swiperList = computed(() => {
  if (!product.value) return []
  const images = [product.value.coverImage, ...product.value.images]
  return images.filter(Boolean)
})

const currentSwiperIndex = ref(0)

function onSwiperChange(e: any) {
  currentSwiperIndex.value = e.detail.current
}

// ==================== 积分类型选择 ====================
const selectedPointType = ref<PointType>('activity')

/** 当前选中类型的单价 */
const unitPrice = computed(() => {
  if (!product.value) return 0
  return selectedPointType.value === 'activity'
    ? product.value.activityPointsPrice
    : product.value.donationPointsPrice
})

/** 当前选中类型的余额 */
const currentBalance = computed(() => {
  return selectedPointType.value === 'activity'
    ? pointsStore.activityBalance
    : pointsStore.donationBalance
})

/** 余额是否充足 */
const isBalanceSufficient = computed(() => {
  return currentBalance.value >= unitPrice.value * quantity.value
})

// ==================== 数量选择 ====================
const quantity = ref(1)

/** 合计积分 */
const totalPoints = computed(() => {
  return unitPrice.value * quantity.value
})

function handleQuantityChange(delta: number) {
  const newVal = quantity.value + delta
  if (newVal < 1) return
  if (product.value && newVal > product.value.stockRemaining) {
    uni.showToast({ title: '不能超过库存数量', icon: 'none' })
    return
  }
  quantity.value = newVal
}

// ==================== 收货信息（实物商品） ====================
const shippingName = ref('')
const shippingPhone = ref('')
const shippingAddress = ref('')
const remark = ref('')

/** 是否需要收货信息 */
const needShipping = computed(() => {
  return product.value?.productType === 'physical'
})

/** 收货信息是否填写完整 */
const isShippingValid = computed(() => {
  if (!needShipping.value) return true
  return (
    shippingName.value.trim() &&
    shippingPhone.value.trim() &&
    shippingAddress.value.trim()
  )
})

// ==================== 是否可以兑换 ====================
const canExchange = computed(() => {
  if (!product.value) return false
  if (product.value.stockRemaining <= 0) return false
  if (!isBalanceSufficient.value) return false
  if (!isShippingValid.value) return false
  return true
})

// ==================== 库存信息 ====================
const isLowStock = computed(() => {
  if (!product.value) return false
  const { stock, stockRemaining } = product.value
  return stockRemaining > 0 && stockRemaining <= Math.ceil(stock * 0.2)
})

const isSoldOut = computed(() => {
  if (!product.value) return false
  return product.value.stockRemaining <= 0
})

// ==================== 积分类型是否可用 ====================
function isPointTypeAvailable(type: PointType): boolean {
  if (!product.value) return false
  return product.value.allowedPointTypes.includes(type)
}

function isPointTypeDisabled(type: PointType): boolean {
  if (!isPointTypeAvailable(type)) return true
  const price = type === 'activity'
    ? product.value!.activityPointsPrice
    : product.value!.donationPointsPrice
  const balance = type === 'activity'
    ? pointsStore.activityBalance
    : pointsStore.donationBalance
  return balance < price
}

function getPointTypeBalance(type: PointType): number {
  return type === 'activity'
    ? pointsStore.activityBalance
    : pointsStore.donationBalance
}

function getPointTypePrice(type: PointType): number {
  if (!product.value) return 0
  return type === 'activity'
    ? product.value.activityPointsPrice
    : product.value.donationPointsPrice
}

// ==================== 方法 ====================

/** 获取商品详情 */
async function fetchProductDetail() {
  try {
    loading.value = true
    const detail = await mallApi.getProductDetail(productId.value)
    product.value = detail

    // 默认选中第一个允许的积分类型
    if (detail.allowedPointTypes.length > 0) {
      selectedPointType.value = detail.allowedPointTypes[0]
    }
  } catch (err: any) {
    console.error('获取商品详情失败', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 立即兑换 */
async function handleExchange() {
  if (!product.value) return
  if (!canExchange.value) return

  try {
    const confirmRes = await uni.showModal({
      title: '确认兑换',
      content: `将消耗 ${totalPoints.value} ${selectedPointType.value === 'activity' ? '活动' : '捐助'}积分兑换 ${quantity.value} 件「${product.value.name}」，确认兑换吗？`,
      confirmText: '确认',
      cancelText: '取消',
    })

    if (!confirmRes.confirm) return

    submitting.value = true

    await mallApi.createOrder({
      productId: product.value.id,
      quantity: quantity.value,
      pointType: selectedPointType.value,
      shippingName: needShipping.value ? shippingName.value.trim() : undefined,
      shippingPhone: needShipping.value ? shippingPhone.value.trim() : undefined,
      shippingAddress: needShipping.value ? shippingAddress.value.trim() : undefined,
      remark: remark.value.trim() || undefined,
    })

    uni.showToast({ title: '兑换成功', icon: 'success' })

    // 刷新积分余额
    await pointsStore.refreshBalance()

    // 跳转到订单列表
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/mall/orders' })
    }, 1500)
  } catch (err: any) {
    console.error('兑换失败', err)
    uni.showToast({ title: err.message || '兑换失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options?.id) {
    productId.value = Number(options.id)
  }
})

onShow(() => {
  if (productId.value) {
    fetchProductDetail()
    pointsStore.refreshBalance()
  }
})
</script>

<template>
  <view class="product-detail">
    <!-- 加载状态 -->
    <view v-if="loading" class="product-detail__loading">
      <wd-loading size="48rpx" />
    </view>

    <template v-else-if="product">
      <!-- 图片轮播 -->
      <view v-if="swiperList.length" class="product-detail__swiper">
        <swiper
          :indicator-dots="swiperList.length > 1"
          :autoplay="true"
          :interval="4000"
          :duration="300"
          :circular="true"
          indicator-active-color="#fff"
          indicator-color="rgba(255,255,255,0.5)"
          class="product-detail__swiper-inner"
          @change="onSwiperChange"
        >
          <swiper-item
            v-for="(img, index) in swiperList"
            :key="index"
          >
            <wd-img
              :src="img"
              width="100%"
              height="600rpx"
              mode="aspectFill"
            />
          </swiper-item>
        </swiper>
        <view v-if="swiperList.length > 1" class="product-detail__swiper-indicator">
          {{ currentSwiperIndex + 1 }} / {{ swiperList.length }}
        </view>
      </view>
      <view v-else class="product-detail__cover-placeholder">
        <wd-icon name="picture" size="120rpx" color="#ccc" />
      </view>

      <!-- 商品名称 + 推荐标签 -->
      <view class="product-detail__header">
        <view class="product-detail__title-row">
          <text class="product-detail__title">{{ product.name }}</text>
          <wd-tag v-if="product.isFeatured" type="danger" plain round size="small">推荐</wd-tag>
        </view>
      </view>

      <!-- 积分价格区域 -->
      <view class="product-detail__section">
        <view class="product-detail__price-area">
          <template v-if="product.activityPointsPrice === product.donationPointsPrice">
            <text class="product-detail__price-value">{{ product.activityPointsPrice }}</text>
            <text class="product-detail__price-unit">积分/件</text>
          </template>
          <template v-else>
            <view class="product-detail__price-row">
              <text class="product-detail__price-label">活动积分:</text>
              <text class="product-detail__price-value">{{ product.activityPointsPrice }}</text>
              <text class="product-detail__price-unit">/件</text>
            </view>
            <view class="product-detail__price-row">
              <text class="product-detail__price-label">捐助积分:</text>
              <text class="product-detail__price-value">{{ product.donationPointsPrice }}</text>
              <text class="product-detail__price-unit">/件</text>
            </view>
          </template>
        </view>
      </view>

      <!-- 商品描述 -->
      <view v-if="product.description" class="product-detail__section">
        <view class="product-detail__section-title">商品详情</view>
        <view class="product-detail__description">
          <rich-text :nodes="product.description" />
        </view>
      </view>

      <!-- 库存信息 -->
      <view class="product-detail__section">
        <view class="product-detail__stock-row">
          <text class="product-detail__stock-label">库存</text>
          <text v-if="isSoldOut" class="product-detail__stock-value product-detail__stock-value--danger">
            已售罄
          </text>
          <text v-else-if="isLowStock" class="product-detail__stock-value product-detail__stock-value--warning">
            仅剩 {{ product.stockRemaining }} 件
          </text>
          <text v-else class="product-detail__stock-value">
            剩余 {{ product.stockRemaining }} 件
          </text>
        </view>
      </view>

      <!-- 选择积分类型 -->
      <view class="product-detail__section">
        <view class="product-detail__section-title">选择积分类型</view>
        <wd-radio-group v-model="selectedPointType" shape="dot">
          <view
            v-for="type in (product.allowedPointTypes as PointType[])"
            :key="type"
            class="product-detail__point-type-item"
          >
            <wd-radio
              :value="type"
              :disabled="isPointTypeDisabled(type)"
              custom-class="product-detail__radio"
            >
              <view class="product-detail__point-type-content">
                <text class="product-detail__point-type-name">
                  {{ type === 'activity' ? '活动积分' : '捐助积分' }}
                </text>
                <text class="product-detail__point-type-price">
                  {{ getPointTypePrice(type) }} 积分/件
                </text>
                <text
                  :class="[
                    'product-detail__point-type-balance',
                    { 'product-detail__point-type-balance--insufficient': getPointTypeBalance(type) < getPointTypePrice(type) }
                  ]"
                >
                  余额: {{ getPointTypeBalance(type) }}
                </text>
              </view>
            </wd-radio>
          </view>
        </wd-radio-group>
      </view>

      <!-- 数量选择 -->
      <view class="product-detail__section">
        <view class="product-detail__section-title">选择数量</view>
        <view class="product-detail__quantity">
          <view
            class="product-detail__quantity-btn"
            :class="{ 'product-detail__quantity-btn--disabled': quantity <= 1 }"
            @click="handleQuantityChange(-1)"
          >
            <wd-icon name="reduce" size="32rpx" :color="quantity <= 1 ? '#ccc' : '#333'" />
          </view>
          <text class="product-detail__quantity-num">{{ quantity }}</text>
          <view
            class="product-detail__quantity-btn"
            :class="{ 'product-detail__quantity-btn--disabled': isSoldOut || quantity >= product.stockRemaining }"
            @click="handleQuantityChange(1)"
          >
            <wd-icon name="add" size="32rpx" :color="isSoldOut || quantity >= product.stockRemaining ? '#ccc' : '#333'" />
          </view>
        </view>
      </view>

      <!-- 收货信息（实物商品） -->
      <view v-if="needShipping" class="product-detail__section">
        <view class="product-detail__section-title">收货信息</view>
        <wd-input
          v-model="shippingName"
          label="收货人"
          label-width="140rpx"
          placeholder="请输入收货人姓名"
          clearable
          custom-style="margin-bottom: 16rpx;"
        />
        <wd-input
          v-model="shippingPhone"
          label="联系电话"
          label-width="140rpx"
          placeholder="请输入联系电话"
          type="number"
          clearable
          custom-style="margin-bottom: 16rpx;"
        />
        <wd-textarea
          v-model="shippingAddress"
          label="收货地址"
          placeholder="请输入详细收货地址"
          :maxlength="200"
          show-word-limit
          clearable
        />
      </view>

      <!-- 备注 -->
      <view class="product-detail__section">
        <view class="product-detail__section-title">备注</view>
        <wd-textarea
          v-model="remark"
          placeholder="选填，如有特殊要求请备注"
          :maxlength="200"
          show-word-limit
          clearable
        />
      </view>

      <!-- 底部占位 -->
      <view class="product-detail__bottom-placeholder" />
    </template>

    <!-- 空状态 -->
    <EmptyState
      v-else
      text="商品不存在"
      icon="warning"
    />

    <!-- 底部固定操作栏 -->
    <view v-if="product && !loading" class="product-detail__footer">
      <view class="product-detail__footer-info">
        <text class="product-detail__footer-label">合计</text>
        <text class="product-detail__footer-points">{{ totalPoints }}</text>
        <text class="product-detail__footer-unit">
          {{ selectedPointType === 'activity' ? '活动' : '捐助' }}积分
        </text>
      </view>
      <wd-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!canExchange || isSoldOut"
        @click="handleExchange"
      >
        {{ isSoldOut ? '已售罄' : '立即兑换' }}
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.product-detail {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 0;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__swiper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  &__swiper-inner {
    width: 100%;
    height: 600rpx;
  }

  &__swiper-indicator {
    position: absolute;
    bottom: 20rpx;
    right: 20rpx;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 24rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
  }

  &__cover-placeholder {
    width: 100%;
    height: 600rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
  }

  &__header {
    background-color: #fff;
    padding: 24rpx;
    margin-bottom: 16rpx;
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
  }

  &__title {
    flex: 1;
    font-size: 36rpx;
    font-weight: 700;
    color: $color-text;
    line-height: 1.4;
  }

  &__section {
    background-color: #fff;
    padding: 24rpx;
    margin-bottom: 16rpx;
  }

  &__section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 20rpx;
    padding-left: 16rpx;
    border-left: 6rpx solid $color-primary;
  }

  // 积分价格区域
  &__price-area {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__price-label {
    font-size: 26rpx;
    color: #999;
  }

  &__price-value {
    font-size: 48rpx;
    font-weight: 700;
    color: $color-danger;
  }

  &__price-unit {
    font-size: 26rpx;
    color: $color-danger;
  }

  // 商品描述
  &__description {
    font-size: 28rpx;
    color: $color-text-secondary;
    line-height: 1.8;
  }

  // 库存信息
  &__stock-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__stock-label {
    font-size: 28rpx;
    color: #666;
  }

  &__stock-value {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;

    &--warning {
      color: $color-warning;
    }

    &--danger {
      color: $color-danger;
    }
  }

  // 积分类型选择
  &__point-type-item {
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__point-type-content {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__point-type-name {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
  }

  &__point-type-price {
    font-size: 24rpx;
    color: #999;
  }

  &__point-type-balance {
    font-size: 24rpx;
    color: $color-primary;

    &--insufficient {
      color: $color-danger;
    }
  }

  // 数量选择
  &__quantity {
    display: flex;
    align-items: center;
    gap: 32rpx;
  }

  &__quantity-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;

    &--disabled {
      opacity: 0.5;
    }
  }

  &__quantity-num {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    min-width: 60rpx;
    text-align: center;
  }

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }

  // 底部固定操作栏
  &__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: #fff;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__footer-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__footer-label {
    font-size: 28rpx;
    color: #666;
  }

  &__footer-points {
    font-size: 40rpx;
    font-weight: 700;
    color: $color-danger;
  }

  &__footer-unit {
    font-size: 24rpx;
    color: #999;
  }
}
</style>
