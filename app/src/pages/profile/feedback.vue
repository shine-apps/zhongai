<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { isEmpty } from '@/utils/validator'

const userStore = useUserStore()

// ==================== 表单数据 ====================
const feedbackType = ref<string>('suggestion')
const content = ref<string>('')
const contact = ref<string>('')
const submitting = ref<boolean>(false)

/** 反馈类型选项 */
const typeOptions = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bug', label: 'Bug反馈' },
  { value: 'other', label: '其他' },
]

/** 表单校验 */
function validate(): boolean {
  if (isEmpty(content.value)) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return false
  }
  if (content.value.length < 10) {
    uni.showToast({ title: '反馈内容至少10个字符', icon: 'none' })
    return false
  }
  return true
}

/** 提交反馈 */
async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    // 暂用 showToast 提示
    await new Promise((resolve) => setTimeout(resolve, 500))
    uni.showToast({ title: '感谢您的反馈', icon: 'success' })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

/** 反馈类型切换 */
function onTypeChange({ value }: { value: string }) {
  feedbackType.value = value
}
</script>

<template>
  <view class="feedback-page">
    <!-- 反馈类型 -->
    <view class="form-section">
      <view class="form-label">反馈类型</view>
      <wd-radio-group v-model="feedbackType" shape="button" @change="onTypeChange">
        <wd-radio
          v-for="item in typeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </wd-radio>
      </wd-radio-group>
    </view>

    <!-- 反馈内容 -->
    <view class="form-section">
      <view class="form-label">反馈内容</view>
      <wd-textarea
        v-model="content"
        placeholder="请详细描述您的反馈内容，以便我们更好地改进"
        :maxlength="1000"
        show-word-limit
        :rows="6"
      />
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <view class="form-label">联系方式（选填）</view>
      <wd-input
        v-model="contact"
        placeholder="手机号或微信号，方便我们与您联系"
        clearable
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-action">
      <wd-button
        type="primary"
        block
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        提交反馈
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.feedback-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.submit-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}
</style>
