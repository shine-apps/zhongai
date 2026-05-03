<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import * as activityApi from '@/services/activity'
import type { Activity } from '@/types/activity'
import { formatDate, formatDistance } from '@/utils/format'

const userStore = useUserStore()

// ==================== 数据 ====================
const activityId = ref<number>(0)
const activity = ref<Activity | null>(null)
const loading = ref(true)
const submitting = ref(false)

// 定位数据
const currentLat = ref<number>(0)
const currentLng = ref<number>(0)
const locationName = ref<string>('定位中...')
const distance = ref<number>(Infinity)
const checkinRadius = ref<number>(500) // 默认签到半径 500 米

/** 是否在签到范围内 */
const isInRange = computed(() => {
  return distance.value <= checkinRadius.value
})

/** 是否已签到 */
const hasCheckedIn = ref(false)

// ==================== 方法 ====================

/** Haversine 公式计算两点之间的距离（米） */
function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000 // 地球半径（米）
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/** 获取活动详情 */
async function fetchActivityDetail() {
  try {
    loading.value = true
    const detail = await activityApi.getActivityDetail(activityId.value)
    activity.value = detail

    // 从活动详情获取签到半径（如果后端返回）
    if (detail.checkinRadius) {
      checkinRadius.value = detail.checkinRadius
    }
  } catch (err: any) {
    console.error('获取活动详情失败', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 获取当前位置 */
function getCurrentLocation() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      currentLat.value = res.latitude
      currentLng.value = res.longitude
      locationName.value = '定位成功'

      // 计算距离
      if (activity.value?.latitude && activity.value?.longitude) {
        distance.value = calcDistance(
          res.latitude,
          res.longitude,
          activity.value.latitude,
          activity.value.longitude,
        )
      }
    },
    fail: (err) => {
      console.error('获取位置失败', err)
      locationName.value = '定位失败'
      uni.showToast({ title: '获取位置失败，请检查定位权限', icon: 'none' })
    },
  })
}

/** 重新定位 */
function handleRelocate() {
  locationName.value = '定位中...'
  distance.value = Infinity
  getCurrentLocation()
}

/** GPS 签到 */
async function handleCheckin() {
  if (!isInRange.value) {
    uni.showToast({ title: '不在签到范围内', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    await activityApi.checkin(activityId.value, currentLat.value, currentLng.value)
    hasCheckedIn.value = true

    uni.showToast({
      title: '签到成功',
      icon: 'success',
    })
  } catch (err: any) {
    console.error('签到失败', err)
    uni.showToast({ title: err.message || '签到失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options?.activityId) {
    activityId.value = Number(options.activityId)
  }
})

onShow(async () => {
  if (activityId.value) {
    await fetchActivityDetail()
    // 获取活动详情后再定位
    getCurrentLocation()
  }
})
</script>

<template>
  <view class="activity-checkin">
    <!-- 加载状态 -->
    <view v-if="loading" class="activity-checkin__loading">
      <wd-loading size="48rpx" />
    </view>

    <template v-else-if="activity">
      <!-- 活动信息 -->
      <view class="activity-checkin__info">
        <view class="activity-checkin__info-card">
          <text class="activity-checkin__info-title">{{ activity.title }}</text>
          <view class="activity-checkin__info-row">
            <wd-icon name="clock" size="28rpx" color="#999" />
            <text class="activity-checkin__info-text">
              {{ formatDate(activity.startTime) }} ~ {{ formatDate(activity.endTime) }}
            </text>
          </view>
          <view class="activity-checkin__info-row">
            <wd-icon name="location" size="28rpx" color="#999" />
            <text class="activity-checkin__info-text">{{ activity.location || '待定' }}</text>
          </view>
        </view>
      </view>

      <!-- 地图组件 -->
      <view class="activity-checkin__map">
        <map
          class="activity-checkin__map-component"
          :latitude="activity.latitude"
          :longitude="activity.longitude"
          :scale="16"
          :markers="[
            {
              id: 1,
              latitude: activity.latitude,
              longitude: activity.longitude,
              title: activity.title,
              width: 36,
              height: 36,
              iconPath: '/static/marker.png',
              callout: {
                content: activity.title,
                display: 'ALWAYS',
                fontSize: 12,
                borderRadius: 4,
                padding: 4,
              },
            },
            ...(currentLat && currentLng ? [{
              id: 2,
              latitude: currentLat,
              longitude: currentLng,
              title: '当前位置',
              width: 28,
              height: 28,
              iconPath: '/static/location.png',
            }] : []),
          ]"
          :circles="[
            {
              latitude: activity.latitude,
              longitude: activity.longitude,
              radius: checkinRadius,
              color: '#07c16030',
              fillColor: '#07c16015',
              strokeWidth: 2,
            },
          ]"
          show-location
        />
      </view>

      <!-- 定位信息 -->
      <view class="activity-checkin__location">
        <view class="activity-checkin__location-card">
          <view class="activity-checkin__location-row">
            <wd-icon name="location" size="32rpx" :color="isInRange ? '#07c160' : '#ee0a24'" />
            <text class="activity-checkin__location-text">{{ locationName }}</text>
            <view class="activity-checkin__location-relocate" @click="handleRelocate">
              <wd-icon name="refresh" size="28rpx" color="#07c160" />
              <text class="activity-checkin__relocate-text">重新定位</text>
            </view>
          </view>

          <!-- 距离显示 -->
          <view class="activity-checkin__distance">
            <template v-if="distance !== Infinity">
              <view v-if="isInRange" class="activity-checkin__distance-in">
                <wd-icon name="check-circle" size="32rpx" color="#07c160" />
                <text class="activity-checkin__distance-text activity-checkin__distance-text--success">
                  距活动地点 {{ formatDistance(distance) }}，在签到范围内
                </text>
              </view>
              <view v-else class="activity-checkin__distance-out">
                <wd-icon name="warning" size="32rpx" color="#ee0a24" />
                <text class="activity-checkin__distance-text activity-checkin__distance-text--danger">
                  距活动地点 {{ formatDistance(distance) }}，不在签到范围内（{{ formatDistance(checkinRadius) }}）
                </text>
              </view>
            </template>
            <view v-else class="activity-checkin__distance-unknown">
              <text class="activity-checkin__distance-text">正在计算距离...</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 签到按钮 -->
      <view class="activity-checkin__action">
        <template v-if="hasCheckedIn">
          <wd-button type="success" block size="large" disabled>
            已签到成功
          </wd-button>
        </template>
        <template v-else>
          <wd-button
            type="primary"
            block
            size="large"
            :loading="submitting"
            :disabled="!isInRange || submitting"
            @click="handleCheckin"
          >
            {{ isInRange ? 'GPS 签到' : '不在签到范围内' }}
          </wd-button>
        </template>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="activity-checkin__empty">
      <wd-icon name="warning" size="120rpx" color="#ddd" />
      <text class="activity-checkin__empty-text">活动信息不存在</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.activity-checkin {
  min-height: 100vh;
  background-color: $color-bg;
  padding: 24rpx;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__info {
    margin-bottom: 24rpx;
  }

  &__info-card {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  &__info-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 20rpx;
    line-height: 1.4;
  }

  &__info-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
  }

  &__info-text {
    font-size: 26rpx;
    color: #999;
  }

  &__map {
    margin-bottom: 24rpx;
    border-radius: $border-radius-md;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  &__map-component {
    width: 100%;
    height: 480rpx;
  }

  &__location {
    margin-bottom: 32rpx;
  }

  &__location-card {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  &__location-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 20rpx;
  }

  &__location-text {
    flex: 1;
    font-size: 28rpx;
    color: $color-text;
  }

  &__location-relocate {
    display: flex;
    align-items: center;
    gap: 4rpx;
    flex-shrink: 0;
  }

  &__relocate-text {
    font-size: 24rpx;
    color: $color-primary;
  }

  &__distance {
    padding: 16rpx 0 0;
    border-top: 1rpx solid $color-border;
  }

  &__distance-in,
  &__distance-out,
  &__distance-unknown {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__distance-text {
    font-size: 26rpx;
    color: #999;

    &--success {
      color: $color-primary;
    }

    &--danger {
      color: $color-danger;
    }
  }

  &__action {
    padding: 0 24rpx;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  &__empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #ccc;
  }
}
</style>
