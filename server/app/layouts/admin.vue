<script setup lang="ts">
const route = useRoute()
const { adminUser, logout } = useAuth()
const toast = useToast()

/** 侧边栏导航菜单项 */
const menuItems = [
  {
    label: '仪表盘',
    icon: 'i-heroicons-home',
    to: '/admin',
  },
  {
    label: '用户管理',
    icon: 'i-heroicons-users',
    to: '/admin/users',
  },
  {
    label: '活动管理',
    icon: 'i-heroicons-calendar',
    to: '/admin/activities',
  },
  {
    label: '捐助审核',
    icon: 'i-heroicons-heart',
    to: '/admin/donations',
  },
  {
    label: '积分规则',
    icon: 'i-heroicons-star',
    to: '/admin/points/rules',
  },
  {
    label: '积分流水',
    icon: 'i-heroicons-clock',
    to: '/admin/points/transactions',
  },
  {
    label: '爱心集市',
    icon: 'i-heroicons-shopping-bag',
    to: '/admin/market',
  },
  {
    label: '积分商城',
    icon: 'i-heroicons-gift',
    to: '/admin/mall/products',
  },
  {
    label: '订单管理',
    icon: 'i-heroicons-shopping-cart',
    to: '/admin/mall/orders',
  },
  {
    label: '轮播图管理',
    icon: 'i-heroicons-photo',
    to: '/admin/banners',
  },
  {
    label: '数据统计',
    icon: 'i-heroicons-chart-bar',
    to: '/admin/stats',
  },
]

/** 退出登录 */
function handleLogout() {
  logout()
  toast.add({
    title: '已退出登录',
    description: '您已成功退出管理后台',
    color: 'neutral',
    icon: 'i-heroicons-arrow-right-on-rectangle',
  })
}

/** 面包屑导航 */
const breadcrumbs = computed(() => {
  const matched = route.matched
  const crumbs: { label: string; to?: string }[] = [
    { label: '首页', to: '/admin' },
  ]

  for (const record of matched) {
    if (record.meta?.title && record.path !== '/admin') {
      crumbs.push({
        label: record.meta.title as string,
        to: record.path,
      })
    }
  }

  return crumbs
})
</script>

<template>
  <UApp>
    <div class="flex h-screen bg-gray-50">
      <!-- 左侧固定侧边栏 -->
      <aside class="w-60 shrink-0 border-r border-gray-200 bg-white">
        <!-- Logo 区域 -->
        <div class="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
          <UIcon name="i-heroicons-heart" class="h-7 w-7 text-emerald-600" />
          <span class="text-lg font-bold text-gray-900">众爱联盟</span>
        </div>

        <!-- 导航菜单 -->
        <nav class="p-3">
          <UNavigationMenu
            :items="menuItems"
            orientation="vertical"
            class="w-full"
          />
        </nav>
      </aside>

      <!-- 右侧主区域 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- 顶部 Header -->
        <header class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <!-- 左侧：面包屑 -->
          <div class="flex items-center gap-2">
            <UBreadcrumb :items="breadcrumbs" />
          </div>

          <!-- 右侧：管理员信息 + 退出 -->
          <div class="flex items-center gap-3">
            <UDropdownMenu
              :items="[
                [
                  {
                    label: '个人设置',
                    icon: 'i-heroicons-cog-6-tooth',
                  },
                ],
                [
                  {
                    label: '退出登录',
                    icon: 'i-heroicons-arrow-right-on-rectangle',
                    onSelect: handleLogout,
                  },
                ],
              ]"
            >
              <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100">
                <UAvatar
                  :src="adminUser?.avatarUrl"
                  :alt="adminUser?.nickname || '管理员'"
                  size="sm"
                />
                <span class="text-sm font-medium text-gray-700">
                  {{ adminUser?.nickname || '管理员' }}
                </span>
                <UIcon name="i-heroicons-chevron-down" class="h-4 w-4 text-gray-400" />
              </div>
            </UDropdownMenu>
          </div>
        </header>

        <!-- 主内容区 -->
        <main class="flex-1 overflow-auto p-6">
          <slot />
        </main>

        <!-- 底部 Footer -->
        <footer class="flex shrink-0 items-center border-t border-gray-200 bg-white px-6 py-3">
          <span class="text-xs text-gray-400">
            &copy; {{ new Date().getFullYear() }} 众爱联盟管理后台
          </span>
        </footer>
      </div>
    </div>

    <!-- 全局 Toast 提示 -->
    <UToaster />
  </UApp>
</template>
