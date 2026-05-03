<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const toast = useToast()

// ---- 筛选条件 ----
const keyword = ref('')
const roleFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

// ---- 表格数据 ----
const users = ref<any[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 用户详情弹窗 ----
const showDetailModal = ref(false)
const selectedUser = ref<any>(null)

// ---- 角色设置弹窗 ----
const showRoleModal = ref(false)
const roleTargetUser = ref<any>(null)
const newRole = ref('')

// ---- 角色选项 ----
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '领队', value: 'leader' },
  { label: '志愿者', value: 'volunteer' },
  { label: '成员', value: 'member' },
]

// ---- 状态选项 ----
const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '未激活', value: 'inactive' },
  { label: '已冻结', value: 'banned' },
]

// ---- 角色颜色映射 ----
const roleColor = (role: string) => {
  const map: Record<string, string> = {
    admin: 'red',
    leader: 'blue',
    volunteer: 'green',
    member: 'gray',
  }
  return map[role] || 'gray'
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: '管理员',
    leader: '领队',
    volunteer: '志愿者',
    member: '成员',
  }
  return map[role] || role
}

// ---- 状态颜色映射 ----
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    active: 'green',
    inactive: 'yellow',
    banned: 'red',
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '正常',
    inactive: '未激活',
    banned: '已冻结',
  }
  return map[status] || status
}

// ---- 加载用户列表 ----
async function loadUsers() {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (keyword.value) query.keyword = keyword.value
    if (roleFilter.value) query.role = roleFilter.value
    if (statusFilter.value) query.status = statusFilter.value

    const res = await $fetch<any>('/api/users', { params: query })
    if (res.code === 0) {
      users.value = res.data.list
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
  loadUsers()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  pagination.value.page = page
  loadUsers()
}

// ---- 查看用户详情 ----
function viewDetail(user: any) {
  selectedUser.value = user
  showDetailModal.value = true
}

// ---- 冻结/解冻用户 ----
async function toggleUserStatus(user: any) {
  const newStatus = user.status === 'banned' ? 'active' : 'banned'
  const action = newStatus === 'banned' ? '冻结' : '解冻'
  try {
    const res = await $fetch<any>(`/api/users/${user.id}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    if (res.code === 0) {
      toast.add({ title: `${action}成功`, color: 'green' })
      loadUsers()
    } else {
      toast.add({ title: res.message || `${action}失败`, color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 打开角色设置弹窗 ----
function openRoleModal(user: any) {
  roleTargetUser.value = user
  newRole.value = user.role
  showRoleModal.value = true
}

// ---- 确认设置角色 ----
async function confirmSetRole() {
  if (!roleTargetUser.value || !newRole.value) return
  try {
    const res = await $fetch<any>(`/api/users/${roleTargetUser.value.id}/role`, {
      method: 'PATCH',
      body: { role: newRole.value },
    })
    if (res.code === 0) {
      toast.add({ title: '角色设置成功', color: 'green' })
      showRoleModal.value = false
      loadUsers()
    } else {
      toast.add({ title: res.message || '设置失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 表格列定义 ----
const columns = [
  {
    key: 'nickname',
    id: 'nickname',
    label: '用户',
    class: 'w-[200px]',
  },
  {
    key: 'memberNo',
    id: 'memberNo',
    label: '会员编号',
    class: 'w-[120px]',
  },
  {
    key: 'phone',
    id: 'phone',
    label: '手机号',
    class: 'w-[140px]',
  },
  {
    key: 'role',
    id: 'role',
    label: '角色',
    class: 'w-[100px]',
  },
  {
    key: 'status',
    id: 'status',
    label: '状态',
    class: 'w-[100px]',
  },
  {
    key: 'realNameVerified',
    id: 'realNameVerified',
    label: '实名认证',
    class: 'w-[100px]',
  },
  {
    key: 'actions',
    id: 'actions',
    label: '操作',
    class: 'w-[220px]',
  },
]

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
      <p class="mt-1 text-sm text-gray-500">管理平台所有注册用户</p>
    </div>

    <!-- 筛选栏 -->
    <UCard>
      <div class="flex flex-wrap items-center gap-4">
        <UInput
          v-model="keyword"
          placeholder="搜索昵称 / 手机号 / 会员编号"
          icon="i-heroicons-magnifying-glass"
          class="w-[280px]"
          @keyup.enter="handleSearch"
        />
        <USelect
          v-model="roleFilter"
          :options="roleOptions"
          placeholder="角色筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          class="w-[150px]"
          @update:model-value="handleSearch"
        />
        <UButton color="primary" @click="handleSearch">搜索</UButton>
        <UButton variant="outline" @click="keyword = ''; roleFilter = null; statusFilter = null; handleSearch()">重置</UButton>
      </div>
    </UCard>

    <!-- 用户列表表格 -->
    <UCard>
      <UTable
        :rows="users"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-users', label: '暂无用户数据' }"
      >
        <!-- 用户头像+昵称 -->
        <template #nickname-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :src="row.avatarUrl" :alt="row.nickname" size="sm" />
            <div>
              <div class="font-medium text-gray-900">{{ row.nickname || '未设置昵称' }}</div>
              <div class="text-xs text-gray-500">ID: {{ row.id?.slice(0, 8) }}</div>
            </div>
          </div>
        </template>

        <!-- 会员编号 -->
        <template #memberNo-data="{ row }">
          <span class="text-sm">{{ row.memberNo || '-' }}</span>
        </template>

        <!-- 手机号 -->
        <template #phone-data="{ row }">
          <span class="text-sm">{{ row.phone || '-' }}</span>
        </template>

        <!-- 角色 -->
        <template #role-data="{ row }">
          <UBadge :color="roleColor(row.role)" variant="subtle">
            {{ roleLabel(row.role) }}
          </UBadge>
        </template>

        <!-- 状态 -->
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
        </template>

        <!-- 实名认证 -->
        <template #realNameVerified-data="{ row }">
          <UBadge :color="row.realNameVerified ? 'green' : 'gray'" variant="subtle">
            {{ row.realNameVerified ? '已认证' : '未认证' }}
          </UBadge>
        </template>

        <!-- 操作列 -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" variant="ghost" color="primary" @click="viewDetail(row)">
              详情
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              :color="row.status === 'banned' ? 'green' : 'orange'"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'banned' ? '解冻' : '冻结' }}
            </UButton>
            <UButton size="xs" variant="ghost" color="blue" @click="openRoleModal(row)">
              角色
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

    <!-- 用户详情弹窗 -->
    <UModal v-model:open="showDetailModal" title="用户详情">
      <div v-if="selectedUser" class="space-y-4 p-4">
        <div class="flex items-center gap-4">
          <UAvatar :src="selectedUser.avatarUrl" :alt="selectedUser.nickname" size="lg" />
          <div>
            <h3 class="text-lg font-semibold">{{ selectedUser.nickname || '未设置昵称' }}</h3>
            <p class="text-sm text-gray-500">{{ selectedUser.memberNo || '无会员编号' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">用户 ID：</span>
            <span>{{ selectedUser.id }}</span>
          </div>
          <div>
            <span class="text-gray-500">手机号：</span>
            <span>{{ selectedUser.phone || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">角色：</span>
            <UBadge :color="roleColor(selectedUser.role)" variant="subtle" class="ml-1">
              {{ roleLabel(selectedUser.role) }}
            </UBadge>
          </div>
          <div>
            <span class="text-gray-500">状态：</span>
            <UBadge :color="statusColor(selectedUser.status)" variant="subtle" class="ml-1">
              {{ statusLabel(selectedUser.status) }}
            </UBadge>
          </div>
          <div>
            <span class="text-gray-500">真实姓名：</span>
            <span>{{ selectedUser.realName || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">实名认证：</span>
            <UBadge :color="selectedUser.realNameVerified ? 'green' : 'gray'" variant="subtle" class="ml-1">
              {{ selectedUser.realNameVerified ? '已认证' : '未认证' }}
            </UBadge>
          </div>
          <div>
            <span class="text-gray-500">荣誉等级：</span>
            <span>{{ selectedUser.honorLevel ?? 0 }}</span>
          </div>
          <div>
            <span class="text-gray-500">注册时间：</span>
            <span>{{ formatDate(selectedUser.createdAt) }}</span>
          </div>
        </div>
      </div>
    </UModal>

    <!-- 角色设置弹窗 -->
    <UModal v-model:open="showRoleModal" title="设置用户角色">
      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-600">
          为用户 <span class="font-semibold">{{ roleTargetUser?.nickname }}</span> 设置角色：
        </p>
        <USelect
          v-model="newRole"
          :options="roleOptions"
          placeholder="选择角色"
        />
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="showRoleModal = false">取消</UButton>
          <UButton color="primary" @click="confirmSetRole">确认</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
