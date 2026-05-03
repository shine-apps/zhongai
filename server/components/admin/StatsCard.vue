<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  icon: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
})
</script>

<template>
  <UCard class="h-full">
    <div class="flex items-center gap-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        :class="{
          'bg-emerald-100 text-emerald-600': props.color === 'emerald',
          'bg-blue-100 text-blue-600': props.color === 'blue',
          'bg-amber-100 text-amber-600': props.color === 'amber',
          'bg-purple-100 text-purple-600': props.color === 'purple',
          'bg-rose-100 text-rose-600': props.color === 'rose',
          'bg-primary-100 text-primary-600': props.color === 'primary',
        }"
      >
        <UIcon :name="props.icon" class="h-6 w-6" />
      </div>
      <div class="min-w-0">
        <p class="text-sm text-gray-500 truncate">
          {{ props.title }}
        </p>
        <p class="mt-1 text-2xl font-bold text-gray-900">
          {{ props.value }}
        </p>
      </div>
    </div>
  </UCard>
</template>
