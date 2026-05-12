<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const toast = useToast()

const activityId = computed(() => route.params.id as string)

// ---- 活动详情 ----
const activity = ref<any>(null)
const detailLoading = ref(false)

// ---- 当前 Tab ----
const activeTab = ref<'registrations' | 'checkins' | 'gallery'>('registrations')

// ---- 报名管理 ----
const registrations = ref<any[]>([])
const regLoading = ref(false)
const regPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

// ---- 签到管理 ----
const checkins = ref<any[]>([])
const checkinLoading = ref(false)
const checkinPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
const completing = ref(false)

// ---- 相册 ----
const gallery = ref<any[]>([])
const galleryLoading = ref(false)

// ---- 面包屑 ----
const breadcrumbs = computed(() => [
  { label: '活动管理', to: '/admin/activities' },
  { label: activity.value?.title || '活动详情' },
])

// ---- 状态颜色 ----
const statusColor = (status: string) => {
  const map: Record<string, string> = {
    draft: 'gray', published: 'blue', ongoing: 'green', completed: 'emerald', cancelled: 'red',
  }
  return map[status] || 'gray'
}
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿', published: '已发布', ongoing: '进行中', completed: '已完成', cancelled: '已取消',
  }
  return map[status] || status
}
const regStatusColor = (status: string) => {
  const map: Record<string, string> = { pending: 'yellow', approved: 'green', rejected: 'red', cancelled: 'gray' }
  return map[status] || 'gray'
}
const regStatusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' }
  return map[status] || status
}

// ---- 加载活动详情 ----
async function loadActivity() {
  detailLoading.value = true
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}`)
    if (res.code === 0) {
      activity.value = res.data
    } else {
      toast.add({ title: res.message || '加载失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '网络错误', color: 'red' })
  } finally {
    detailLoading.value = false
  }
}

// ---- 加载报名列表 ----
async function loadRegistrations() {
  regLoading.value = true
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/registrations`, {
      params: { page: regPagination.value.page, pageSize: regPagination.value.pageSize },
    })
    if (res.code === 0) {
      registrations.value = res.data.list
      regPagination.value = res.data.pagination
    }
  } catch (err: any) {
    toast.add({ title: err.message || '加载报名列表失败', color: 'red' })
  } finally {
    regLoading.value = false
  }
}

// ---- 加载签到列表 ----
async function loadCheckins() {
  checkinLoading.value = true
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/checkins`, {
      params: { page: checkinPagination.value.page, pageSize: checkinPagination.value.pageSize },
    })
    if (res.code === 0) {
      checkins.value = res.data.list
      checkinPagination.value = res.data.pagination
    }
  } catch (err: any) {
    toast.add({ title: err.message || '加载签到列表失败', color: 'red' })
  } finally {
    checkinLoading.value = false
  }
}

// ---- 加载相册 ----
async function loadGallery() {
  galleryLoading.value = true
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/gallery`)
    if (res.code === 0) {
      gallery.value = res.data || []
    }
  } catch (err: any) {
    toast.add({ title: err.message || '加载相册失败', color: 'red' })
  } finally {
    galleryLoading.value = false
  }
}

// ---- 审核报名 ----
async function handleRegistration(reg: any, action: 'approved' | 'rejected') {
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/register`, {
      method: 'PATCH',
      body: { userId: reg.userId, status: action },
    })
    if (res.code === 0) {
      toast.add({ title: action === 'approved' ? '已通过' : '已拒绝', color: 'green' })
      loadRegistrations()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 确认签到 ----
async function verifyCheckin(checkin: any) {
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/checkin/verify`, {
      method: 'POST',
      body: { userId: checkin.userId, verified: true },
    })
    if (res.code === 0) {
      toast.add({ title: '签到确认成功', color: 'green' })
      loadCheckins()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- 完成活动并发放积分 ----
async function completeActivity() {
  if (!confirm('确定要完成此活动并发放积分吗？完成后将无法修改。')) return
  completing.value = true
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/complete`, {
      method: 'PATCH',
    })
    if (res.code === 0) {
      toast.add({ title: '活动已完成，积分已发放', color: 'green' })
      loadActivity()
      loadCheckins()
    } else {
      toast.add({ title: res.message || '操作失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  } finally {
    completing.value = false
  }
}

// ---- 删除相册图片 ----
async function deleteGalleryItem(mediaId: string) {
  if (!confirm('确定要删除这张图片吗？')) return
  try {
    const res = await $fetch<any>(`/api/activities/${activityId.value}/gallery/${mediaId}`, {
      method: 'DELETE',
    })
    if (res.code === 0) {
      toast.add({ title: '删除成功', color: 'green' })
      loadGallery()
    } else {
      toast.add({ title: res.message || '删除失败', color: 'red' })
    }
  } catch (err: any) {
    toast.add({ title: err.message || '操作失败', color: 'red' })
  }
}

// ---- Tab 切换时加载数据 ----
watch(activeTab, (tab) => {
  if (tab === 'registrations') loadRegistrations()
  else if (tab === 'checkins') loadCheckins()
  else if (tab === 'gallery') loadGallery()
})

onMounted(() => {
  loadActivity()
  loadRegistrations()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 面包屑导航 -->
    <UBreadcrumb :items="breadcrumbs" />

    <!-- 活动基本信息卡片 -->
    <UCard v-if="activity">
      <div class="flex items-start justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ activity.title }}</h1>
            <UBadge :color="statusColor(activity.status)" variant="subtle">
              {{ statusLabel(activity.status) }}
            </UBadge>
          </div>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 md:grid-cols-4">
            <div>
              <span class="text-gray-400">分类：</span>
              <span>{{ activity.category }}</span>
            </div>
            <div>
              <span class="text-gray-400">时间：</span>
              <span>{{ formatDate(activity.startTime) }} ~ {{ formatDate(activity.endTime) }}</span>
            </div>
            <div>
              <span class="text-gray-400">地点：</span>
              <span>{{ activity.location || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-400">人数：</span>
              <span>{{ activity.currentParticipants ?? 0 }} / {{ activity.maxParticipants || '不限' }}</span>
            </div>
            <div>
              <span class="text-gray-400">积分奖励：</span>
              <span class="font-medium text-primary">+{{ activity.rewardPoints }}</span>
            </div>
            <div>
              <span class="text-gray-400">创建时间：</span>
              <span>{{ formatDate(activity.createdAt) }}</span>
            </div>
          </div>
          <p v-if="activity.description" class="mt-2 text-sm text-gray-500">
            {{ activity.description }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- 加载中 -->
    <div v-else-if="detailLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-gray-400" />
    </div>

    <!-- Tabs 切换 -->
    <div v-if="activity">
      <div class="mb-4 flex gap-1 border-b border-gray-200">
        <button
          v-for="tab in [
            { key: 'registrations', label: '报名管理' },
            { key: 'checkins', label: '签到管理' },
            { key: 'gallery', label: '活动相册' },
          ] as const"
          :key="tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 报名管理 Tab -->
      <UCard v-if="activeTab === 'registrations'">
        <UTable
          :rows="registrations"
          :columns="[
            { key: 'user', label: '用户' },
            { key: 'status', label: '状态', class: 'w-[100px]' },
            { key: 'remark', label: '备注' },
            { key: 'createdAt', label: '报名时间', class: 'w-[160px]' },
            { key: 'actions', label: '操作', class: 'w-[160px]' },
          ]"
          :loading="regLoading"
          :empty-state="{ icon: 'i-heroicons-user-group', label: '暂无报名数据' }"
        >
          <template #user-data="{ row }">
            <div class="flex items-center gap-2">
              <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="sm" />
              <span class="text-sm font-medium">{{ row.user?.nickname || '未知用户' }}</span>
            </div>
          </template>
          <template #status-data="{ row }">
            <UBadge :color="regStatusColor(row.status)" variant="subtle">
              {{ regStatusLabel(row.status) }}
            </UBadge>
          </template>
          <template #createdAt-data="{ row }">
            <span class="text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
          </template>
          <template #actions-data="{ row }">
            <div v-if="row.status === 'pending'" class="flex items-center gap-2">
              <UButton size="xs" variant="ghost" color="green" @click="handleRegistration(row, 'approved')">通过</UButton>
              <UButton size="xs" variant="ghost" color="red" @click="handleRegistration(row, 'rejected')">拒绝</UButton>
            </div>
            <span v-else class="text-xs text-gray-400">已处理</span>
          </template>
        </UTable>

        <div v-if="regPagination.total > 0" class="mt-4 flex justify-end">
          <UPagination
            :model-value="regPagination.page"
            :total="regPagination.total"
            :items-per-page="regPagination.pageSize"
            @update:model-value="(p: number) => { regPagination.page = p; loadRegistrations() }"
          />
        </div>
      </UCard>

      <!-- 签到管理 Tab -->
      <UCard v-if="activeTab === 'checkins'">
        <UTable
          :rows="checkins"
          :columns="[
            { key: 'user', label: '用户' },
            { key: 'checkinType', label: '签到方式', class: 'w-[100px]' },
            { key: 'checkinTime', label: '签到时间', class: 'w-[160px]' },
            { key: 'verified', label: '已确认', class: 'w-[100px]' },
            { key: 'actions', label: '操作', class: 'w-[120px]' },
          ]"
          :loading="checkinLoading"
          :empty-state="{ icon: 'i-heroicons-clipboard-document-check', label: '暂无签到数据' }"
        >
          <template #user-data="{ row }">
            <div class="flex items-center gap-2">
              <UAvatar :src="row.user?.avatarUrl" :alt="row.user?.nickname" size="sm" />
              <span class="text-sm font-medium">{{ row.user?.nickname || '未知用户' }}</span>
            </div>
          </template>
          <template #checkinType-data="{ row }">
            <UBadge variant="subtle" color="blue">
              {{ row.checkinType === 'qrcode' ? '扫码' : row.checkinType === 'location' ? '定位' : '手动' }}
            </UBadge>
          </template>
          <template #checkinTime-data="{ row }">
            <span class="text-xs text-gray-500">{{ formatDate(row.checkinTime) }}</span>
          </template>
          <template #verified-data="{ row }">
            <UBadge :color="row.verified ? 'green' : 'gray'" variant="subtle">
              {{ row.verified ? '已确认' : '待确认' }}
            </UBadge>
          </template>
          <template #actions-data="{ row }">
            <UButton
              v-if="!row.verified"
              size="xs"
              variant="ghost"
              color="green"
              @click="verifyCheckin(row)"
            >
              确认签到
            </UButton>
            <span v-else class="text-xs text-gray-400">已完成</span>
          </template>
        </UTable>

        <div v-if="checkinPagination.total > 0" class="mt-4 flex justify-end">
          <UPagination
            :model-value="checkinPagination.page"
            :total="checkinPagination.total"
            :items-per-page="checkinPagination.pageSize"
            @update:model-value="(p: number) => { checkinPagination.page = p; loadCheckins() }"
          />
        </div>

        <!-- 完成活动按钮 -->
        <div v-if="activity.status === 'ongoing'" class="mt-6 flex justify-end">
          <UButton color="primary" size="lg" :loading="completing" @click="completeActivity">
            完成活动并发放积分
          </UButton>
        </div>
      </UCard>

      <!-- 相册 Tab -->
      <UCard v-if="activeTab === 'gallery'">
        <div v-if="galleryLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <div v-else-if="gallery.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
          <UIcon name="i-heroicons-photo" class="mb-2 h-12 w-12" />
          <p>暂无相册图片</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div
            v-for="item in gallery"
            :key="item.id"
            class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
          >
            <img
              :src="item.thumbnailUrl || item.fileUrl"
              :alt="item.mediaType"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 flex items-end justify-center bg-black/0 transition-colors group-hover:bg-black/40">
              <UButton
                size="xs"
                color="red"
                variant="solid"
                class="mb-2 opacity-0 transition-opacity group-hover:opacity-100"
                @click="deleteGalleryItem(item.id)"
              >
                删除
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
