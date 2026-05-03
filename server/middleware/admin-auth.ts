// ============================================================
// 页面路由中间件 — 管理员登录检查
// ============================================================

export default defineNuxtRouteMiddleware((to) => {
  // 仅对 /admin 路由生效
  if (!to.path.startsWith('/admin')) {
    return
  }

  // 检查是否有 token
  if (import.meta.client) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      return navigateTo('/login')
    }
  }
})
