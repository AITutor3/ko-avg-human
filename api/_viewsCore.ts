/**
 * 조회수 트래킹 공통 로직 — Neon DB 접근.
 * Vercel Edge Function(api/views.ts)과 Vite 개발 서버 미들웨어(vite.config.ts)에서 공유한다.
 * NEON_DATABASE_URL은 서버 측에서만 사용되며 클라이언트 번들에 포함되지 않는다.
 */
import { neon } from '@neondatabase/serverless'

export async function getAllViews(connectionString: string): Promise<Record<string, number>> {
  const sql = neon(connectionString)
  const rows = (await sql`SELECT test_id, view_count FROM test_views`) as Array<{
    test_id: string
    view_count: string | number
  }>
  const views: Record<string, number> = {}
  for (const row of rows) views[row.test_id] = Number(row.view_count)
  return views
}

export async function incrementView(
  connectionString: string,
  testId: string,
  testName?: string,
): Promise<number> {
  const sql = neon(connectionString)
  const name = testName && testName.trim() ? testName.trim() : testId
  const rows = (await sql`SELECT increment_test_view(${testId}, ${name}) AS count`) as Array<{
    count: string | number
  }>
  return Number(rows[0]?.count ?? 0)
}
