<script setup lang="ts">
interface Props {
  type: 'activity' | 'donation'
  value: number
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

defineEmits<{
  (e: 'click'): void
}>()

/** 根据类型获取颜色 */
function getColor(): string {
  return props.type === 'activity' ? '#07c160' : '#fa9d3b'
}

/** 根据类型获取图标名 */
function getIcon(): string {
  return props.type === 'activity' ? 'calendar' : 'gift'
}

/** 根据类型获取背景色 */
function getBgColor(): string {
  return props.type === 'activity' ? 'rgba(7, 193, 96, 0.1)' : 'rgba(250, 157, 59, 0.1)'
}

/** 根据尺寸获取样式 */
function getSizeStyle() {
  const sizeMap = {
    sm: {
      icon: '28rpx',
      font: '22rpx',
      padding: '6rpx 14rpx',
      radius: '16rpx',
    },
    md: {
      icon: '36rpx',
      font: '26rpx',
      padding: '10rpx 20rpx',
      radius: '24rpx',
    },
    lg: {
      icon: '44rpx',
      font: '32rpx',
      padding: '14rpx 28rpx',
      radius: '32rpx',
    },
  }
  return sizeMap[props.size]
}
</script>

<template>
  <view
    class="points-badge"
    :style="{
      backgroundColor: getBgColor(),
      padding: getSizeStyle().padding,
      borderRadius: getSizeStyle().radius,
    }"
    @click="$emit('click')"
  >
    <wd-icon
      :name="getIcon()"
      :size="getSizeStyle().icon"
      :color="getColor()"
    />
    <text
      class="points-badge__value"
      :style="{
        color: getColor(),
        fontSize: getSizeStyle().font,
      }"
    >
      {{ value }}
    </text>
  </view>
</template>

<style scoped lang="scss">
.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;

  &__value {
    font-weight: 600;
    line-height: 1;
  }
}
</style>
