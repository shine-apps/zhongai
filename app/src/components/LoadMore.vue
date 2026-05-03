<script setup lang="ts">
interface Props {
  status: 'more' | 'loading' | 'noMore'
}

defineProps<Props>()
</script>

<template>
  <view class="load-more">
    <!-- 上拉加载更多 -->
    <view v-if="status === 'more'" class="load-more__more">
      <wd-icon name="arrow-down" size="28rpx" color="#ccc" />
      <text class="load-more__text">上拉加载更多</text>
    </view>

    <!-- 加载中 -->
    <view v-else-if="status === 'loading'" class="load-more__loading">
      <wd-loading size="32rpx" color="#999" />
      <text class="load-more__text">加载中...</text>
    </view>

    <!-- 没有更多 -->
    <view v-else class="load-more__nomore">
      <view class="load-more__nomore-line" />
      <text class="load-more__text load-more__text--light">没有更多了</text>
      <view class="load-more__nomore-line" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;

  &__more,
  &__loading {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__nomore {
    display: flex;
    align-items: center;
    gap: 20rpx;
    width: 100%;
    padding: 0 60rpx;
  }

  &__nomore-line {
    flex: 1;
    height: 1rpx;
    background-color: #eee;
  }

  &__text {
    font-size: 24rpx;
    color: #999;
  }

  &__text--light {
    color: #ccc;
  }
}
</style>
