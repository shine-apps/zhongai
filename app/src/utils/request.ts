import type { ApiResponse } from '@/types/api'

/** 后端 API 基础路径 */
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api'

/** 请求配置扩展 */
interface RequestOptions {
  /** 是否显示 loading，默认 false */
  showLoading?: boolean
  /** loading 提示文字 */
  loadingText?: string
  /** 是否显示错误提示，默认 true */
  showError?: boolean
  /** 自定义 headers */
  header?: Record<string, string>
}

/** uni.request 参数类型 */
interface RequestParams {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

/**
 * 封装 uni.request 为 Promise
 * @param options 请求参数
 * @param requestOptions 额外配置（loading、错误提示等）
 */
export function request<T = any>(
  options: RequestParams,
  requestOptions: RequestOptions = {}
): Promise<T> {
  const { showLoading = false, loadingText = '加载中...', showError = true, header = {} } = requestOptions

  // 获取 token
  const token = uni.getStorageSync('token') || ''

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 附加平台和版本信息
  headers['X-Platform'] = uni.getSystemInfoSync().platform || 'unknown'
  // #ifdef MP-WEIXIN
  const accountInfo = uni.getAccountInfoSync()
  headers['X-Version'] = accountInfo.miniProgram.version || '1.0.0'
  // #endif
  // #ifndef MP-WEIXIN
  headers['X-Version'] = '1.0.0'
  // #endif

  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true })
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      success: (res) => {
        const response = res.data as ApiResponse<T>

        if (response.code === 0) {
          resolve(response.data)
        } else if (response.code === 401) {
          // 未授权，清除 token 并跳转登录页
          uni.removeStorageSync('token')
          uni.removeStorageSync('refreshToken')
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' })
          }, 1500)
          reject(new Error(response.message || '未授权'))
        } else {
          if (showError) {
            uni.showToast({ title: response.message || '请求失败', icon: 'none' })
          }
          reject(new Error(response.message || '请求失败'))
        }
      },
      fail: (err) => {
        if (showError) {
          uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        }
        reject(new Error(err.errMsg || '网络异常'))
      },
      complete: () => {
        if (showLoading) {
          uni.hideLoading()
        }
      },
    })
  })
}

/**
 * GET 请求
 */
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  options?: RequestOptions
): Promise<T> {
  // 将 params 拼接到 url 上
  let queryString = ''
  if (params) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, String(params[key]))
      }
    })
    queryString = searchParams.toString()
    if (queryString) {
      url = url + '?' + queryString
    }
  }
  return request<T>({ url, method: 'GET' }, options)
}

/**
 * POST 请求
 */
export function post<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return request<T>({ url, method: 'POST', data }, options)
}

/**
 * PATCH 请求
 */
export function patch<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return request<T>({ url, method: 'PATCH', data }, options)
}

/**
 * DELETE 请求
 */
export function del<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  return request<T>({ url, method: 'DELETE' }, options)
}

/**
 * 文件上传
 * @param url 上传接口地址
 * @param filePath 本地文件路径
 * @param formData 额外的表单数据
 */
export function upload<T = any>(
  url: string,
  filePath: string,
  formData?: Record<string, string>
): Promise<T> {
  const token = uni.getStorageSync('token') || ''

  const header: Record<string, string> = {}
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise<T>((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: 'file',
      formData,
      header,
      success: (res) => {
        let response: ApiResponse<T>
        try {
          response = JSON.parse(res.data) as ApiResponse<T>
        } catch {
          reject(new Error('上传响应解析失败'))
          return
        }

        if (response.code === 0) {
          resolve(response.data)
        } else {
          uni.showToast({ title: response.message || '上传失败', icon: 'none' })
          reject(new Error(response.message || '上传失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败，请稍后重试', icon: 'none' })
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}
