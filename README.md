# 众爱联盟

基于 Nuxt v4 + Drizzle ORM + PostgreSQL 的全栈项目（Monorepo 架构）。

## 技术栈

- **框架**: Nuxt v4 (Nitro)
- **UI**: Nuxt UI v3 (@nuxt/ui)
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: JWT (jsonwebtoken / jose)
- **校验**: Zod
- **语言**: TypeScript

## 项目结构

```
zhongai/
├── package.json          # 根 package.json (workspace 配置)
├── .env.example          # 环境变量模板
├── .gitignore
├── README.md
└── server/               # 后端服务 (Nuxt v4)
    ├── package.json
    ├── nuxt.config.ts
    ├── tsconfig.json
    ├── drizzle.config.ts
    ├── app.vue
    ├── assets/css/
    │   └── main.css
    ├── server/           # API 路由 & 中间件
    └── drizzle/          # 数据库 schema & migrations
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env

# 启动开发服务器
pnpm dev
```

## 数据库操作

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 推送 schema 到数据库（开发用）
pnpm db:push

# 打开 Drizzle Studio
pnpm db:studio
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写实际配置：

| 变量名 | 说明 |
|--------|------|
| `NUXT_JWT_SECRET` | JWT 签名密钥 |
| `NUXT_WECHAT_APP_ID` | 微信小程序 AppID |
| `NUXT_WECHAT_APP_SECRET` | 微信小程序 AppSecret |
| `NUXT_DATABASE_URL` | PostgreSQL 连接字符串 |
