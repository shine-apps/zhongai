// ============================================================
// 微信 API 工具
// ============================================================

import type { WechatSessionResult } from '../types'

const WX_CODE2SESSION_URL =
  'https://api.weixin.qq.com/sns/jscode2session'

/** 调用微信 code2Session 接口，获取 openid / unionid / session_key */
export async function code2Session(code: string): Promise<WechatSessionResult> {
  const config = useRuntimeConfig()
  const appId = config.wxAppId as string
  const appSecret = config.wxAppSecret as string

  const url =
    `${WX_CODE2SESSION_URL}?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`

  const res = await fetch(url)
  const data = await res.json() as Record<string, any>

  if (data.errcode) {
    throw createError({
      statusCode: 400,
      message: `微信登录失败: ${data.errmsg || '未知错误'}`,
    })
  }

  return {
    openid: data.openid,
    unionid: data.unionid || undefined,
    session_key: data.session_key,
  }
}
