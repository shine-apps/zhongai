<script setup lang="ts">
interface Activity {
  id: string
  title: string
  category: string
  description?: string
  coverImage?: string
  startTime: string
  endTime: string
  location?: string
  maxParticipants?: number
  currentParticipants?: number
  rewardPoints: number
  status: string
  organizerId?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

interface Props {
  activity: Activity
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', activity: Activity): void
}>()

/** 分类中文映射 */
const categoryMap: Record<string, string> = {
  meeting: '会议',
  training: '培训',
  team_building: '团建',
  charity: '公益',
  competition: '比赛',
  other: '其他',
}

/** 状态中文映射 */
const statusMap: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

/** 状态标签颜色 */
function getStatusType(status: string): string {
  const map: Record<string, string> = {
    published: 'success',
    ongoing: 'primary',
    completed: 'default',
    cancelled: 'danger',
    draft: 'warning',
  }
  return map[status] || 'default'
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function handleClick() {
  emit('click', props.activity)
}
</script>

<template>
  <view class="activity-card" @click="handleClick">
    <!-- 封面图 -->
    <view class="activity-card__cover">
      <wd-img
        v-if="activity.coverImage"
        :src="activity.coverImage"
        width="100%"
        height="320rpx"
        mode="aspectFill"
        custom-style="border-radius: 16rpx 16rpx 0 0;"
      />
      <view v-else class="activity-card__cover-placeholder">
        <wd-icon name="picture" size="80rpx" color="#ccc" />
      </view>
      <!-- 状态标签 -->
      <view class="activity-card__status">
        <wd-tag
          :type="getStatusType(activity.status)"
          plain
          round
          size="small"
        >
          {{ statusMap[activity.status] || activity.status }}
        </wd-tag>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="activity-card__content">
      <!-- 标题 -->
      <view class="activity-card__title">
        {{ activity.title }}
      </view>

      <!-- 分类标签 -->
      <view class="activity-card__tags">
        <wd-tag type="primary" plain round size="small">
          {{ categoryMap[activity.category] || activity.category }}
        </wd-tag>
        <wd-tag type="warning" plain round size="small">
          +{{ activity.rewardPoints }}积分
        </wd-tag>
      </view>

      <!-- 信息行 -->
      <view class="activity-card__info">
        <view class="activity-card__info-item">
          <wd-icon name="clock" size="28rpx" color="#999" />
          <text class="activity-card__info-text">
            {{ formatDate(activity.startTime) }}
          </text>
        </view>
        <view v-if="activity.location" class="activity-card__info-item">
          <wd-icon name="location" size="28rpx" color="#999" />
          <text class="activity-card__info-text">{{ activity.location }}</text>
        </view>
        <view class="activity-card__info-item">
          <wd-icon name="user" size="28rpx" color="#999" />
          <text class="activity-card__info-text">
            {{ activity.currentParticipants || 0 }}{{ activity.maxParticipants ? '/' + activity.maxParticipants : '' }}人
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.activity-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;

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

  &__status {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
  }

  &__content {
    padding: 20rpx 24rpx 24rpx;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    margin-bottom: 16rpx;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 16rpx;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__info-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__info-text {
    font-size: 24rpx;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
