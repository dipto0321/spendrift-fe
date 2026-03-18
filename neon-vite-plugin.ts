import { postgres } from '@neondatabase/vite-plugin-postgres'

export default postgres({
  seed: {
    type: 'sql-script',
    path: 'db/init.sql',
  },
  referrer: 'create-tanstack',
  dotEnvKey: 'DATABASE_URL',
})
