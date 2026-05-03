<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as activityApi from '@/services/activity'
import type { Activity, GalleryItem } from '@/types/activity'
import GalleryGrid from '@/components/GalleryGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate } from '@/utils/format'

const userStore = useUserStore()

// ==================== 数据 ====================
const activityId = ref<number>(0)
const activity = ref<Activity | null>(null)
const galleryList = ref<GalleryItem[]>([])
const loading = ref(true)
const submitting = ref(false)

/** 分类中文映射 */
const categoryMap: Record<string, string> = {
  elderly_care: '慰问老人',
  education: '爱心助学',
  environmental: '环保活动',
  disaster_relief: '抗灾救援',
  other: '其他',
}

/** 状态映射 */
const statusMap: Record<number, string> = {
  0: '草稿',
  1: '已发布',
  2: '进行中',
  3: '已结束',
  4: '已取消',
}

/** 状态标签类型 */
function getStatusType(status: number): string {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'primary',
    3: 'default',
    4: 'danger',
  }
  return map[status] || 'default'
}

/** 是否已报名 */
const isRegistered = computed(() => {
  return activity.value?.registered || false
})

/** 活动是否已结束 */
const isEnded = computed(() => {
  return activity.value?.status === 3 || activity.value?.status === 4
})

/** 是否可以报名 */
const canRegister = computed(() => {
  return !isEnded.value && !isRegistered.value
})

// ==================== 方法 ====================

/** 获取活动详情 */
async function fetchActivityDetail() {
  try {
    loading.value = true
    const detail = await activityApi.getActivityDetail(activityId.value)
    activity.value = detail
  } catch (err: any) {
    console.error('获取活动详情失败', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 获取活动相册 */
async function fetchGallery() {
  try {
    const res = await activityApi.getActivityGallery(activityId.value)
    galleryList.value = res.list
  } catch (err: any) {
    console.error('获取活动相册失败', err)
  }
}

/** 立即报名 */
function handleRegister() {
  uni.navigateTo({
    url: `/pages/activity/register?activityId=${activityId.value}`,
  })
}

/** 取消报名 */
async function handleCancelRegister() {
  try {
    submitting.value = true
    await uni.showModal({
      title: '提示',
      content: '确定要取消报名吗？',
    })

    await activityApi.cancelRegistration(activityId.value)
    uni.showToast({ title: '已取消报名', icon: 'success' })

    // 刷新详情
    await fetchActivityDetail()
  } catch (err: any) {
    if (err.errMsg && err.errMsg.includes('cancel')) return
    console.error('取消报名失败', err)
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

/** 签到 */
function handleCheckin() {
  uni.navigateTo({
    url: `/pages/activity/checkin?activityId=${activityId.value}`,
  })
}

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options?.id) {
    activityId.value = Number(options.id)
  }
})

onShow(() => {
  if (activityId.value) {
    fetchActivityDetail()
    fetchGallery()
  }
})
</script>

<template>
  <view class="activity-detail">
    <!-- 加载状态 -->
    <view v-if="loading" class="activity-detail__loading">
      <wd-loading size="48rpx" />
    </view>

    <template v-else-if="activity">
      <!-- 封面大图 -->
      <view class="activity-detail__cover">
        <wd-img
          v-if="activity.coverImage"
          :src="activity.coverImage"
          width="100%"
          height="480rpx"
          mode="aspectFill"
        />
        <view v-else class="activity-detail__cover-placeholder">
          <wd-icon name="picture" size="120rpx" color="#ccc" />
        </view>
      </view>

      <!-- 标题与状态 -->
      <view class="activity-detail__header">
        <view class="activity-detail__title-row">
          <text class="activity-detail__title">{{ activity.title }}</text>
          <wd-tag
            :type="getStatusType(activity.status)"
            plain
            round
            size="small"
          >
            {{ statusMap[activity.status] || '未知' }}
          </wd-tag>
        </view>
      </view>

      <!-- 活动信息 -->
      <view class="activity-detail__section">
        <view class="activity-detail__section-title">活动信息</view>
        <wd-cell-group border>
          <wd-cell title="活动分类" :value="categoryMap[activity.category] || activity.category" />
          <wd-cell
            title="活动时间"
            :value="`${formatDate(activity.startTime)} ~ ${formatDate(activity.endTime)}`"
          />
          <wd-cell title="活动地点" :value="activity.location || '待定'" />
          <wd-cell
            title="人数限制"
            :value="activity.maxParticipants ? `${activity.currentParticipants}/${activity.maxParticipants}人` : '不限'"
          />
          <wd-cell title="积分奖励" :value="`+${activity.rewardPoints}积分`" />
        </wd-cell-group>
      </view>

      <!-- 活动介绍 -->
      <view class="activity-detail__section">
        <view class="activity-detail__section-title">活动介绍</view>
        <view class="activity-detail__description">
          <rich-text :nodes="activity.description" />
        </view>
      </view>

      <!-- 活动相册 -->
      <view v-if="galleryList.length" class="activity-detail__section">
        <view class="activity-detail__section-title">活动相册</view>
        <GalleryGrid :items="galleryList" :max="9" />
      </view>

      <!-- 底部占位 -->
      <view class="activity-detail__bottom-placeholder" />
    </template>

    <!-- 空状态 -->
    <EmptyState
      v-else
      text="活动不存在"
      icon="warning"
    />

    <!-- 底部固定操作栏 -->
    <view v-if="activity && !loading" class="activity-detail__footer">
      <!-- 已报名 -->
      <template v-if="isRegistered">
        <view class="activity-detail__footer-left">
          <wd-tag type="success" plain round>已报名</wd-tag>
        </view>
        <view class="activity-detail__footer-right">
          <wd-button
            type="primary"
            plain
            size="medium"
            :loading="submitting"
            @click="handleCheckin"
          >
            签到打卡
          </wd-button>
          <wd-button
            type="error"
            plain
            size="medium"
            :loading="submitting"
            @click="handleCancelRegister"
          >
            取消报名
          </wd-button>
        </view>
      </template>

      <!-- 未报名 -->
      <template v-else-if="canRegister">
        <wd-button
          type="primary"
          block
          size="large"
          @click="handleRegister"
        >
          立即报名
        </wd-button>
      </template>

      <!-- 活动已结束 -->
      <template v-else>
        <wd-button type="default" block size="large" disabled>
          活动已结束
        </wd-button>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.activity-detail {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 0;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__cover {
    width: 100%;
    overflow: hidden;
  }

  &__cover-placeholder {
    width: 100%;
    height: 480rpx;
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

  &__description {
    font-size: 28rpx;
    color: $color-text-secondary;
    line-height: 1.8;
  }

  &__bottom-placeholder {
    height: 140rpx;
  }

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
    gap: 16rpx;
  }

  &__footer-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__footer-right {
    flex: 1;
    display: flex;
    gap: 16rpx;
    justify-content: flex-end;
  }
}
</style>
