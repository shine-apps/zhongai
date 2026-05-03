<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const keyword = ref('')
const typeFilter = ref<string | null>(null)

// ---- 表格数据 ----
const products = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 创建/编辑弹窗 ----
const showFormModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)

const formData = ref({
  name: '',
  description: '',
  coverImage: '',
  images: [''],
  type: 'physical',
  activityPointsPrice: 0,
  donationPointsPrice: 0,
  allowedPointTypes: ['activity', 'donation'],
  stock: -1,
  isRecommended: false,
  sortWeight: 0,
})

// ---- 删除确认弹窗 ----
const showDeleteModal = ref(false)
const deleteTarget = ref<any>(null)
const deleting = ref(false)

// ---- 类型选项 ----
const typeOptions = [
  { label: '实物', value: 'physical' },
  { label: '虚拟', value: 'virtual' },
]

// ---- 积分类型选项 ----
const pointTypeOptions = [
  { label: '活动积分', value: 'activity' },
  { label: '捐助积分', value: 'donation' },
]

// ---- 允许使用的积分类型选项 ----
const allowedPointTypeOptions = [
  { label: '活动积分', value: 'activity' },
  { label: '捐助积分', value: 'donation' },
  { label: '两者均可', value: 'both' },
]

// ---- 辅助函数 ----
const typeLabel = (type: string) => typeOptions.find(t => t.value === type)?.label || type
const typeColor = (type: string) => (type === 'physical' ? 'blue' : 'purple')

const allowedPointTypesLabel = (types: string[]) => {
  if (!types || types.length === 0) return '-'
  if (types.includes('activity') && types.includes('donation')) return '两者均可'
  if (types.includes('activity')) return '活动积分'
  if (types.includes('donation')) return '捐助积分'
  return '-'
}

const stockDisplay = (product: any) => {
  if (!product.stock || product.stock === -1) return '不限'
  const remaining = product.stockRemaining ?? product.stock
  return `${remaining} / ${product.stock}`
}

// ---- 加载商品列表 ----
async function loadProducts() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (keyword.value) query.keyword = keyword.value
    if (typeFilter.value) query.type = typeFilter.value

    const res = await $fetch<any>('/api/mall/products', { params: query })
    if (res.code === 0) {
      products.value = res.data.list
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
  loadProducts()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadProducts()
}

// ---- 重置表单 ----
function resetForm() {
  formData.value = {
    name: '',
    description: '',
    coverImage: '',
    images: [''],
    type: 'physical',
    activityPointsPrice: 0,
    donationPointsPrice: 0,
    allowedPointTypes: ['activity', 'donation'],
    stock: -1,
    isRecommended: false,
    sortWeight: 0,
  }
}

// ---- 打开创建弹窗 ----
function openCreateModal() {
  isEditing.value = false
  resetForm()
  showFormModal.value = true
}

// ---- 打开编辑弹窗 ----
function openEditModal(product: any) {
  isEditing.value = true
  formData.value = {
    name: product.name || '',
    description: product.description || '',
    coverImage: product.coverImage || '',
    images: product.images && product.images.length > 0 ? [...product.images] : [''],
    type: product.type || 'physical',
    activityPointsPrice: product.activityPointsPrice ?? 0,
    donationPointsPrice: product.donationPointsPrice ?? 0,
    allowedPointTypes: product.allowedPointTypes || ['activity', 'donation'],
    stock: product.stock ?? -1,
    isRecommended: product.isRecommended ?? false,
    sortWeight: product.sortWeight ?? 0,
  }
  showFormModal.value = true
}

// ---- 添加图片URL ----
function addImageUrl() {
  formData.value.images.push('')
}

// ---- 删除图片URL ----
function removeImageUrl(index: number) {
  if (formData.value.images.length <= 1) return
  formData.value.images.splice(index, 1)
}

// ---- 积分类型多选切换 ----
function togglePointType(type: string) {
  const idx = formData.value.allowedPointTypes.indexOf(type)
  if (idx >= 0) {
    formData.value.allowedPointTypes.splice(idx, 1)
  } else {
    formData.value.allowedPointTypes.push(type)
  }
}

// ---- 提交表单 ----
async function submitForm() {
  if (!formData.value.name.trim()) {
    toast.add({ title: '请输入商品名称', color: 'orange' })
    return
  }

  submitting.value = true
  try {
    const body: Record<string, any> = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      coverImage: formData.value.coverImage.trim(),
      images: formData.value.images.filter((img: string) => img.trim()),
      type: formData.value.type,
      activityPointsPrice: Number(formData.value.activityPointsPrice) || 0,
      donationPointsPrice: Number(formData.value.donationPointsPrice) || 0,
      allowedPointTypes: formData.value.allowedPointTypes,
      stock: Number(formData.value.stock),
      isRecommended: formData.value.isRecommended,
      sortWeight: Number(formData.value.sortWeight) || 0,
    }

    let res: any
    if (isEditing.value) {
      res = await $fetch<any>(`/api/mall/products/${deleteTarget.value?.id}`, {
        method: 'PATCH',
        body,
      })
    } else {
      res = await $fetch<any>('/api/mall/products', {
        method: 'POST',
        body,
      })
    }

    if (res.code === 0) {
      toast.add({ title: isEditing.value ? '编辑成功' : '创建成功', color: 'green' })
      showFormModal.value = false
      loadProducts()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    submitting.value = false
  }
}

// ---- 打开删除确认弹窗 ----
function openDeleteModal(product: any) {
  deleteTarget.value = product
  showDeleteModal.value = true
}

// ---- 确认删除（下架） ----
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await $fetch<any>(`/api/mall/products/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    if (res.code === 0) {
      toast.add({ title: '已下架', color: 'green' })
      showDeleteModal.value = false
      deleteTarget.value = null
      loadProducts()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ---- 切换推荐状态 ----
async function toggleRecommended(product: any) {
  try {
    const res = await $fetch<any>(`/api/mall/products/${product.id}`, {
      method: 'PATCH',
      body: { isRecommended: !product.isRecommended },
    })
    if (res.code === 0) {
      toast.add({ title: product.isRecommended ? '已取消推荐' : '已设为推荐', color: 'green' })
      loadProducts()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'coverImage', id: 'coverImage', label: '封面', class: 'w-[80px]' },
  { key: 'name', id: 'name', label: '商品名称' },
  { key: 'type', id: 'type', label: '类型', class: 'w-[100px]' },
  { key: 'activityPointsPrice', id: 'activityPointsPrice', label: '活动积分', class: 'w-[100px]' },
  { key: 'donationPointsPrice', id: 'donationPointsPrice', label: '捐助积分', class: 'w-[100px]' },
  { key: 'stock', id: 'stock', label: '库存', class: 'w-[120px]' },
  { key: 'isRecommended', id: 'isRecommended', label: '推荐', class: 'w-[100px]' },
  { key: 'status', id: 'status', label: '状态', class: 'w-[90px]' },
  { key: 'sortWeight', id: 'sortWeight', label: '排序', class: 'w-[80px]' },
  { key: 'actions', id: 'actions', label: '操作', class: 'w-[160px]' },
]

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">商品管理</h1>
      <p class="mt-1 text-sm text-gray-500">管理积分商城中的所有商品</p>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <UButton color="primary" icon="i-heroicons-plus" @click="openCreateModal">
          添加商品
        </UButton>
        <UInput
          v-model="keyword"
          placeholder="搜索商品名称"
          icon="i-heroicons-magnifying-glass"
          class="w-[240px]"
          @keyup.enter="handleSearch"
        />
        <USelect
          v-model="typeFilter"
          :options="typeOptions"
          placeholder="类型筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <UButton variant="outline" @click="keyword = ''; typeFilter = null; handleSearch()">
          重置
        </UButton>
      </div>
    </UCard>

    <!-- 商品列表表格 -->
    <UCard>
      <UTable
        :rows="products"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-gift', label: '暂无商品数据' }"
      >
        <!-- 封面图 -->
        <template #coverImage-data="{ row }">
          <UAvatar
            :src="row.coverImage"
            :alt="row.name"
            size="md"
            img-class="object-cover rounded"
          />
        </template>

        <!-- 商品名称 -->
        <template #name-data="{ row }">
          <span class="text-sm font-medium text-gray-900">{{ row.name }}</span>
        </template>

        <!-- 类型 -->
        <template #type-data="{ row }">
          <UBadge :color="typeColor(row.type)" variant="subtle" size="sm">
            {{ typeLabel(row.type) }}
          </UBadge>
        </template>

        <!-- 活动积分价格 -->
        <template #activityPointsPrice-data="{ row }">
          <span class="text-sm font-medium text-primary">{{ row.activityPointsPrice ?? 0 }}</span>
        </template>

        <!-- 捐助积分价格 -->
        <template #donationPointsPrice-data="{ row }">
          <span class="text-sm font-medium text-orange-500">{{ row.donationPointsPrice ?? 0 }}</span>
        </template>

        <!-- 库存 -->
        <template #stock-data="{ row }">
          <span class="text-sm">{{ stockDisplay(row) }}</span>
        </template>

        <!-- 推荐状态 -->
        <template #isRecommended-data="{ row }">
          <div class="flex items-center gap-2">
            <UBadge v-if="row.isRecommended" color="yellow" variant="subtle" size="sm">推荐</UBadge>
            <USwitch
              :model-value="row.isRecommended"
              @update:model-value="toggleRecommended(row)"
            />
          </div>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="row.status === 'active' ? 'green' : 'gray'" variant="subtle">
            {{ row.status === 'active' ? '上架' : '下架' }}
          </UBadge>
        </template>

        <!-- 排序权重 -->
        <template #sortWeight-data="{ row }">
          <span class="text-sm text-gray-500">{{ row.sortWeight ?? 0 }}</span>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" @click="openEditModal(row)">
              编辑
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="red"
              @click="openDeleteModal(row)"
            >
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

    <!-- 创建/编辑商品弹窗 -->
    <UModal v-model:open="showFormModal" :title="isEditing ? '编辑商品' : '添加商品'">
      <div class="space-y-4 p-4">
        <!-- 商品名称 -->
        <UInput
          v-model="formData.name"
          label="商品名称"
          placeholder="请输入商品名称"
          required
        />

        <!-- 商品描述 -->
        <UTextarea
          v-model="formData.description"
          label="商品描述"
          placeholder="请输入商品描述"
          :rows="3"
        />

        <!-- 封面图URL -->
        <UInput
          v-model="formData.coverImage"
          label="封面图URL"
          placeholder="请输入封面图URL"
        />

        <!-- 图片URL列表 -->
        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">图片URL列表</label>
            <UButton size="xs" variant="ghost" color="primary" @click="addImageUrl">
              添加图片
            </UButton>
          </div>
          <div class="space-y-2">
            <div v-for="(img, idx) in formData.images" :key="idx" class="flex items-center gap-2">
              <UInput
                v-model="formData.images[idx]"
                :placeholder="`图片URL ${idx + 1}`"
                class="flex-1"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="red"
                :disabled="formData.images.length <= 1"
                @click="removeImageUrl(idx)"
              >
                删除
              </UButton>
            </div>
          </div>
        </div>

        <!-- 商品类型 -->
        <USelect
          v-model="formData.type"
          :options="typeOptions"
          label="商品类型"
          placeholder="选择商品类型"
        />

        <!-- 活动积分价格 -->
        <UInput
          v-model.number="formData.activityPointsPrice"
          label="活动积分价格"
          placeholder="0"
          type="number"
          :min="0"
        />

        <!-- 捐助积分价格 -->
        <UInput
          v-model.number="formData.donationPointsPrice"
          label="捐助积分价格"
          placeholder="0"
          type="number"
          :min="0"
        />

        <!-- 允许使用的积分类型 -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">允许使用的积分类型</label>
          <div class="flex items-center gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                :checked="formData.allowedPointTypes.includes('activity')"
                class="h-4 w-4 rounded border-gray-300 text-primary"
                @change="togglePointType('activity')"
              />
              <span class="text-sm">活动积分</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                :checked="formData.allowedPointTypes.includes('donation')"
                class="h-4 w-4 rounded border-gray-300 text-primary"
                @change="togglePointType('donation')"
              />
              <span class="text-sm">捐助积分</span>
            </label>
          </div>
        </div>

        <!-- 库存数量 -->
        <UInput
          v-model.number="formData.stock"
          label="库存数量（-1 表示不限）"
          placeholder="-1"
          type="number"
        />

        <!-- 是否推荐 -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">是否推荐</label>
          <USwitch v-model="formData.isRecommended" />
        </div>

        <!-- 排序权重 -->
        <UInput
          v-model.number="formData.sortWeight"
          label="排序权重（越大越靠前）"
          placeholder="0"
          type="number"
        />

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="outline" @click="showFormModal = false">取消</UButton>
          <UButton color="primary" :loading="submitting" @click="submitForm">
            {{ isEditing ? '保存修改' : '创建商品' }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- 删除确认弹窗 -->
    <UModal v-model:open="showDeleteModal" title="确认删除">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-600">
          确定要下架商品 <span class="font-semibold text-gray-900">{{ deleteTarget?.name }}</span> 吗？
        </p>
        <p class="text-xs text-gray-400">下架后用户将无法看到该商品</p>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showDeleteModal = false">取消</UButton>
          <UButton color="red" :loading="deleting" @click="confirmDelete">
            确认下架
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
