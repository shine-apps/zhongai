// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
  ],

  compatibilityDate: '2026-05-01',

  dir: {
    app: '.',
  },

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    // 服务端私有变量（不暴露给客户端）
    jwtSecret: process.env.NUXT_JWT_SECRET || '',
    wechatAppId: process.env.NUXT_WECHAT_APP_ID || '',
    wechatAppSecret: process.env.NUXT_WECHAT_APP_SECRET || '',
    databaseUrl: process.env.NUXT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhongai',

    // 公开变量（暴露给客户端）
    public: {
      appName: process.env.NUXT_APP_NAME || '众爱联盟',
      appEnv: process.env.NUXT_APP_ENV || 'development',
    },
  },

  routeRules: {
    '/admin/**': { ssr: true },
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  },

  app: {
    head: {
      title: '众爱联盟',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '众爱联盟 - 让爱连接每一个人' },
      ],
    },
  },

  ui: {
    colors: {
      primary: 'emerald',
    },
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    shim: false,
  },
})
