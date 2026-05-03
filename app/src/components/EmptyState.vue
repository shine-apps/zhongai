<script setup lang="ts">
interface Props {
  text?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  icon: 'box',
})
</script>

<template>
  <view class="empty-state">
    <view class="empty-state__icon">
      <wd-icon :name="icon" size="120rpx" color="#ddd" />
    </view>
    <text class="empty-state__text">{{ text }}</text>
    <view v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;

  &__icon {
    margin-bottom: 24rpx;
  }

  &__text {
    font-size: 28rpx;
    color: #ccc;
    line-height: 1.5;
  }

  &__action {
    margin-top: 32rpx;
  }
}
</style>
