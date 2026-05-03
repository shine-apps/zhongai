<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface SystemInfo {
  statusBarHeight?: number
}

interface Props {
  title?: string
  showBack?: boolean
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  backgroundColor: '#ffffff',
})

const emit = defineEmits<{
  (e: 'back'): void
}>()

const statusBarHeight = ref(0)
const navBarHeight = ref(44)

onMounted(() => {
  try {
    const sysInfo = uni.getSystemInfoSync() as SystemInfo
    statusBarHeight.value = sysInfo.statusBarHeight || 0
  } catch {
    statusBarHeight.value = 0
  }
})

/** 返回按钮点击 */
function handleBack() {
  emit('back')
  // 如果没有监听 back 事件，默认返回上一页
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/index/index' })
    },
  })
}

/** 计算导航栏总高度 */
function getTotalHeight(): string {
  return `${statusBarHeight.value + navBarHeight.value}px`
}
</script>

<template>
  <view
    class="nav-bar"
    :style="{
      backgroundColor: backgroundColor,
      paddingTop: `${statusBarHeight}px`,
      height: getTotalHeight(),
    }"
  >
    <!-- 占位：保持页面内容不被导航栏遮挡 -->
    <view class="nav-bar__placeholder" :style="{ height: getTotalHeight() }" />

    <!-- 导航栏内容 -->
    <view class="nav-bar__content">
      <!-- 左侧返回按钮 -->
      <view v-if="showBack" class="nav-bar__left" @click="handleBack">
        <wd-icon name="arrow-left" size="40rpx" color="#333" />
      </view>
      <view v-else class="nav-bar__left" />

      <!-- 中间标题 -->
      <view class="nav-bar__title">
        <text class="nav-bar__title-text">{{ title }}</text>
      </view>

      <!-- 右侧占位 -->
      <view class="nav-bar__right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;

  &__placeholder {
    width: 100%;
  }

  &__content {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 24rpx;
    position: relative;
  }

  &__left {
    width: 80rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
  }

  &__title-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    max-width: 400rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__right {
    width: 80rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
  }
}
</style>
