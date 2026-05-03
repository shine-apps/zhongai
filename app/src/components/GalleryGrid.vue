<script setup lang="ts">
import { computed } from 'vue'

interface GalleryItem {
  id: string
  mediaType: 'image' | 'video'
  fileUrl: string
  thumbnailUrl?: string
  duration?: number
}

interface Props {
  items: GalleryItem[]
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  max: 9,
})

const emit = defineEmits<{
  (e: 'preview', item: GalleryItem, index: number): void
  (e: 'videoPlay', item: GalleryItem): void
}>()

/** 实际显示的列表（不超过 max） */
const displayItems = computed(() => {
  if (props.items.length <= props.max) {
    return props.items
  }
  return props.items.slice(0, props.max)
})

/** 超出数量 */
const overflowCount = computed(() => {
  if (props.items.length <= props.max) {
    return 0
  }
  return props.items.length - props.max
})

/** 是否显示溢出格子 */
const showOverflow = computed(() => overflowCount.value > 0)

/** 格式化视频时长 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 点击图片预览 */
function handleImageClick(index: number) {
  const item = displayItems.value[index]
  if (!item || item.mediaType !== 'image') return

  emit('preview', item, index)

  // 收集所有图片 URL
  const urls = displayItems.value
    .filter((i) => i.mediaType === 'image')
    .map((i) => i.fileUrl)

  const current = urls.indexOf(item.fileUrl)
  uni.previewImage({
    urls,
    current: current >= 0 ? current : 0,
  })
}

/** 点击视频播放 */
function handleVideoClick(index: number) {
  const item = displayItems.value[index]
  if (!item || item.mediaType !== 'video') return

  emit('videoPlay', item)

  // 全屏播放视频
  uni.navigateTo({
    url: `/pages/video/player?url=${encodeURIComponent(item.fileUrl)}`,
    fail: () => {
      // 如果页面不存在，使用 video context 播放
      uni.showToast({ title: '暂不支持视频播放', icon: 'none' })
    },
  })
}
</script>

<template>
  <view class="gallery-grid">
    <view
      v-for="(item, index) in displayItems"
      :key="item.id"
      class="gallery-grid__item"
      @click="item.mediaType === 'image' ? handleImageClick(index) : handleVideoClick(index)"
    >
      <!-- 图片 -->
      <wd-img
        :src="item.thumbnailUrl || item.fileUrl"
        width="100%"
        height="100%"
        mode="aspectFill"
        custom-style="border-radius: 8rpx;"
      />

      <!-- 视频播放图标和时长 -->
      <view v-if="item.mediaType === 'video'" class="gallery-grid__video-overlay">
        <view class="gallery-grid__play-icon">
          <wd-icon name="play-fill" size="40rpx" color="#fff" />
        </view>
        <view v-if="item.duration" class="gallery-grid__duration">
          <text class="gallery-grid__duration-text">{{ formatDuration(item.duration) }}</text>
        </view>
      </view>
    </view>

    <!-- 溢出显示 +N -->
    <view v-if="showOverflow" class="gallery-grid__item gallery-grid__overflow">
      <text class="gallery-grid__overflow-text">+{{ overflowCount }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;

  &__item {
    width: calc((100% - 24rpx) / 3);
    height: 0;
    padding-bottom: calc((100% - 24rpx) / 3);
    position: relative;
    border-radius: 8rpx;
    overflow: hidden;
  }

  &__video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.2);
  }

  &__play-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__duration {
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 6rpx;
    padding: 2rpx 10rpx;
  }

  &__duration-text {
    font-size: 20rpx;
    color: #fff;
    line-height: 1.4;
  }

  &__overflow {
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &__overflow-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #999;
  }
}
</style>
