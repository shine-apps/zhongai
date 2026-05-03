<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const keyword = ref('')
const pointTypeFilter = ref<string | null>(null)
const changeTypeFilter = ref<string | null>(null)
const dateFrom = ref('')
const dateTo = ref('')

// ---- 表格数据 ----
const transactions = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 筛选选项 ----
const pointTypeOptions = [
  { label: '活动积分', value: 'activity' },
  { label: '捐助积分', value: 'donation' },
  { label: '签到积分', value: 'checkin' },
  { label: '任务积分', value: 'task' },
  { label: '奖励积分', value: 'bonus' },
  { label: '扣减积分', value: 'deduction' },
]

const changeTypeOptions = [
  { label: '收入', value: 'earn' },
  { label: '支出', value: 'spend' },
  { label: '过期', value: 'expire' },
  { label: '调整', value: 'adjust' },
]

// ---- 标签映射 ----
const pointTypeLabel = (type: string) => pointTypeOptions.find(p => p.value === type)?.label || type
const pointTypeColor = (type: string) => {
  const map: Record<string, string> = {
    activity: 'blue',
    donation: 'green',
    checkin: 'purple',
    task: 'orange',
    bonus: 'emerald',
    deduction: 'red',
  }
  return map[type] || 'gray'
}
const changeTypeLabel = (type: string) => changeTypeOptions.find(c => c.value === type)?.label || type
const sourceTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    activity_checkin: '活动签到',
    activity_organize: '活动组织',
    donation: '捐助',
    task_complete: '任务完成',
    admin_grant: '管理员发放',
    admin_deduct: '管理员扣减',
    sign_in: '每日签到',
    other: '其他',
  }
  return map[type] || type
}

// ---- 加载流水列表 ----
async function loadTransactions() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (keyword.value) query.keyword = keyword.value
    if (pointTypeFilter.value) query.pointType = pointTypeFilter.value
    if (changeTypeFilter.value) query.changeType = changeTypeFilter.value
    if (dateFrom.value) query.dateFrom = dateFrom.value
    if (dateTo.value) query.dateTo = dateTo.value

    const res = await $fetch<any>('/api/points/transactions', { params: query })
    if (res.code === 0) {
      transactions.value = res.data.list
      pagination.value = res.data.pagination
    } else {
      toast.add({ title: res.message || '加载失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '网络错误', color: 'red' })
  } finally {
    loading.value = false
  }
}

// ---- 搜索 ----
function handleSearch() {
  pagination.value.page = 1
  loadTransactions()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadTransactions()
}

// ---- 表格列定义 ----
const columns = [
  { key: 'user', id: 'user', label: '用户', class: 'w-[150px]' },
  { key: 'pointType', id: 'pointType', label: '积分类型', class: 'w-[100px]' },
  { key: 'changeType', id: 'changeType', label: '变动类型', class: 'w-[90px]' },
  { key: 'amount', id: 'amount', label: '数量', class: 'w-[80px]' },
  { key: 'balanceAfter', id: 'balanceAfter', label: '变动后余额', class: 'w-[100px]' },
  { key: 'sourceType', id: 'sourceType', label: '来源', class: 'w-[100px]' },
  { key: 'description', id: 'description', label: '描述' },
  { key: 'createdAt', id: 'createdAt', label: '时间', class: 'w-[160px]' },
]

onMounted(() => {
  loadTransactions()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">积分流水</h1>
      <p class="mt-1 text-sm text-gray-500">查看所有积分变动记录</p>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <UInput
          v-model="keyword"
          placeholder="搜索用户昵称"
          icon="i-heroicons-magnifying-glass"
          class="w-[200px]"
          @keyup.enter="handleSearch"
        />
        <USelect
          v-model="pointTypeFilter"
          :options="pointTypeOptions"
          placeholder="积分类型"
          clearable
          class="w-[140px]"
          @update:model-value="handleSearch"
        />
        <USelect
          v-model="changeTypeFilter"
          :options="changeTypeOptions"
          placeholder="变动类型"
          clearable
          class="w-[120px]"
          @update:model-value="handleSearch"
        />
        <UInput v-model="dateFrom" label="" type="date" placeholder="开始日期" class="w-[160px]" />
        <span class="text-gray-400">~</span>
        <UInput v-model="dateTo" label="" type="date" placeholder="结束日期" class="w-[160px]" />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="keyword = ''; pointTypeFilter = null; changeTypeFilter = null; dateFrom = ''; dateTo = ''; handleSearch()">重置</UButton>
      </div>
    </UCard>

    <!-- 流水列表表格 -->
    <UCard>
      <UTable
        :rows="transactions"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-arrow-path', label: '暂无积分流水数据' }"
      >
        <!-- 用户 -->
        <template #user-data="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="xs" />
            <span class="text-sm">{{ row.user?.nickname || '未知用户' }}</span>
          </div>
        </template>

        <!-- 积分类型 -->
        <template #pointType-data="{ row }">
          <UBadge :color="pointTypeColor(row.pointType)" variant="subtle" size="sm">
            {{ pointTypeLabel(row.pointType) }}
          </UBadge>
        </template>

        <!-- 变动类型 -->
        <template #changeType-data="{ row }">
          <span
            :class="[
              'text-sm font-medium',
              row.changeType === 'earn' ? 'text-green-600' :
              row.changeType === 'spend' || row.changeType === 'deduction' ? 'text-red-600' :
              'text-gray-600',
            ]"
          >
            {{ changeTypeLabel(row.changeType) }}
          </span>
        </template>

        <!-- 数量 -->
        <template #amount-data="{ row }">
          <span
            :class="[
              'text-sm font-semibold',
              row.changeType === 'earn' ? 'text-green-600' : 'text-red-600',
            ]"
          >
            {{ row.changeType === 'earn' ? '+' : '-' }}{{ row.amount }}
          </span>
        </template>

        <!-- 变动后余额 -->
        <template #balanceAfter-data="{ row }">
          <span class="text-sm">{{ row.balanceAfter }}</span>
        </template>

        <!-- 来源 -->
        <template #sourceType-data="{ row }">
          <span class="text-sm text-gray-600">{{ sourceTypeLabel(row.sourceType) }}</span>
        </template>

        <!-- 描述 -->
        <template #description-data="{ row }">
          <span class="text-sm text-gray-500">{{ row.description || '-' }}</span>
        </template>

        <!-- 时间 -->
        <template #createdAt-data="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
      </UTable>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="mt-4 flex justify-end">
        <UPagination
          :model-value="pagination.page"
          :total="pagination.total"
          :items-per-page="pagination.pageSize"
          @update:model-value="handlePageChange"
        />
      </div>
    </UCard>
  </div>
</template>
