import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { getAllViews, incrementView } from './api/_viewsCore'

/**
 * 로컬 개발 서버(vite dev)에서 `/api/views` 를 처리하는 미들웨어.
 * 배포 환경에서는 동일 경로를 Vercel Edge Function(api/views.ts)이 담당한다.
 */
function viewsApiDevPlugin(connectionString: string): Plugin {
  return {
    name: 'views-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/views', async (req, res) => {
        res.setHeader('content-type', 'application/json')
        res.setHeader('cache-control', 'no-store')
        try {
          if (!connectionString) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'NEON_DATABASE_URL is not set in .env' }))
            return
          }
          if (req.method === 'GET') {
            const views = await getAllViews(connectionString)
            res.end(JSON.stringify({ views }))
            return
          }
          if (req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const testId = typeof body.testId === 'string' ? body.testId.trim() : ''
            if (!testId) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'testId is required' }))
              return
            }
            const count = await incrementView(connectionString, testId, body.testName)
            res.end(JSON.stringify({ count }))
            return
          }
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        } catch (err) {
          console.error('[dev /api/views] error', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Database request failed' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), viewsApiDevPlugin(env.NEON_DATABASE_URL || '')],
    server: { host: true },
  }
})
