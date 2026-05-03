<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const keyword = ref('')
const categoryFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

// ---- 表格数据 ----
const activities = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 创建/编辑弹窗 ----
const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref({
  title: '',
  category: 'meeting',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: null as number | null,
  rewardPoints: 0,
})

// ---- 分类选项 ----
const categoryOptions = [
  { label: '例会', value: 'meeting' },
  { label: '培训', value: 'training' },
  { label: '团建', value: 'team_building' },
  { label: '公益', value: 'charity' },
  { label: '比赛', value: 'competition' },
  { label: '其他', value: 'other' },
]

// ---- 状态选项 ----
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '进行中', value: 'ongoing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

// ---- 颜色映射 ----
const categoryLabel = (cat: string) => categoryOptions.find(c => c.value === cat)?.label || cat
const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    meeting: 'blue',
    training: 'purple',
    team_building: 'orange',
    charity: 'green',
    competition: 'red',
    other: 'gray',
  }
  return map[cat] || 'gray'
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    draft: 'gray',
    published: 'blue',
    ongoing: 'green',
    completed: 'emerald',
    cancelled: 'red',
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status

// ---- 加载活动列表 ----
async function loadActivities() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (keyword.value) query.keyword = keyword.value
    if (categoryFilter.value) query.category = categoryFilter.value
    if (statusFilter.value) query.status = statusFilter.value

    const res = await $fetch<any>('/api/activities', { params: query })
    if (res.code === 0) {
      activities.value = res.data.list
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
  loadActivities()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadActivities()
}

// ---- 打开创建弹窗 ----
function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    title: '',
    category: 'meeting',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: null,
    rewardPoints: 0,
  }
  showFormModal.value = true
}

// ---- 打开编辑弹窗 ----
function openEditModal(activity: any) {
  isEditing.value = true
  editingId.value = activity.id
  formData.value = {
    title: activity.title,
    category: activity.category,
    description: activity.description || '',
    startTime: activity.startTime ? activity.startTime.slice(0, 16) : '',
    endTime: activity.endTime ? activity.endTime.slice(0, 16) : '',
    location: activity.location || '',
    maxParticipants: activity.maxParticipants,
    rewardPoints: activity.rewardPoints,
  }
  showFormModal.value = true
}

// ---- 提交表单 ----
async function submitForm() {
  if (!formData.value.title) {
    toast.add({ title: '请输入活动标题', color: 'orange' })
    return
  }
  try {
    let res: any
    if (isEditing.value && editingId.value) {
      res = await $fetch<any>(`/api/activities/${editingId.value}`, {
        method: 'PATCH',
        body: formData.value,
      })
    } else {
      res = await $fetch<any>('/api/activities', {
        method: 'POST',
        body: formData.value,
      })
    }
    if (res.code === 0) {
      toast.add({ title: isEditing.value ? '编辑成功' : '创建成功', color: 'green' })
      showFormModal.value = false
      loadActivities()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 发布活动 ----
async function publishActivity(activity: any) {
  try {
    const res = await $fetch<any>(`/api/activities/${activity.id}`, {
      method: 'PATCH',
      body: { status: 'published' },
    })
    if (res.code === 0) {
      toast.add({ title: '发布成功', color: 'green' })
      loadActivities()
    } else {
      toast.add({ title: res.message || '发布失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 删除活动 ----
async function deleteActivity(activity: any) {
  if (!confirm(`确定要删除活动「${activity.title}」吗？此操作不可恢复。`)) return
  try {
    const res = await $fetch<any>(`/api/activities/${activity.id}`, {
      method: 'DELETE',
    })
    if (res.code === 0) {
      toast.add({ title: '删除成功', color: 'green' })
      loadActivities()
    } else {
      toast.add({ title: res.message || '删除失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'title', id: 'title', label: '标题' },
  { key: 'category', id: 'category', label: '分类', class: 'w-[100px]' },
  { key: 'time', id: 'time', label: '时间', class: 'w-[180px]' },
  { key: 'location', id: 'location', label: '地点', class: 'w-[140px]' },
  { key: 'participants', id: 'participants', label: '人数', class: 'w-[100px]' },
  { key: 'rewardPoints', id: 'rewardPoints', label: '积分', class: 'w-[80px]' },
  { key: 'status', id: 'status', label: '状态', class: 'w-[100px]' },
  { key: 'actions', id: 'actions', label: '操作', class: 'w-[240px]' },
]

onMounted(() => {
  loadActivities()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">活动管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理平台所有志愿活动</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openCreateModal">
        创建活动
      </UButton>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <UInput
          v-model="keyword"
          placeholder="搜索活动标题"
          icon="i-heroicons-magnifying-glass"
          class="w-[240px]"
          @keyup.enter="handleSearch"
        />
        <USelect
          v-model="categoryFilter"
          :options="categoryOptions"
          placeholder="分类筛选"
          clearable
          class="w-[140px]"
          @update:model-value="handleSearch"
        />
        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          class="w-[140px]"
          @update:model-value="handleSearch"
        />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="keyword = ''; categoryFilter = null; statusFilter = null; handleSearch()">重置</UButton>
      </div>
    </UCard>

    <!-- 活动列表表格 -->
    <UCard>
      <UTable
        :rows="activities"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-calendar', label: '暂无活动数据' }"
      >
        <!-- 标题 -->
        <template #title-data="{ row }">
          <NuxtLink :to="`/admin/activities/${row.id}`" class="text-primary font-medium hover:underline">
            {{ row.title }}
          </NuxtLink>
        </template>

        <!-- 分类 -->
        <template #category-data="{ row }">
          <UBadge :color="categoryColor(row.category)" variant="subtle" size="sm">
            {{ categoryLabel(row.category) }}
          </UBadge>
        </template>

        <!-- 时间 -->
        <template #time-data="{ row }">
          <div class="text-xs text-gray-600">
            <div>{{ formatDate(row.startTime) }}</div>
            <div class="text-gray-400">至 {{ formatDate(row.endTime) }}</div>
          </div>
        </template>

        <!-- 地点 -->
        <template #location-data="{ row }">
          <span class="text-sm">{{ row.location || '-' }}</span>
        </template>

        <!-- 人数 -->
        <template #participants-data="{ row }">
          <span class="text-sm">{{ row.currentParticipants ?? 0 }}{{ row.maxParticipants ? ` / ${row.maxParticipants}` : '' }}</span>
        </template>

        <!-- 积分 -->
        <template #rewardPoints-data="{ row }">
          <span class="text-sm font-medium text-primary">+{{ row.rewardPoints }}</span>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" :to="`/admin/activities/${row.id}`">
              查看
            </UButton>
            <UButton size="xs" variant="ghost" color="blue" @click="openEditModal(row)">
              编辑
            </UButton>
            <UButton
              v-if="row.status === 'draft'"
              size="xs"
              variant="ghost"
              color="green"
              @click="publishActivity(row)"
            >
              发布
            </UButton>
            <UButton size="xs" variant="ghost" color="red" @click="deleteActivity(row)">
              删除
            </UButton>
          </div>
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

    <!-- 创建/编辑活动弹窗 -->
    <UModal v-model:open="showFormModal" :title="isEditing ? '编辑活动' : '创建活动'">
      <div class="space-y-4 p-4">
        <UInput v-model="formData.title" label="活动标题" placeholder="请输入活动标题" />
        <USelect v-model="formData.category" :options="categoryOptions" label="活动分类" />
        <UTextarea v-model="formData.description" label="活动描述" placeholder="请输入活动描述" :rows="4" />
        <div class="grid grid-cols-2 gap-4">
          <UInput v-model="formData.startTime" label="开始时间" type="datetime-local" />
          <UInput v-model="formData.endTime" label="结束时间" type="datetime-local" />
        </div>
        <UInput v-model="formData.location" label="活动地点" placeholder="请输入活动地点" />
        <div class="grid grid-cols-2 gap-4">
          <UInput v-model.number="formData.maxParticipants" label="最大人数" type="number" placeholder="不限则留空" />
          <UInput v-model.number="formData.rewardPoints" label="积分奖励" type="number" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="outline" @click="showFormModal = false">取消</UButton>
          <UButton color="primary" :loading="loading" @click="submitForm">
            {{ isEditing ? '保存' : '创建' }}
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
