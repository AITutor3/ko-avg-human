/**
 * Vercel Edge Function — 테스트별 조회수 트래킹 프록시
 *
 *   GET  /api/views                    → { views: { [testId]: number } }
 *   POST /api/views {testId,testName?}  → { count: number }
 *
 * 필요한 환경변수: NEON_DATABASE_URL (Vercel 프로젝트 설정, 클라이언트 비노출)
 * 로컬(vite dev)에서는 vite.config.ts 의 미들웨어가 동일 경로를 처리한다.
 */
import { getAllViews, incrementView } from './_viewsCore'

export const config = { runtime: 'edge' }

const CORS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'no-store',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  const connectionString = process.env.NEON_DATABASE_URL
  if (!connectionString) {
    return new Response(JSON.stringify({ error: 'NEON_DATABASE_URL is not configured' }), {
      status: 500,
      headers: CORS,
    })
  }

  try {
    if (req.method === 'GET') {
      const views = await getAllViews(connectionString)
      return new Response(JSON.stringify({ views }), { headers: CORS })
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { testId?: unknown; testName?: unknown }
      const testId = typeof body.testId === 'string' ? body.testId.trim() : ''
      if (!testId) {
        return new Response(JSON.stringify({ error: 'testId is required' }), { status: 400, headers: CORS })
      }
      const testName = typeof body.testName === 'string' ? body.testName : undefined
      const count = await incrementView(connectionString, testId, testName)
      return new Response(JSON.stringify({ count }), { headers: CORS })
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS })
  } catch (err) {
    console.error('[api/views] error', err)
    return new Response(JSON.stringify({ error: 'Database request failed' }), { status: 500, headers: CORS })
  }
}
