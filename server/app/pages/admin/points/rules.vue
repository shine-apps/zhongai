<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 规则列表 ----
const rules = ref<any[]>([])
const loading = ref(false)

// ---- 创建/编辑弹窗 ----
const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref({
  ruleType: '',
  pointType: 'activity',
  pointsPerUnit: 1,
  unitDesc: '',
  minAmount: 0,
  isActive: true,
})

// ---- 规则类型选项 ----
const ruleTypeOptions = [
  { label: '活动签到', value: 'activity_checkin' },
  { label: '活动组织', value: 'activity_organize' },
  { label: '捐助', value: 'donation' },
  { label: '任务完成', value: 'task_complete' },
  { label: '每日签到', value: 'daily_signin' },
  { label: '其他', value: 'other' },
]

// ---- 积分类型选项 ----
const pointTypeOptions = [
  { label: '活动积分', value: 'activity' },
  { label: '捐助积分', value: 'donation' },
  { label: '签到积分', value: 'checkin' },
  { label: '任务积分', value: 'task' },
  { label: '奖励积分', value: 'bonus' },
  { label: '扣减积分', value: 'deduction' },
]

// ---- 标签映射 ----
const ruleTypeLabel = (type: string) => ruleTypeOptions.find(r => r.value === type)?.label || type
const pointTypeLabel = (type: string) => pointTypeOptions.find(p => p.value === type)?.label || type

// ---- 加载规则列表 ----
async function loadRules() {
  loading.value = true
  try {
    const res = await $fetch<any>('/api/points/rules')
    if (res.code === 0) {
      rules.value = res.data || []
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
  formData.value = {
    ruleType: '',
    pointType: 'activity',
    pointsPerUnit: 1,
    unitDesc: '',
    minAmount: 0,
    isActive: true,
  }
  showFormModal.value = true
}

// ---- 打开编辑弹窗 ----
function openEditModal(rule: any) {
  isEditing.value = true
  editingId.value = rule.id
  formData.value = {
    ruleType: rule.ruleType,
    pointType: rule.pointType,
    pointsPerUnit: rule.pointsPerUnit,
    unitDesc: rule.unitDesc || '',
    minAmount: Number(rule.minAmount) || 0,
    isActive: rule.isActive,
  }
  showFormModal.value = true
}

// ---- 提交表单 ----
async function submitForm() {
  if (!formData.value.ruleType) {
    toast.add({ title: '请选择规则类型', color: 'orange' })
    return
  }
  try {
    let res: any
    if (isEditing.value && editingId.value) {
      res = await $fetch<any>(`/api/points/rules/${editingId.value}`, {
        method: 'PATCH',
        body: formData.value,
      })
    } else {
      res = await $fetch<any>('/api/points/rules', {
        method: 'POST',
        body: formData.value,
      })
    }
    if (res.code === 0) {
      toast.add({ title: isEditing.value ? '编辑成功' : '创建成功', color: 'green' })
      showFormModal.value = false
      loadRules()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 切换启用状态 ----
async function toggleActive(rule: any) {
  try {
    const res = await $fetch<any>(`/api/points/rules/${rule.id}`, {
      method: 'PATCH',
      body: { isActive: !rule.isActive },
    })
    if (res.code === 0) {
      toast.add({
        title: rule.isActive ? '已禁用' : '已启用',
        color: 'green',
      })
      loadRules()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">积分规则配置</h1>
        <p class="mt-1 text-sm text-gray-500">管理积分获取与扣减规则</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openCreateModal">
        创建规则
      </UButton>
    </div>

    <!-- 规则列表 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-gray-400" />
    </div>

    <div v-else-if="rules.length === 0" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
      <UIcon name="i-heroicons-cog-6-tooth" class="mb-3 h-12 w-12 text-gray-300" />
      <p class="text-gray-400">暂无积分规则</p>
      <UButton class="mt-4" variant="outline" @click="openCreateModal">创建第一条规则</UButton>
    </div>

    <div v-else class="space-y-4">
      <UCard
        v-for="rule in rules"
        :key="rule.id"
        class="transition-shadow hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <div class="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
            <!-- 规则类型 -->
            <div>
              <div class="text-xs text-gray-400">规则类型</div>
              <div class="text-sm font-semibold text-gray-900">{{ ruleTypeLabel(rule.ruleType) }}</div>
            </div>

            <!-- 积分类型 -->
            <div>
              <div class="text-xs text-gray-400">积分类型</div>
              <UBadge variant="subtle" color="primary" size="sm">{{ pointTypeLabel(rule.pointType) }}</UBadge>
            </div>

            <!-- 每单位积分数 -->
            <div>
              <div class="text-xs text-gray-400">每单位积分</div>
              <div class="text-sm font-medium text-primary">+{{ rule.pointsPerUnit }}</div>
            </div>

            <!-- 单位描述 -->
            <div>
              <div class="text-xs text-gray-400">单位描述</div>
              <div class="text-sm text-gray-600">{{ rule.unitDesc || '-' }}</div>
            </div>

            <!-- 最低金额 -->
            <div>
              <div class="text-xs text-gray-400">最低金额</div>
              <div class="text-sm text-gray-600">¥{{ Number(rule.minAmount).toFixed(2) }}</div>
            </div>

            <!-- 启用状态 -->
            <div>
              <div class="text-xs text-gray-400">状态</div>
              <USwitch
                :model-value="rule.isActive"
                @update:model-value="toggleActive(rule)"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-2 ml-4">
            <UButton size="xs" variant="ghost" color="primary" @click="openEditModal(rule)">
              编辑
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              :color="rule.isActive ? 'orange' : 'green'"
              @click="toggleActive(rule)"
            >
              {{ rule.isActive ? '禁用' : '启用' }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 创建/编辑规则弹窗 -->
    <UModal v-model:open="showFormModal" :title="isEditing ? '编辑规则' : '创建规则'">
      <div class="space-y-4 p-4">
        <USelect
          v-model="formData.ruleType"
          :items="ruleTypeOptions"
          label="规则类型"
          placeholder="请选择规则类型"
        />
        <USelect
          v-model="formData.pointType"
          :items="pointTypeOptions"
          label="积分类型"
          placeholder="请选择积分类型"
        />
        <UInput
          v-model.number="formData.pointsPerUnit"
          label="每单位积分数"
          type="number"
          placeholder="请输入每单位积分数"
        />
        <UInput
          v-model="formData.unitDesc"
          label="单位描述"
          placeholder="例如：每次签到、每100元"
        />
        <UInput
          v-model.number="formData.minAmount"
          label="最低金额（元）"
          type="number"
          placeholder="0 表示无最低金额限制"
        />
        <div class="flex items-center gap-2">
          <USwitch v-model="formData.isActive" />
          <span class="text-sm text-gray-600">启用此规则</span>
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
