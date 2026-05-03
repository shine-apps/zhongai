<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import * as donationApi from '@/services/donation'
import * as uploadApi from '@/services/upload'
import { isEmpty } from '@/utils/validator'

const userStore = useUserStore()

// ==================== 表单数据 ====================
const donationType = ref<string>('money')
const amount = ref<string>('')
const materialDesc = ref<string>('')
const materialValue = ref<string>('')
const evidenceImages = ref<string[]>([])
const fileList = ref<any[]>([])
const evidenceDesc = ref<string>('')
const submitting = ref<boolean>(false)

/** 是否为资金捐款 */
const isMoney = computed(() => donationType.value === 'money')

/** 表单校验 */
function validate(): boolean {
  if (isMoney.value) {
    if (isEmpty(amount.value) || Number(amount.value) <= 0) {
      uni.showToast({ title: '请输入捐款金额', icon: 'none' })
      return false
    }
  } else {
    if (isEmpty(materialDesc.value)) {
      uni.showToast({ title: '请输入物资描述', icon: 'none' })
      return false
    }
    if (isEmpty(materialValue.value) || Number(materialValue.value) <= 0) {
      uni.showToast({ title: '请输入物资估价', icon: 'none' })
      return false
    }
  }
  if (evidenceImages.value.length === 0) {
    uni.showToast({ title: '请上传凭证图片', icon: 'none' })
    return false
  }
  return true
}

/** 图片上传 */
async function handleUpload(event: any) {
  const { file } = event
  try {
    const res = await uploadApi.uploadImage(file.url)
    evidenceImages.value.push(res.url)
  } catch (e: any) {
    uni.showToast({ title: e.message || '图片上传失败', icon: 'none' })
    // 移除失败的文件
    fileList.value = fileList.value.filter((item: any) => item.url !== file.url)
  }
}

/** 图片删除 */
function handleDelete(event: any) {
  const { file } = event
  const index = fileList.value.findIndex((item: any) => item.url === file.url)
  if (index > -1) {
    fileList.value.splice(index, 1)
    evidenceImages.value.splice(index, 1)
  }
}

/** 提交捐助 */
async function handleSubmit() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (!validate()) return

  submitting.value = true
  try {
    const data: Record<string, any> = {
      donationType: donationType.value,
      evidenceImages: evidenceImages.value,
      evidenceDesc: evidenceDesc.value,
    }

    if (isMoney.value) {
      data.amount = Number(amount.value)
    } else {
      data.materialDesc = materialDesc.value
      data.materialValue = Number(materialValue.value)
    }

    await donationApi.submitDonation(data)
    uni.showToast({ title: '提交成功', icon: 'success' })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

/** 捐助类型切换 */
function onTypeChange({ value }: { value: string }) {
  donationType.value = value
}
</script>

<template>
  <view class="donation-submit-page">
    <!-- 捐助类型选择 -->
    <view class="form-section">
      <view class="section-title">捐助类型</view>
      <wd-radio-group v-model="donationType" shape="button" @change="onTypeChange">
        <wd-radio value="money">资金捐款</wd-radio>
        <wd-radio value="goods">物资捐赠</wd-radio>
      </wd-radio-group>
    </view>

    <!-- 资金捐款 -->
    <view v-if="isMoney" class="form-section">
      <view class="section-title">捐款金额</view>
      <wd-input
        v-model="amount"
        type="number"
        placeholder="请输入捐款金额（元）"
        clearable
      >
        <template #prefix>
          <text class="input-prefix">¥</text>
        </template>
      </wd-input>
    </view>

    <!-- 物资捐赠 -->
    <view v-else class="form-section">
      <view class="section-title">物资描述</view>
      <wd-textarea
        v-model="materialDesc"
        placeholder="请描述捐赠物资的名称、数量等信息"
        :maxlength="500"
        show-word-limit
        :rows="3"
      />

      <view class="section-title" style="margin-top: 24rpx;">物资估价</view>
      <wd-input
        v-model="materialValue"
        type="number"
        placeholder="请输入物资估价（元）"
        clearable
      >
        <template #prefix>
          <text class="input-prefix">¥</text>
        </template>
      </wd-input>
    </view>

    <!-- 上传凭证 -->
    <view class="form-section">
      <view class="section-title">上传凭证图片</view>
      <wd-upload
        v-model:file-list="fileList"
        action=""
        :limit="9"
        :max-size="10 * 1024 * 1024"
        accept="image"
        :before-upload="() => false"
        @change="handleUpload"
        @delete="handleDelete"
      >
        <wd-button type="primary" plain size="small" icon="add">添加图片</wd-button>
      </wd-upload>
      <text class="upload-tip">最多上传9张图片，每张不超过10MB</text>
    </view>

    <!-- 凭证说明 -->
    <view class="form-section">
      <view class="section-title">凭证说明</view>
      <wd-textarea
        v-model="evidenceDesc"
        placeholder="请简要说明捐助凭证信息（选填）"
        :maxlength="200"
        show-word-limit
        :rows="3"
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
        提交捐助
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.donation-submit-page {
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

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.input-prefix {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.upload-tip {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
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
