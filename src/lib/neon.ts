/**
 * 조회수 트래킹 클라이언트
 *
 * 실제 조회수는 Neon DB(test_views 테이블)에 저장되며,
 * 접속 정보 노출을 막기 위해 서버리스 엔드포인트 `/api/views`를 경유한다.
 * (구현: `api/views.ts`)
 */

const API_ENDPOINT = '/api/views'

export interface TestViewStat {
  test_id: string
  test_name: string
  view_count: string | number
}

// API 응답 실패 시 사용할 기본값
export const FALLBACK_VIEWS: Record<string, number> = {
  ideal_match: 0,
  net_worth: 0,
  income_salary: 0,
  dating_count: 0,
  physical_condition: 0,
  spending_style: 0,
}

/**
 * 전체 테스트 조회수 목록 조회 (Neon DB 실시간 값)
 */
export async function fetchAllTestViews(): Promise<Record<string, number>> {
  try {
    const res = await fetch(API_ENDPOINT, { method: 'GET' })
    if (!res.ok) {
      console.warn(`[views] fetch failed: ${res.status}`)
      return { ...FALLBACK_VIEWS }
    }
    const data = (await res.json()) as { views?: Record<string, number> }
    return { ...FALLBACK_VIEWS, ...(data.views || {}) }
  } catch (err) {
    console.warn('[views] fetch error', err)
    return { ...FALLBACK_VIEWS }
  }
}

/**
 * 특정 테스트 조회수 1 증가. 성공 시 갱신된 누적 조회수를 반환.
 */
export async function recordTestView(testId: string, testName?: string): Promise<number | null> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, testName: testName || testId }),
      keepalive: true,
    })
    if (!res.ok) {
      console.warn(`[views] record failed for ${testId}: ${res.status}`)
      return null
    }
    const data = (await res.json()) as { count?: number }
    return typeof data.count === 'number' ? data.count : null
  } catch (err) {
    console.warn(`[views] record error for ${testId}`, err)
    return null
  }
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
