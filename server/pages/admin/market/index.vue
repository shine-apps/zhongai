<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const statusFilter = ref<string | null>(null)
const postTypeFilter = ref<string | null>(null)

// ---- 表格数据 ----
const posts = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 详情弹窗 ----
const showDetailModal = ref(false)
const detailPost = ref<any>(null)

// ---- 驳回弹窗 ----
const showRejectModal = ref(false)
const rejectTarget = ref<any>(null)
const rejectReason = ref('')

// ---- 状态选项 ----
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

// ---- 帖子类型选项 ----
const postTypeOptions = [
  { label: '招聘', value: 'job_recruit' },
  { label: '求职', value: 'job_seek' },
  { label: '闲置出售', value: 'idle_sell' },
  { label: '求购', value: 'idle_buy' },
]

// ---- 颜色/标签映射 ----
const postTypeLabel = (type: string) => postTypeOptions.find(t => t.value === type)?.label || type
const postTypeColor = (type: string) => {
  const map: Record<string, string> = {
    job_recruit: 'blue',
    job_seek: 'green',
    idle_sell: 'orange',
    idle_buy: 'purple',
  }
  return map[type] || 'gray'
}

const statusColor = (status: string) => {
  const map: Record<string, string> = { pending: 'yellow', approved: 'green', rejected: 'red' }
  return map[status] || 'gray'
}
const statusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status

const pointTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    volunteer: '志愿积分',
    donation: '捐助积分',
  }
  return map[type] || type
}

// ---- 加载帖子列表 ----
async function loadPosts() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (statusFilter.value) query.status = statusFilter.value
    if (postTypeFilter.value) query.postType = postTypeFilter.value

    const res = await $fetch<any>('/api/market/posts', { params: query })
    if (res.code === 0) {
      posts.value = res.data.list
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
  loadPosts()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadPosts()
}

// ---- 查看详情 ----
function viewDetail(post: any) {
  detailPost.value = post
  showDetailModal.value = true
}

// ---- 审核通过 ----
async function approvePost(post: any) {
  try {
    const res = await $fetch<any>(`/api/market/posts/${post.id}/approve`, {
      method: 'PATCH',
    })
    if (res.code === 0) {
      toast.add({ title: '审核通过', color: 'green' })
      loadPosts()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 打开驳回弹窗 ----
function openRejectModal(post: any) {
  rejectTarget.value = post
  rejectReason.value = ''
  showRejectModal.value = true
}

// ---- 提交驳回 ----
async function submitReject() {
  if (!rejectTarget.value) return
  if (!rejectReason.value.trim()) {
    toast.add({ title: '请输入驳回原因', color: 'orange' })
    return
  }
  try {
    const res = await $fetch<any>(`/api/market/posts/${rejectTarget.value.id}/reject`, {
      method: 'PATCH',
      body: { reason: rejectReason.value },
    })
    if (res.code === 0) {
      toast.add({ title: '已驳回', color: 'green' })
      showRejectModal.value = false
      loadPosts()
    } else {
      toast.add({ title: res.message || '驳回失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'title', id: 'title', label: '标题' },
  { key: 'postType', id: 'postType', label: '类型', class: 'w-[100px]' },
  { key: 'user', id: 'user', label: '发布人', class: 'w-[160px]' },
  { key: 'pointsCost', id: 'pointsCost', label: '积分消耗', class: 'w-[120px]' },
  { key: 'status', id: 'status', label: '状态', class: 'w-[100px]' },
  { key: 'createdAt', id: 'createdAt', label: '发布时间', class: 'w-[160px]' },
  { key: 'actions', id: 'actions', label: '操作', class: 'w-[200px]' },
]

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">爱心集市审核</h1>
      <p class="mt-1 text-sm text-gray-500">审核用户在爱心集市发布的帖子</p>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <USelect
          v-model="postTypeFilter"
          :options="postTypeOptions"
          placeholder="帖子类型筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="statusFilter = null; postTypeFilter = null; handleSearch()">重置</UButton>
      </div>
    </UCard>

    <!-- 帖子列表表格 -->
    <UCard>
      <UTable
        :rows="posts"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-shopping-bag', label: '暂无帖子数据' }"
      >
        <!-- 标题 -->
        <template #title-data="{ row }">
          <span class="text-sm font-medium text-gray-900">{{ row.title }}</span>
        </template>

        <!-- 类型 -->
        <template #postType-data="{ row }">
          <UBadge :color="postTypeColor(row.postType)" variant="subtle" size="sm">
            {{ postTypeLabel(row.postType) }}
          </UBadge>
        </template>

        <!-- 发布人 -->
        <template #user-data="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="sm" />
            <span class="text-sm">{{ row.user?.nickname || '未知用户' }}</span>
          </div>
        </template>

        <!-- 积分消耗 -->
        <template #pointsCost-data="{ row }">
          <div class="text-sm">
            <span class="font-medium text-primary">{{ row.pointsCost }}</span>
            <span class="ml-1 text-xs text-gray-400">{{ pointTypeLabel(row.pointTypeUsed) }}</span>
          </div>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
        </template>

        <!-- 发布时间 -->
        <template #createdAt-data="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" @click="viewDetail(row)">
              查看详情
            </UButton>
            <UButton
              v-if="row.status === 'pending'"
              size="xs"
              variant="ghost"
              color="green"
              @click="approvePost(row)"
            >
              通过
            </UButton>
            <UButton
              v-if="row.status === 'pending'"
              size="xs"
              variant="ghost"
              color="red"
              @click="openRejectModal(row)"
            >
              驳回
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

    <!-- 帖子详情弹窗 -->
    <UModal v-model:open="showDetailModal" title="帖子详情">
      <div v-if="detailPost" class="space-y-4 p-4">
        <!-- 基本信息 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UBadge :color="postTypeColor(detailPost.postType)" variant="subtle" size="sm">
              {{ postTypeLabel(detailPost.postType) }}
            </UBadge>
            <UBadge :color="statusColor(detailPost.status)" variant="subtle">
              {{ statusLabel(detailPost.status) }}
            </UBadge>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">{{ detailPost.title }}</h3>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <UAvatar :src="detailPost.user?.avatarUrl" :alt="detailPost.user?.nickname" size="xs" />
            <span>{{ detailPost.user?.nickname || '未知用户' }}</span>
            <span class="text-gray-300">|</span>
            <span>{{ formatDate(detailPost.createdAt) }}</span>
          </div>
        </div>

        <!-- 内容 -->
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="whitespace-pre-wrap text-sm text-gray-700">{{ detailPost.content }}</p>
        </div>

        <!-- 图片 -->
        <div v-if="detailPost.images && detailPost.images.length > 0">
          <p class="mb-2 text-sm font-medium text-gray-600">图片</p>
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="(img, idx) in detailPost.images"
              :key="idx"
              :src="img"
              class="h-24 w-full rounded-lg border border-gray-200 object-cover"
            />
          </div>
        </div>

        <!-- 联系方式 -->
        <div v-if="detailPost.contactInfo">
          <p class="text-sm text-gray-600">
            <span class="font-medium">联系方式：</span>{{ detailPost.contactInfo }}
          </p>
        </div>

        <!-- 积分消耗 -->
        <div class="text-sm text-gray-600">
          <span class="font-medium">积分消耗：</span>
          <span class="text-primary">{{ detailPost.pointsCost }}</span>
          {{ pointTypeLabel(detailPost.pointTypeUsed) }}
        </div>

        <!-- 审核信息 -->
        <div v-if="detailPost.status !== 'pending' && detailPost.reviewedAt">
          <p class="text-sm text-gray-500">
            <span class="font-medium">审核时间：</span>{{ formatDate(detailPost.reviewedAt) }}
          </p>
        </div>
      </div>
    </UModal>

    <!-- 驳回原因弹窗 -->
    <UModal v-model:open="showRejectModal" title="驳回帖子">
      <div class="space-y-4 p-4">
        <div class="text-sm text-gray-600">
          <p class="mb-1">
            帖子标题：<span class="font-semibold">{{ rejectTarget?.title }}</span>
          </p>
          <p>
            发布人：<span class="font-semibold">{{ rejectTarget?.user?.nickname }}</span>
          </p>
        </div>
        <UTextarea
          v-model="rejectReason"
          label="驳回原因"
          placeholder="请输入驳回原因，将通知发布人"
          :rows="4"
        />
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showRejectModal = false">取消</UButton>
          <UButton color="red" @click="submitReject">确认驳回</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
