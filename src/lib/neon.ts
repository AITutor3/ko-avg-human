/**
 * Neon DB SQL-over-HTTP 클라이언트
 * korea-avg 프로젝트의 각 테스트별 조회수를 측정 및 실시간 동기화합니다.
 */

const NEON_HOST = 'ep-mute-silence-b3is2z0b-pooler.c-4.ap-southeast-1.aws.neon.tech'
const NEON_CONNECTION_STRING =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_purHcz2W8UEn@ep-mute-silence-b3is2z0b-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

export interface TestViewStat {
  test_id: string
  test_name: string
  view_count: string | number
}

// 기본 fallback 데이터
export const FALLBACK_VIEWS: Record<string, number> = {
  ideal_match: 0,
  net_worth: 0,
  income_salary: 0,
  dating_count: 0,
  physical_condition: 0,
  spending_style: 0,
}

/**
 * Neon DB HTTP SQL 실행기
 */
async function queryNeon<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const url = `https://${NEON_HOST}/sql`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': NEON_CONNECTION_STRING,
      },
      body: JSON.stringify({ query, params }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn(`[Neon DB Error] ${res.status}: ${errText}`)
      return []
    }

    const data = await res.json()
    return (data.rows || []) as T[]
  } catch (err) {
    console.warn('[Neon DB Fetch Error]', err)
    return []
  }
}

/**
 * 전체 테스트 조회수 목록 조회 (Neon DB 실시간 값)
 */
export async function fetchAllTestViews(): Promise<Record<string, number>> {
  const rows = await queryNeon<TestViewStat>(
    'SELECT test_id, test_name, view_count FROM test_views'
  )

  const resultMap: Record<string, number> = { ...FALLBACK_VIEWS }
  if (rows && rows.length > 0) {
    for (const row of rows) {
      resultMap[row.test_id] = Number(row.view_count)
    }
  }

  return resultMap
}

/**
 * 특정 테스트 조회수 1 증가 (원자적 업데이트 및 로그 기록)
 */
export async function recordTestView(testId: string, testName?: string): Promise<number | null> {
  try {
    const rows = await queryNeon<{ increment_test_view: string | number }>(
      'SELECT increment_test_view($1, $2);',
      [testId, testName || testId]
    )

    if (rows && rows.length > 0 && rows[0].increment_test_view !== undefined) {
      const newCount = Number(rows[0].increment_test_view)
      return newCount
    }
  } catch (err) {
    console.warn(`[recordTestView Error for ${testId}]`, err)
  }
  return null
}

/**
 * 조회수 숫자를 직관적인 형태로 포맷팅
 * 예: 0 -> '0회', 1 -> '1회', 1520 -> '1,520회', 384210 -> '38.4만회'
 */
export function formatViewCount(count: number, suffix: boolean = true): string {
  if (isNaN(count) || count === undefined || count === null) {
    return suffix ? '0회' : '0'
  }
  if (count >= 10000) {
    const man = count / 10000
    const formatted = man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)
    return suffix ? `${formatted}만회` : `${formatted}만`
  }
  const formatted = count.toLocaleString('ko-KR')
  return suffix ? `${formatted}회` : formatted
}
