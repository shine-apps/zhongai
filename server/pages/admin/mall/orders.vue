<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const statusFilter = ref<string | null>(null)
const keyword = ref('')

// ---- 表格数据 ----
const orders = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 订单详情弹窗 ----
const showDetailModal = ref(false)
const detailOrder = ref<any>(null)
const detailLoading = ref(false)

// ---- 管理员备注 ----
const adminRemark = ref('')
const savingRemark = ref(false)

// ---- 取消订单确认弹窗 ----
const showCancelModal = ref(false)
const cancelTarget = ref<any>(null)
const cancelling = ref(false)

// ---- 状态选项 ----
const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

// ---- 状态颜色映射 ----
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: 'yellow',
    processing: 'blue',
    shipped: 'primary',
    completed: 'green',
    cancelled: 'gray',
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

// ---- 加载订单列表 ----
async function loadOrders() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (statusFilter.value) query.status = statusFilter.value
    if (keyword.value) query.keyword = keyword.value

    const res = await $fetch<any>('/api/mall/orders', { params: query })
    if (res.code === 0) {
      orders.value = res.data.list
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
  loadOrders()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadOrders()
}

// ---- 查看订单详情 ----
async function viewDetail(order: any) {
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const res = await $fetch<any>(`/api/mall/orders/${order.id}`)
    if (res.code === 0) {
      detailOrder.value = res.data
      adminRemark.value = res.data.adminRemark || ''
    } else {
      toast.add({ title: res.message || '加载失败', color: 'red' })
      showDetailModal.value = false
    }
  } catch (err: any) {
    toast.add({ title: err.message || '网络错误', color: 'red' })
    showDetailModal.value = false
  } finally {
    detailLoading.value = false
  }
}

// ---- 更新订单状态 ----
async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const res = await $fetch<any>(`/api/mall/orders/${orderId}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    if (res.code === 0) {
      toast.add({ title: `订单状态已更新为「${statusLabel(newStatus)}」`, color: 'green' })
      // 刷新详情和列表
      if (detailOrder.value && detailOrder.value.id === orderId) {
        detailOrder.value = { ...detailOrder.value, status: newStatus }
      }
      loadOrders()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 开始处理 ----
function startProcessing(order: any) {
  updateOrderStatus(order.id, 'processing')
}

// ---- 发货 ----
function shipOrder(order: any) {
  updateOrderStatus(order.id, 'shipped')
}

// ---- 确认完成 ----
function completeOrder(order: any) {
  updateOrderStatus(order.id, 'completed')
}

// ---- 打开取消确认弹窗 ----
function openCancelModal(order: any) {
  cancelTarget.value = order
  showCancelModal.value = true
}

// ---- 确认取消订单 ----
async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    const res = await $fetch<any>(`/api/mall/orders/${cancelTarget.value.id}`, {
      method: 'PATCH',
      body: { status: 'cancelled' },
    })
    if (res.code === 0) {
      toast.add({ title: '订单已取消，积分将退还给用户', color: 'green' })
      showCancelModal.value = false
      cancelTarget.value = null
      if (detailOrder.value) {
        showDetailModal.value = false
      }
      loadOrders()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    cancelling.value = false
  }
}

// ---- 保存管理员备注 ----
async function saveRemark() {
  if (!detailOrder.value) return
  savingRemark.value = true
  try {
    const res = await $fetch<any>(`/api/mall/orders/${detailOrder.value.id}`, {
      method: 'PATCH',
      body: { adminRemark: adminRemark.value },
    })
    if (res.code === 0) {
      toast.add({ title: '备注已保存', color: 'green' })
      detailOrder.value = { ...detailOrder.value, adminRemark: adminRemark.value }
    } else {
      toast.add({ title: res.message || '保存失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    savingRemark.value = false
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'orderNo', label: '订单编号', class: 'w-[160px]' },
  { key: 'user', label: '用户', class: 'w-[160px]' },
  { key: 'itemCount', label: '商品数量', class: 'w-[90px]' },
  { key: 'activityPointsCost', label: '活动积分', class: 'w-[100px]' },
  { key: 'donationPointsCost', label: '捐助积分', class: 'w-[100px]' },
  { key: 'status', label: '状态', class: 'w-[100px]' },
  { key: 'recipientName', label: '收货人', class: 'w-[100px]' },
  { key: 'address', label: '收货地址', class: 'w-[180px]' },
  { key: 'createdAt', label: '创建时间', class: 'w-[160px]' },
  { key: 'actions', label: '操作', class: 'w-[160px]' },
]

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">订单管理</h1>
      <p class="mt-1 text-sm text-gray-500">管理积分商城的所有订单</p>
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
        <UInput
          v-model="keyword"
          placeholder="搜索订单编号 / 用户昵称"
          icon="i-heroicons-magnifying-glass"
          class="w-[280px]"
          @keyup.enter="handleSearch"
        />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="statusFilter = null; keyword = ''; handleSearch()">
          重置
        </UButton>
      </div>
    </UCard>

    <!-- 订单列表表格 -->
    <UCard>
      <UTable
        :rows="orders"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-shopping-cart', label: '暂无订单数据' }"
      >
        <!-- 订单编号 -->
        <template #orderNo-data="{ row }">
          <span class="font-mono text-sm text-gray-900">{{ row.orderNo }}</span>
        </template>

        <!-- 用户 -->
        <template #user-data="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="sm" />
            <span class="text-sm">{{ row.user?.nickname || '未知用户' }}</span>
          </div>
        </template>

        <!-- 商品数量 -->
        <template #itemCount-data="{ row }">
          <span class="text-sm">{{ row.itemCount ?? (row.items?.length ?? 0) }}</span>
        </template>

        <!-- 活动积分消耗 -->
        <template #activityPointsCost-data="{ row }">
          <span class="text-sm font-medium text-primary">{{ row.activityPointsCost ?? 0 }}</span>
        </template>

        <!-- 捐助积分消耗 -->
        <template #donationPointsCost-data="{ row }">
          <span class="text-sm font-medium text-orange-500">{{ row.donationPointsCost ?? 0 }}</span>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
        </template>

        <!-- 收货人 -->
        <template #recipientName-data="{ row }">
          <span class="text-sm">{{ row.recipientName || '-' }}</span>
        </template>

        <!-- 收货地址 -->
        <template #address-data="{ row }">
          <span class="text-xs text-gray-500 line-clamp-2">{{ row.address || '-' }}</span>
        </template>

        <!-- 创建时间 -->
        <template #createdAt-data="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" @click="viewDetail(row)">
              查看详情
            </UButton>
            <UDropdownMenu
              v-if="row.status !== 'completed' && row.status !== 'cancelled'"
              :items="[
                [
                  {
                    label: '开始处理',
                    icon: 'i-heroicons-play',
                    disabled: row.status !== 'pending',
                    onSelect: () => startProcessing(row),
                  },
                  {
                    label: '发货',
                    icon: 'i-heroicons-truck',
                    disabled: row.status !== 'processing',
                    onSelect: () => shipOrder(row),
                  },
                  {
                    label: '确认完成',
                    icon: 'i-heroicons-check-circle',
                    disabled: row.status !== 'shipped',
                    onSelect: () => completeOrder(row),
                  },
                ],
                [
                  {
                    label: '取消订单',
                    icon: 'i-heroicons-x-circle',
                    onSelect: () => openCancelModal(row),
                  },
                ],
              ]"
            >
              <UButton size="xs" variant="ghost" color="gray" icon="i-heroicons-ellipsis-vertical" />
            </UDropdownMenu>
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

    <!-- 订单详情弹窗 -->
    <UModal v-model:open="showDetailModal" title="订单详情">
      <div v-if="detailLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 animate-spin text-gray-400" />
        <span class="ml-2 text-sm text-gray-500">加载中...</span>
      </div>
      <div v-else-if="detailOrder" class="space-y-6 p-4">
        <!-- 订单基本信息 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UBadge :color="statusColor(detailOrder.status)" variant="subtle">
              {{ statusLabel(detailOrder.status) }}
            </UBadge>
            <span class="font-mono text-sm text-gray-500">{{ detailOrder.orderNo }}</span>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">创建时间：</span>
              <span>{{ formatDate(detailOrder.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500">活动积分消耗：</span>
              <span class="font-medium text-primary">{{ detailOrder.activityPointsCost ?? 0 }}</span>
            </div>
            <div>
              <span class="text-gray-500">捐助积分消耗：</span>
              <span class="font-medium text-orange-500">{{ detailOrder.donationPointsCost ?? 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 订单明细列表 -->
        <div>
          <h4 class="mb-2 text-sm font-semibold text-gray-700">订单明细</h4>
          <div class="space-y-3">
            <div
              v-for="(item, idx) in (detailOrder.items || [])"
              :key="idx"
              class="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <UAvatar
                :src="item.coverImage || item.product?.coverImage"
                :alt="item.productName || item.product?.name"
                size="md"
                img-class="object-cover rounded"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">
                  {{ item.productName || item.product?.name }}
                </p>
                <p class="text-xs text-gray-500">
                  数量: {{ item.quantity }}
                  <span v-if="item.activityPointsCost" class="ml-2">
                    活动积分: {{ item.activityPointsCost }}
                  </span>
                  <span v-if="item.donationPointsCost" class="ml-2">
                    捐助积分: {{ item.donationPointsCost }}
                  </span>
                </p>
              </div>
            </div>
            <div v-if="!detailOrder.items || detailOrder.items.length === 0" class="py-4 text-center text-sm text-gray-400">
              暂无明细数据
            </div>
          </div>
        </div>

        <!-- 收货信息 -->
        <div>
          <h4 class="mb-2 text-sm font-semibold text-gray-700">收货信息</h4>
          <div class="rounded-lg bg-gray-50 p-3 text-sm">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-gray-500">收货人：</span>
                <span>{{ detailOrder.recipientName || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">联系电话：</span>
                <span>{{ detailOrder.recipientPhone || '-' }}</span>
              </div>
            </div>
            <div class="mt-1">
              <span class="text-gray-500">收货地址：</span>
              <span>{{ detailOrder.address || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 状态流转按钮 -->
        <div v-if="detailOrder.status !== 'completed' && detailOrder.status !== 'cancelled'">
          <h4 class="mb-2 text-sm font-semibold text-gray-700">状态操作</h4>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="detailOrder.status === 'pending'"
              color="primary"
              size="sm"
              icon="i-heroicons-play"
              @click="startProcessing(detailOrder)"
            >
              开始处理
            </UButton>
            <UButton
              v-if="detailOrder.status === 'processing'"
              color="primary"
              size="sm"
              icon="i-heroicons-truck"
              @click="shipOrder(detailOrder)"
            >
              发货
            </UButton>
            <UButton
              v-if="detailOrder.status === 'shipped'"
              color="green"
              size="sm"
              icon="i-heroicons-check-circle"
              @click="completeOrder(detailOrder)"
            >
              确认完成
            </UButton>
            <UButton
              color="red"
              size="sm"
              variant="outline"
              icon="i-heroicons-x-circle"
              @click="openCancelModal(detailOrder)"
            >
              取消订单
            </UButton>
          </div>
        </div>

        <!-- 管理员备注 -->
        <div>
          <h4 class="mb-2 text-sm font-semibold text-gray-700">管理员备注</h4>
          <UTextarea
            v-model="adminRemark"
            placeholder="输入管理员备注信息..."
            :rows="3"
          />
          <div class="mt-2 flex justify-end">
            <UButton size="sm" color="primary" :loading="savingRemark" @click="saveRemark">
              保存备注
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- 取消订单确认弹窗 -->
    <UModal v-model:open="showCancelModal" title="确认取消订单">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-600">
          确定要取消订单 <span class="font-semibold text-gray-900">{{ cancelTarget?.orderNo }}</span> 吗？
        </p>
        <p class="text-sm text-orange-600">
          <UIcon name="i-heroicons-exclamation-triangle" class="mr-1" />
          取消后，用户消耗的积分将自动退还。
        </p>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showCancelModal = false">返回</UButton>
          <UButton color="red" :loading="cancelling" @click="confirmCancel">
            确认取消
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
