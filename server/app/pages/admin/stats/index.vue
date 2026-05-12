<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 统计概览 ----
const overview = ref<any>(null)
const loading = ref(false)

// ---- 加载统计数据 ----
async function loadOverview() {
  loading.value = true
  try {
    const res = await $fetch<any>('/api/stats/overview')
    if (res.code === 0) {
      overview.value = res.data
    } else {
      toast.add({ title: res.message || '加载失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '网络错误', color: 'red' })
  } finally {
    loading.value = false
  }
}

// ---- 统计卡片配置 ----
const statCards = computed(() => {
  if (!overview.value) return []
  return [
    {
      label: '总用户数',
      value: overview.value.totalUsers ?? 0,
      icon: 'i-heroicons-users',
      color: 'blue' as const,
    },
    {
      label: '活动总数',
      value: overview.value.totalActivities ?? 0,
      icon: 'i-heroicons-calendar',
      color: 'green' as const,
    },
    {
      label: '进行中活动',
      value: overview.value.ongoingActivities ?? 0,
      icon: 'i-heroicons-bolt',
      color: 'orange' as const,
    },
    {
      label: '总捐助金额',
      value: `¥${Number(overview.value.totalDonationAmount || 0).toFixed(2)}`,
      icon: 'i-heroicons-banknotes',
      color: 'emerald' as const,
    },
    {
      label: '待审核捐助',
      value: overview.value.pendingDonations ?? 0,
      icon: 'i-heroicons-clock',
      color: 'yellow' as const,
    },
    {
      label: '积分发放总量',
      value: overview.value.totalPointsGranted ?? 0,
      icon: 'i-heroicons-star',
      color: 'purple' as const,
    },
    {
      label: '本月新增用户',
      value: overview.value.newUsersThisMonth ?? 0,
      icon: 'i-heroicons-user-plus',
      color: 'cyan' as const,
    },
    {
      label: '本月活动次数',
      value: overview.value.activitiesThisMonth ?? 0,
      icon: 'i-heroicons-fire',
      color: 'rose' as const,
    },
  ]
})

onMounted(() => {
  loadOverview()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">数据统计</h1>
      <p class="mt-1 text-sm text-gray-500">平台运营数据概览与趋势分析</p>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="h-10 w-10 animate-spin text-gray-400" />
    </div>

    <template v-else>
      <!-- 顶部统计卡片 -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <UCard v-for="card in statCards" :key="card.label">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-lg',
                `bg-${card.color}-100`,
              ]"
            >
              <UIcon :name="card.icon" :class="`h-5 w-5 text-${card.color}-600`" />
            </div>
            <div>
              <div class="text-xs text-gray-400">{{ card.label }}</div>
              <div class="text-xl font-bold text-gray-900">{{ card.value }}</div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 活动参与趋势 -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">活动参与趋势</h2>
        </template>
        <div class="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div class="text-center text-gray-400">
            <UIcon name="i-heroicons-chart-bar" class="mx-auto mb-3 h-12 w-12" />
            <p class="text-lg font-medium">图表区域 - 待接入 ECharts / Chart.js</p>
            <p class="mt-1 text-sm">展示近 12 个月的活动参与人数趋势</p>
          </div>
        </div>
      </UCard>

      <!-- 捐助金额统计 -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">捐助金额统计</h2>
        </template>
        <div class="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div class="text-center text-gray-400">
            <UIcon name="i-heroicons-chart-pie" class="mx-auto mb-3 h-12 w-12" />
            <p class="text-lg font-medium">图表区域 - 待接入 ECharts / Chart.js</p>
            <p class="mt-1 text-sm">展示各类型捐助金额占比与月度趋势</p>
          </div>
        </div>
      </UCard>

      <!-- 积分存量趋势 -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">积分存量趋势</h2>
        </template>
        <div class="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div class="text-center text-gray-400">
            <UIcon name="i-heroicons-chart-line" class="mx-auto mb-3 h-12 w-12" />
            <p class="text-lg font-medium">图表区域 - 待接入 ECharts / Chart.js</p>
            <p class="mt-1 text-sm">展示积分发放与消耗的月度趋势对比</p>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
