import EmbeddedPostgres from 'embedded-postgres'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pgDataDir = resolve(__dirname, '.pgdata')
const pgPort = 5432

const pg = new EmbeddedPostgres({
  dataDir: pgDataDir,
  port: pgPort,
  user: 'postgres',
  password: 'postgres',
  database: 'zhongai',
  persistent: true,
  createPostgresUser: true,
})

async function main() {
  if (!existsSync(pgDataDir)) {
    console.log('Initializing embedded PostgreSQL...')
    await pg.initialise()
    console.log('PostgreSQL initialized.')
  }

  console.log('Starting embedded PostgreSQL...')
  await pg.start()
  console.log(`PostgreSQL started on port ${pgPort}`)

  try {
    console.log('Creating database zhongai...')
    await pg.createDatabase('zhongai')
    console.log('Database zhongai created.')
  } catch {
    console.log('Database may already exist, continuing...')
  }

  console.log('Running database push...')
  try {
    execSync('npx drizzle-kit push', {
      cwd: resolve(__dirname, 'server'),
      stdio: 'inherit',
      env: {
        ...process.env,
        NUXT_DATABASE_URL: `postgresql://postgres:postgres@localhost:${pgPort}/zhongai`,
      },
    })
    console.log('Database schema pushed successfully.')
  } catch (e) {
    console.log('Database push had issues, continuing...')
  }

  console.log('\nEmbedded PostgreSQL is running!')
  console.log(`Connection: postgresql://postgres:postgres@localhost:${pgPort}/zhongai`)
  console.log('\nPress Ctrl+C to stop.')

  process.on('SIGINT', async () => {
    console.log('\nStopping PostgreSQL...')
    await pg.stop()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await pg.stop()
    process.exit(0)
  })
}

main().catch(async (err) => {
  console.error('Failed to start PostgreSQL:', err)
  await pg.stop()
  process.exit(1)
})
