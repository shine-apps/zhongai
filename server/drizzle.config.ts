import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhongai',
  },
  verbose: true,
  strict: true,
})
