// 스마트폰 하루 사용시간 분포 모델 (로그정규분포, 단위: 분)
// 실제 통계는 완벽한 정규분포가 아니므로 백분위 기반으로 계산하고
// 화면에는 "밀도곡선" 형태로 보여준다.

export type Gender = 'female' | 'male' | 'none'
export type AgeBucket = '10s' | '20s' | '30s' | '40s' | '50s' | '60+'

export const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
  { value: '60+', label: '60대 이상' },
]

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'none', label: '선택 안 함' },
]

// 그룹별 사용시간 중앙값(분)
const MEDIAN_MIN: Record<AgeBucket, number> = {
  '10s': 300,
  '20s': 270,
  '30s': 240,
  '40s': 205,
  '50s': 165,
  '60+': 120,
}

const GENDER_ADJUST: Record<Gender, Partial<Record<AgeBucket, number>>> = {
  female: { '10s': 20, '20s': 15, '30s': 12 },
  male: { '40s': 10, '50s': 12, '60+': 10 },
  none: {},
}

const SIGMA = 0.5 // 로그 표준편차

// 표준정규 CDF (Abramowitz & Stegun 7.1.26)
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp(-0.5 * z * z)
  let p =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  p = 1 - p
  return z >= 0 ? p : 1 - p
}

export interface GroupModel {
  medianMin: number
  mu: number
  sigma: number
  label: string
}

export function groupModel(age: AgeBucket, gender: Gender): GroupModel {
  const adjust = GENDER_ADJUST[gender][age] ?? 0
  const medianMin = MEDIAN_MIN[age] + adjust
  const genderLabel =
    gender === 'female' ? '여성' : gender === 'male' ? '남성' : null
  const ageLabel = AGE_OPTIONS.find((a) => a.value === age)!.label
  return {
    medianMin,
    mu: Math.log(medianMin),
    sigma: SIGMA,
    label: genderLabel ? `${ageLabel} · ${genderLabel}` : ageLabel,
  }
}

export interface Result {
  model: GroupModel
  userMin: number
  percentile: number // 하위 몇 % (0~100), 높을수록 많이 사용
  topPercent: number // 상위 몇 %
  diffMin: number // 중앙값 대비 차이(분), 양수면 더 많이 사용
  peopleBelow: number // 비슷한 100명 중 나보다 적게 쓰는 사람 수
}

export function computeResult(
  age: AgeBucket,
  gender: Gender,
  userHours: number,
): Result {
  const model = groupModel(age, gender)
  const userMin = Math.round(userHours * 60)
  const z = (Math.log(Math.max(userMin, 1)) - model.mu) / model.sigma
  const percentile = clamp(normalCdf(z) * 100, 0.5, 99.5)
  return {
    model,
    userMin,
    percentile,
    topPercent: 100 - percentile,
    diffMin: userMin - model.medianMin,
    peopleBelow: Math.round(percentile),
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

// 밀도곡선 샘플링 (x: 분, y: 상대 밀도)
export function densityCurve(
  model: GroupModel,
  samples = 96,
): { xMax: number; points: { x: number; y: number }[] } {
  const xMax = Math.round(model.medianMin * 3.4)
  const points: { x: number; y: number }[] = []
  for (let i = 0; i <= samples; i++) {
    const x = (xMax * i) / samples
    const xx = Math.max(x, 1)
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
