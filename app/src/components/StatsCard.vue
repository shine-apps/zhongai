<script setup lang="ts">
interface Props {
  label: string
  value: number | string
  icon: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
})

/** 颜色映射 */
function getColorStyle(): { bg: string; text: string } {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'rgba(4, 122, 255, 0.1)', text: '#047aff' },
    success: { bg: 'rgba(7, 193, 96, 0.1)', text: '#07c160' },
    warning: { bg: 'rgba(250, 157, 59, 0.1)', text: '#fa9d3b' },
    danger: { bg: 'rgba(238, 10, 36, 0.1)', text: '#ee0a24' },
    purple: { bg: 'rgba(124, 77, 255, 0.1)', text: '#7c4dff' },
  }
  return colorMap[props.color] || colorMap.primary
}
</script>

<template>
  <view class="stats-card">
    <!-- 图标 -->
    <view
      class="stats-card__icon"
      :style="{ backgroundColor: getColorStyle().bg }"
    >
      <wd-icon
        :name="icon"
        size="48rpx"
        :color="getColorStyle().text"
      />
    </view>

    <!-- 数值 -->
    <text
      class="stats-card__value"
      :style="{ color: getColorStyle().text }"
    >
      {{ value }}
    </text>

    <!-- 标签 -->
    <text class="stats-card__label">{{ label }}</text>
  </view>
</template>

<style scoped lang="scss">
.stats-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28rpx 16rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  gap: 12rpx;

  &__icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__value {
    font-size: 40rpx;
    font-weight: 700;
    line-height: 1.2;
  }

  &__label {
    font-size: 24rpx;
    color: #999;
    line-height: 1.4;
  }
}
</style>
