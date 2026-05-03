<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { login } = useAuth()
const toast = useToast()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!form.username.trim()) {
    toast.add({
      title: '请输入用户名',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
    return
  }

  if (!form.password.trim()) {
    toast.add({
      title: '请输入密码',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
    return
  }

  loading.value = true
  try {
    await login(form.username, form.password)
    toast.add({
      title: '登录成功',
      description: '欢迎回来！',
      color: 'success',
      icon: 'i-heroicons-check-circle',
    })
    router.push('/admin')
  }
  catch (err: any) {
    toast.add({
      title: '登录失败',
      description: err.message || '用户名或密码错误',
      color: 'error',
      icon: 'i-heroicons-x-circle',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <UCard class="w-full max-w-sm">
        <!-- 标题 -->
        <div class="mb-6 text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
            <UIcon name="i-heroicons-heart" class="h-8 w-8 text-emerald-600" />
          </div>
          <h1 class="text-xl font-bold text-gray-900">
            众爱联盟管理后台
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            请输入管理员账号登录
          </p>
        </div>

        <!-- 登录表单 -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField label="用户名" required>
            <UInput
              v-model="form.username"
              placeholder="请输入用户名"
              icon="i-heroicons-user"
              class="w-full"
              autocomplete="username"
            />
          </UFormField>

          <UFormField label="密码" required>
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              icon="i-heroicons-lock-closed"
              class="w-full"
              autocomplete="current-password"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            block
            :loading="loading"
          >
            登录
          </UButton>
        </form>
      </UCard>
    </div>

    <UToaster />
  </UApp>
</template>
