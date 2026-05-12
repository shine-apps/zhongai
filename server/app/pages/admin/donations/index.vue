<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)

// ---- 表格数据 ----
const donations = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 审核弹窗 ----
const showReviewModal = ref(false)
const reviewTarget = ref<any>(null)
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewForm = ref({
  points: 0,
  remark: '',
})

// ---- 凭证预览弹窗 ----
const showPreviewModal = ref(false)
const previewImages = ref<string[]>([])

// ---- 状态选项 ----
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

// ---- 类型选项 ----
const typeOptions = [
  { label: '资金', value: 'money' },
  { label: '物资', value: 'goods' },
  { label: '服务', value: 'service' },
]

// ---- 颜色映射 ----
const statusColor = (status: string) => {
  const map: Record<string, string> = { pending: 'yellow', approved: 'green', rejected: 'red' }
  return map[status] || 'gray'
}
const statusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status
const typeColor = (type: string) => {
  const map: Record<string, string> = { money: 'green', goods: 'blue', service: 'purple' }
  return map[type] || 'gray'
}
const typeLabel = (type: string) => typeOptions.find(t => t.value === type)?.label || type

// ---- 加载捐助列表 ----
async function loadDonations() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (statusFilter.value) query.status = statusFilter.value
    if (typeFilter.value) query.donationType = typeFilter.value

    const res = await $fetch<any>('/api/donations', { params: query })
    if (res.code === 0) {
      donations.value = res.data.list
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
  loadDonations()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadDonations()
}

// ---- 查看凭证图片 ----
function previewEvidence(item: any) {
  previewImages.value = (item.evidenceImages || [])
  showPreviewModal.value = true
}

// ---- 打开审核弹窗 ----
function openReviewModal(item: any, action: 'approve' | 'reject') {
  reviewTarget.value = item
  reviewAction.value = action
  reviewForm.value = { points: 0, remark: '' }
  showReviewModal.value = true
}

// ---- 提交审核 ----
async function submitReview() {
  if (!reviewTarget.value) return
  try {
    const endpoint = reviewAction.value === 'approve'
      ? `/api/donations/${reviewTarget.value.id}/approve`
      : `/api/donations/${reviewTarget.value.id}/reject`

    const body: Record<string, any> = { remark: reviewForm.value.remark }
    if (reviewAction.value === 'approve') {
      body.points = reviewForm.value.points
    }

    const res = await $fetch<any>(endpoint, { method: 'PATCH', body })
    if (res.code === 0) {
      toast.add({
        title: reviewAction.value === 'approve' ? '审核通过' : '已驳回',
        color: 'green',
      })
      showReviewModal.value = false
      loadDonations()
    } else {
      toast.add({ title: res.message || '审核失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'user', label: '捐助人', class: 'w-[150px]' },
  { key: 'donationType', label: '类型', class: 'w-[80px]' },
  { key: 'amount', label: '金额/物资', class: 'w-[140px]' },
  { key: 'evidence', label: '凭证', class: 'w-[100px]' },
  { key: 'status', label: '状态', class: 'w-[100px]' },
  { key: 'createdAt', label: '提交时间', class: 'w-[160px]' },
  { key: 'actions', label: '操作', class: 'w-[200px]' },
]

onMounted(() => {
  loadDonations()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">捐助审核</h1>
      <p class="mt-1 text-sm text-gray-500">审核用户提交的捐助申请</p>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="状态筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <USelect
          v-model="typeFilter"
          :items="typeOptions"
          placeholder="类型筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="statusFilter = null; typeFilter = null; handleSearch()">重置</UButton>
      </div>
    </UCard>

    <!-- 捐助列表表格 -->
    <UCard>
      <UTable
        :rows="donations"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-heart', label: '暂无捐助数据' }"
      >
        <!-- 捐助人 -->
        <template #user-data="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="sm" />
            <div>
              <div class="text-sm font-medium">{{ row.user?.nickname || '未知用户' }}</div>
              <div class="text-xs text-gray-400">{{ row.user?.phone || '' }}</div>
            </div>
          </div>
        </template>

        <!-- 类型 -->
        <template #donationType-data="{ row }">
          <UBadge :color="typeColor(row.donationType)" variant="subtle">
            {{ typeLabel(row.donationType) }}
          </UBadge>
        </template>

        <!-- 金额/物资 -->
        <template #amount-data="{ row }">
          <div v-if="row.donationType === 'money'" class="text-sm font-medium text-green-600">
            ¥{{ Number(row.amount).toFixed(2) }}
          </div>
          <div v-else class="text-sm">
            <div>{{ row.materialDesc || '-' }}</div>
            <div v-if="row.materialValue" class="text-xs text-gray-400">
              估值: ¥{{ Number(row.materialValue).toFixed(2) }}
            </div>
          </div>
        </template>

        <!-- 凭证图片 -->
        <template #evidence-data="{ row }">
          <div v-if="row.evidenceImages && row.evidenceImages.length > 0" class="flex items-center gap-1">
            <img
              v-for="(img, idx) in row.evidenceImages.slice(0, 3)"
              :key="idx"
              :src="img"
              class="h-8 w-8 rounded object-cover cursor-pointer border border-gray-200"
              @click="previewEvidence(row)"
            />
            <span v-if="row.evidenceImages.length > 3" class="text-xs text-gray-400">
              +{{ row.evidenceImages.length - 3 }}
            </span>
          </div>
          <span v-else class="text-xs text-gray-400">无凭证</span>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
        </template>

        <!-- 提交时间 -->
        <template #createdAt-data="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              v-if="row.evidenceImages && row.evidenceImages.length > 0"
              size="xs"
              variant="ghost"
              color="primary"
              @click="previewEvidence(row)"
            >
              凭证
            </UButton>
            <UButton
              v-if="row.status === 'pending'"
              size="xs"
              variant="ghost"
              color="green"
              @click="openReviewModal(row, 'approve')"
            >
              通过
            </UButton>
            <UButton
              v-if="row.status === 'pending'"
              size="xs"
              variant="ghost"
              color="red"
              @click="openReviewModal(row, 'reject')"
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

    <!-- 凭证图片预览弹窗 -->
    <UModal v-model:open="showPreviewModal" title="凭证图片">
      <div class="space-y-3 p-4">
        <div v-if="previewImages.length === 0" class="py-8 text-center text-gray-400">
          暂无凭证图片
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <img
            v-for="(img, idx) in previewImages"
            :key="idx"
            :src="img"
            class="w-full rounded-lg border border-gray-200 object-cover"
          />
        </div>
        <div v-if="reviewTarget?.evidenceDesc" class="text-sm text-gray-600">
          <span class="font-medium">凭证说明：</span>{{ reviewTarget.evidenceDesc }}
        </div>
      </div>
    </UModal>

    <!-- 审核表单弹窗 -->
    <UModal v-model:open="showReviewModal" :title="reviewAction === 'approve' ? '审核通过' : '审核驳回'">
      <div class="space-y-4 p-4">
        <div v-if="reviewAction === 'approve'" class="text-sm text-gray-600">
          <p class="mb-2">
            捐助人：<span class="font-semibold">{{ reviewTarget?.user?.nickname }}</span>
          </p>
          <p class="mb-2">
            类型：<UBadge :color="typeColor(reviewTarget?.donationType)" variant="subtle" class="ml-1">
              {{ typeLabel(reviewTarget?.donationType) }}
            </UBadge>
          </p>
          <p v-if="reviewTarget?.donationType === 'money'" class="mb-2">
            金额：<span class="font-semibold text-green-600">¥{{ Number(reviewTarget?.amount).toFixed(2) }}</span>
          </p>
        </div>

        <UInput
          v-if="reviewAction === 'approve'"
          v-model.number="reviewForm.points"
          label="发放积分"
          type="number"
          placeholder="请输入要发放的积分数"
        />
        <UTextarea
          v-model="reviewForm.remark"
          :label="reviewAction === 'approve' ? '审核备注（选填）' : '驳回原因'"
          :placeholder="reviewAction === 'approve' ? '请输入备注信息' : '请输入驳回原因'"
          :rows="3"
        />

        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showReviewModal = false">取消</UButton>
          <UButton
            :color="reviewAction === 'approve' ? 'green' : 'red'"
            @click="submitReview"
          >
            {{ reviewAction === 'approve' ? '确认通过' : '确认驳回' }}
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
