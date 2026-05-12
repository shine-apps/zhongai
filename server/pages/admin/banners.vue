<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 表格数据 ----
const banners = ref<any[]>([])
const loading = ref(false)

// ---- 创建/编辑弹窗 ----
const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formSubmitting = ref(false)

const defaultForm = () => ({
  title: '',
  imageUrl: '',
  linkType: 'none',
  linkValue: '',
  sortOrder: 0,
  isActive: true,
  startAt: '',
  endAt: '',
})

const formData = ref(defaultForm())

// ---- 删除确认弹窗 ----
const showDeleteModal = ref(false)
const deleteTarget = ref<any>(null)
const deleting = ref(false)

// ---- 跳转类型选项 ----
const linkTypeOptions = [
  { label: '无跳转', value: 'none' },
  { label: '活动详情', value: 'activity' },
  { label: '外部链接', value: 'url' },
]

// ---- 跳转类型标签/颜色映射 ----
const linkTypeLabel = (type: string) => linkTypeOptions.find(t => t.value === type)?.label || type
const linkTypeColor = (type: string) => {
  const map: Record<string, string> = { none: 'gray', activity: 'blue', url: 'green' }
  return map[type] || 'gray'
}

// ---- 跳转值占位提示 ----
const linkValuePlaceholder = computed(() => {
  const map: Record<string, string> = {
    none: '无跳转，无需填写',
    activity: '请输入活动 ID',
    url: '请输入完整 URL，如 https://example.com',
  }
  return map[formData.value.linkType] || ''
})

// ---- 加载轮播图列表 ----
async function loadBanners() {
  loading.value = true
  try {
    const res = await $fetch<any>('/api/banners')
    if (res.code === 0) {
      banners.value = res.data || []
    } else {
      toast.add({ title: res.message || '加载失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '网络错误', color: 'red' })
  } finally {
    loading.value = false
  }
}

// ---- 打开创建弹窗 ----
function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  showFormModal.value = true
}

// ---- 打开编辑弹窗 ----
function openEditModal(banner: any) {
  isEditing.value = true
  editingId.value = banner.id
  formData.value = {
    title: banner.title,
    imageUrl: banner.imageUrl,
    linkType: banner.linkType || 'none',
    linkValue: banner.linkValue || '',
    sortOrder: banner.sortOrder ?? 0,
    isActive: banner.isActive ?? true,
    startAt: banner.startAt ? banner.startAt.slice(0, 16) : '',
    endAt: banner.endAt ? banner.endAt.slice(0, 16) : '',
  }
  showFormModal.value = true
}

// ---- 提交表单 ----
async function submitForm() {
  if (!formData.value.title) {
    toast.add({ title: '请输入轮播图标题', color: 'orange' })
    return
  }
  if (!formData.value.imageUrl) {
    toast.add({ title: '请输入图片 URL', color: 'orange' })
    return
  }

  formSubmitting.value = true
  try {
    const body: Record<string, any> = { ...formData.value }
    // 转换空字符串为 null
    if (!body.linkValue) body.linkValue = null
    if (!body.startAt) body.startAt = null
    if (!body.endAt) body.endAt = null

    let res: any
    if (isEditing.value && editingId.value) {
      res = await $fetch<any>(`/api/banners/${editingId.value}`, {
        method: 'PATCH',
        body,
      })
    } else {
      res = await $fetch<any>('/api/banners', {
        method: 'POST',
        body,
      })
    }
    if (res.code === 0) {
      toast.add({ title: isEditing.value ? '编辑成功' : '创建成功', color: 'green' })
      showFormModal.value = false
      loadBanners()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    formSubmitting.value = false
  }
}

// ---- 打开删除确认弹窗 ----
function openDeleteModal(banner: any) {
  deleteTarget.value = banner
  showDeleteModal.value = true
}

// ---- 确认删除 ----
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await $fetch<any>(`/api/banners/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    if (res.code === 0) {
      toast.add({ title: '删除成功', color: 'green' })
      showDeleteModal.value = false
      loadBanners()
    } else {
      toast.add({ title: res.message || '删除失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ---- 切换启用状态 ----
async function toggleActive(banner: any) {
  try {
    const res = await $fetch<any>(`/api/banners/${banner.id}`, {
      method: 'PATCH',
      body: { isActive: !banner.isActive },
    })
    if (res.code === 0) {
      toast.add({ title: banner.isActive ? '已禁用' : '已启用', color: 'green' })
      loadBanners()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  { key: 'imageUrl', label: '缩略图', class: 'w-[100px]' },
  { key: 'title', label: '标题' },
  { key: 'linkType', label: '跳转类型', class: 'w-[100px]' },
  { key: 'linkValue', label: '跳转值', class: 'w-[180px]' },
  { key: 'sortOrder', label: '排序', class: 'w-[80px]' },
  { key: 'isActive', label: '状态', class: 'w-[100px]' },
  { key: 'validity', label: '有效期', class: 'w-[200px]' },
  { key: 'actions', label: '操作', class: 'w-[140px]' },
]

onMounted(() => {
  loadBanners()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">轮播图管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理首页轮播图展示内容</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openCreateModal">
        添加轮播图
      </UButton>
    </div>

    <!-- 轮播图列表表格 -->
    <UCard>
      <UTable
        :rows="banners"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-photo', label: '暂无轮播图数据' }"
      >
        <!-- 缩略图 -->
        <template #imageUrl-data="{ row }">
          <UAvatar
            :src="row.imageUrl"
            :alt="row.title"
            size="lg"
            img-class="object-cover rounded"
          />
        </template>

        <!-- 标题 -->
        <template #title-data="{ row }">
          <span class="text-sm font-medium text-gray-900">{{ row.title }}</span>
        </template>

        <!-- 跳转类型 -->
        <template #linkType-data="{ row }">
          <UBadge :color="linkTypeColor(row.linkType)" variant="subtle" size="sm">
            {{ linkTypeLabel(row.linkType) }}
          </UBadge>
        </template>

        <!-- 跳转值 -->
        <template #linkValue-data="{ row }">
          <span class="text-xs text-gray-500 truncate block max-w-[160px]">
            {{ row.linkValue || '-' }}
          </span>
        </template>

        <!-- 排序 -->
        <template #sortOrder-data="{ row }">
          <span class="text-sm">{{ row.sortOrder ?? 0 }}</span>
        </template>

        <!-- 状态 -->
        <template #isActive-data="{ row }">
          <USwitch
            :model-value="row.isActive"
            @update:model-value="toggleActive(row)"
          />
        </template>

        <!-- 有效期 -->
        <template #validity-data="{ row }">
          <div v-if="row.startAt || row.endAt" class="text-xs text-gray-500">
            <div>{{ row.startAt ? formatDate(row.startAt) : '不限' }}</div>
            <div class="text-gray-400">~ {{ row.endAt ? formatDate(row.endAt) : '不限' }}</div>
          </div>
          <span v-else class="text-xs text-gray-400">永久</span>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" @click="openEditModal(row)">
              编辑
            </UButton>
            <UButton size="xs" variant="ghost" color="red" @click="openDeleteModal(row)">
              删除
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- 创建/编辑轮播图弹窗 -->
    <UModal v-model:open="showFormModal" :title="isEditing ? '编辑轮播图' : '添加轮播图'">
      <div class="space-y-4 p-4">
        <UInput v-model="formData.title" label="标题" placeholder="请输入轮播图标题" />
        <UInput v-model="formData.imageUrl" label="图片 URL" placeholder="请输入图片地址" />
        <USelect v-model="formData.linkType" :items="linkTypeOptions" label="跳转类型" />
        <UInput
          v-model="formData.linkValue"
          :placeholder="linkValuePlaceholder"
          :disabled="formData.linkType === 'none'"
          label="跳转值"
        />
        <UInput v-model.number="formData.sortOrder" label="排序权重" type="number" placeholder="数值越大越靠前" />
        <div class="flex items-center gap-2">
          <USwitch v-model="formData.isActive" />
          <span class="text-sm text-gray-700">启用状态</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UInput v-model="formData.startAt" label="有效期开始时间" type="datetime-local" />
          <UInput v-model="formData.endAt" label="有效期结束时间" type="datetime-local" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="outline" @click="showFormModal = false">取消</UButton>
          <UButton color="primary" :loading="formSubmitting" @click="submitForm">
            {{ isEditing ? '保存' : '创建' }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- 删除确认弹窗 -->
    <UModal v-model:open="showDeleteModal" title="确认删除">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-600">
          确定要删除轮播图「<span class="font-semibold">{{ deleteTarget?.title }}</span>」吗？此操作不可恢复。
        </p>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showDeleteModal = false">取消</UButton>
          <UButton color="red" :loading="deleting" @click="confirmDelete">确认删除</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
