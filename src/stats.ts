// 분포 모델 (로그정규분포). 주제별 정의는 topics.ts 참고.
import type { Topic } from './topics'

export type Gender = 'female' | 'male' | 'none'
export type AgeBucket = '10s' | '20s' | '30s' | '40s' | '50s' | '60+'

export const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
  { value: '60+', label: '60대+' },
]

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'none', label: '선택 안 함' },
]

// 표준정규 CDF (Abramowitz & Stegun 7.1.26)
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp(-0.5 * z * z)
  let p =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  p = 1 - p
  return z >= 0 ? p : 1 - p
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

export interface GroupModel {
  /** 그룹 중앙값 (주제 고유 단위) */
  median: number
  mu: number
  sigma: number
  /** "30대 · 여성" 같은 그룹 라벨 */
  label: string
}

export function groupModel(topic: Topic, age: AgeBucket, gender: Gender): GroupModel {
  const adjust = topic.genderAdjust[gender]?.[age] ?? 0
  const median = topic.medianByAge[age] + adjust
  const genderLabel = gender === 'female' ? '여성' : gender === 'male' ? '남성' : null
  const ageLabel = AGE_OPTIONS.find((a) => a.value === age)!.label
  return {
    median,
    mu: Math.log(median),
    sigma: topic.sigma,
    label: genderLabel ? `${ageLabel} · ${genderLabel}` : ageLabel,
  }
}

export interface Result {
  topic: Topic
  model: GroupModel
  /** 사용자 입력값 (주제 고유 단위) */
  value: number
  /** 하위 몇 % (0~100), 높을수록 값이 큼 */
  percentile: number
  /** 상위 몇 % */
  topPercent: number
  /** 중앙값 대비 차이 (양수면 더 큼) */
  diff: number
  /** 중앙값 대비 배수 */
  ratio: number
  /** 비슷한 100명 중 나보다 값이 작은 사람 수 */
  peopleBelow: number
}

export function computeResult(
  topic: Topic,
  age: AgeBucket,
  gender: Gender,
  value: number,
): Result {
  const model = groupModel(topic, age, gender)
  const safe = Math.max(value, topic.floor ?? 0.05)
  const z = (Math.log(safe) - model.mu) / model.sigma
  const percentile = clamp(normalCdf(z) * 100, 0.5, 99.5)
  return {
    topic,
    model,
    value,
    percentile,
    topPercent: 100 - percentile,
    diff: value - model.median,
    ratio: value / model.median,
    peopleBelow: Math.round(percentile),
  }
}

// 밀도곡선 샘플링 (x: 주제 단위, y: 상대 밀도)
export function densityCurve(
  model: GroupModel,
  xMaxFactor = 3.4,
  samples = 120,
): { xMax: number; points: { x: number; y: number }[] } {
  const xMax = model.median * xMaxFactor
  const points: { x: number; y: number }[] = []
  for (let i = 0; i <= samples; i++) {
    const x = (xMax * i) / samples
    const xx = Math.max(x, xMax / samples / 2)
    const lnx = Math.log(xx)
    const y =
      (1 / (xx * model.sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-((lnx - model.mu) ** 2) / (2 * model.sigma ** 2))
    points.push({ x, y })
  }
  return { xMax, points }
}

export function fmtDuration(min: number): string {
  const m = Math.round(Math.abs(min))
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h === 0) return `${mm}분`
  if (mm === 0) return `${h}시간`
  return `${h}시간 ${mm}분`
}

export function fmtHours(h: number): string {
  return fmtDuration(Math.abs(h) * 60)
}

export function fmtAsset(manwon: number): string {
  if (manwon <= 0) return '0원'
  const eok = Math.floor(manwon / 10000)
  const remainder = Math.round(manwon % 10000)
  if (eok === 0) return `${remainder.toLocaleString()}만원`
  if (remainder === 0) return `${eok}억원`
  return `${eok}억 ${remainder.toLocaleString()}만원`
}

export function fmtSalary(manwon: number): string {
  return fmtAsset(manwon)
}

export interface OverallUniqueness {
  deviationIndex: number
  characterTitle: string
  subDescription: string
  tags: string[]
}

export function computeOverallUniqueness(results: Result[]): OverallUniqueness {
  if (!results || results.length === 0) {
    return {
      deviationIndex: 50,
      characterTitle: '대한민국 표준 황금 밸런서 ⚖️',
      subDescription: '남들과 적당히 맞춰 살며 편안함을 즐기는 유형',
      tags: ['평균 밸런서'],
    }
  }

  const diffs = results.map((r) => Math.abs(r.percentile - 50))
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const deviationIndex = Math.min(99, Math.max(1, Math.round(avgDiff * 2)))

  const tags = results.map((r) => `${r.topic.navTitle} 상위 ${Math.round(r.topPercent)}%`)

  let characterTitle = '대한민국 82% 평균 이탈자 🦄'
  let subDescription = '남들과 다른 나만의 독보적 인생을 살고 있는 인류!'

  if (deviationIndex >= 80) {
    characterTitle = '대한민국 1% 독보적 마이웨이 👑'
    subDescription = '평균 따위는 가뿐히 뛰어넘는 압도적 독창성의 소유자!'
  } else if (deviationIndex >= 60) {
    characterTitle = '대한민국 60% 개성파 이탈자 ⚡'
    subDescription = '자신만의 확실한 취향과 위치를 구축한 유형!'
  } else if (deviationIndex >= 40) {
    characterTitle = '대한민국 40% 무난한 조화인 🌿'
    subDescription = '남들과 적당히 조화를 이루며 무난하게 사는 유형!'
  } else {
    characterTitle = '대한민국 순도 99% 황금 밸런서 ⚖️'
    subDescription = '통계학적으로 가장 완벽한 표준 한국인에 근접!'
  }

  return {
    deviationIndex,
    characterTitle,
    subDescription,
    tags,
  }
}


