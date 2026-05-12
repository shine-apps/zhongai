<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: overview, pending, error } = await useLazyAsyncData(
  'admin-overview',
  () => useApiGet<{
    totalVolunteers: number
    totalActivities: number
    estimatedServiceHours: number
    totalDonationAmount: string
    totalHelpCount: number
    totalCheckins: number
    totalPointsGranted: string
  }>('/stats/overview'),
  {
    server: false,
    default: () => ({
      code: 0,
      message: 'success',
      data: {
        totalVolunteers: 0,
        totalActivities: 0,
        estimatedServiceHours: 0,
        totalDonationAmount: '0',
        totalHelpCount: 0,
        totalCheckins: 0,
        totalPointsGranted: '0',
      },
    }),
  },
)

/** 格式化金额 */
function formatAmount(value: string | number): string {
  const num = Number(value)
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        仪表盘
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        平台运营数据概览
      </p>
    </div>

    <!-- 统计卡片行 -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatsCard
        title="总志愿者数"
        :value="overview?.data?.totalVolunteers ?? 0"
        icon="i-heroicons-users"
        color="emerald"
      />
      <AdminStatsCard
        title="总活动数"
        :value="overview?.data?.totalActivities ?? 0"
        icon="i-heroicons-calendar"
        color="blue"
      />
      <AdminStatsCard
        title="总捐助金额"
        :value="formatAmount(overview?.data?.totalDonationAmount ?? '0')"
        icon="i-heroicons-heart"
        color="amber"
      />
      <AdminStatsCard
        title="总发放积分"
        :value="formatAmount(overview?.data?.totalPointsGranted ?? '0')"
        icon="i-heroicons-star"
        color="purple"
      />
    </div>

    <!-- 下方占位卡片 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 积分趋势 -->
      <UCard>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">
            积分趋势
          </h2>
          <UBadge color="neutral" variant="subtle">
            近 30 天
          </UBadge>
        </div>
        <div class="flex h-48 items-center justify-center text-gray-400">
          <div class="text-center">
            <UIcon name="i-heroicons-chart-bar" class="mx-auto mb-2 h-10 w-10" />
            <p class="text-sm">
              积分趋势图表（开发中）
            </p>
          </div>
        </div>
      </UCard>

      <!-- 活动参与漏斗 -->
      <UCard>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">
            活动参与漏斗
          </h2>
          <UBadge color="neutral" variant="subtle">
            近 30 天
          </UBadge>
        </div>
        <div class="flex h-48 items-center justify-center text-gray-400">
          <div class="text-center">
            <UIcon name="i-heroicons-funnel" class="mx-auto mb-2 h-10 w-10" />
            <p class="text-sm">
              活动参与漏斗图表（开发中）
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 加载状态 -->
    <div v-if="pending" class="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  </div>
</template>
