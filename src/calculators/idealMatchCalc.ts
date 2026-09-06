import { normalCdf, type Gender } from '../stats'
import type { IdealMatchInput } from '../types/input'

export interface IdealMatchStatResult {
  topPercent: number // 상위 몇 % (희소도, 작을수록 유니콘)
  percentile: number // 하위 몇 % (100 - topPercent)
  rarityScore: number // 100점 만점 환산 점수
  probHeight: number
  probIncome: number
  probJob: number
  probSmoke: number
  probBody: number
  summaryBreakdown: { label: string; probText: string; isRare: boolean }[]
}

export function computeIdealMatchStat(input: IdealMatchInput): IdealMatchStatResult {
  const targetGender: Gender =
    input.targetGender !== 'none'
      ? input.targetGender
      : input.myGender === 'female'
      ? 'male'
      : 'female'

  // 1. 키(신장) 확률: 정규분포 기준
  // 한국 성인 남성 평균 174cm (표준편차 5.8cm), 여성 평균 161.5cm (표준편차 5.3cm)
  const isMaleTarget = targetGender === 'male'
  const heightMean = isMaleTarget ? 174.0 : 161.5
  const heightSd = isMaleTarget ? 5.8 : 5.3

  let probHeight = 1.0
  if (input.targetHeightMin > (isMaleTarget ? 165 : 153)) {
    const zHeight = (input.targetHeightMin - heightMean) / heightSd
    probHeight = Math.max(0.01, 1 - normalCdf(zHeight))
  }

  // 2. 소득/연봉 확률: 로그정규분포 기준
  // 타겟 연령대 중앙값 기준 (기본 30대 기준 약 4,800만 남성, 4,300만 여성)
  let probIncome = 1.0
  if (input.targetIncomeMin > 0) {
    const medianSalary = isMaleTarget ? 5000 : 4200
    const mu = Math.log(medianSalary)
    const sigma = 0.45
    const zSalary = (Math.log(input.targetIncomeMin) - mu) / sigma
    probIncome = Math.max(0.015, 1 - normalCdf(zSalary))
  }

  // 3. 직업군 확률
  let probJob = 1.0
  if (input.targetJob === 'top_tier') {
    probJob = 0.15 // 대기업, 전문직, 금융권 약 15%
  } else if (input.targetJob === 'stable') {
    probJob = 0.13 // 공기업, 공무원, 교사 약 13%
  }

  // 4. 비흡연 여부 확률 (통계청 성인 흡연율 반영)
  let probSmoke = 1.0
  if (input.targetNonSmoker) {
    probSmoke = isMaleTarget ? 0.65 : 0.93 // 남성 비흡연율 ~65%, 여성 ~93%
  }

  // 5. 체형/스타일 확률
  let probBody = 1.0
  if (input.targetBody === 'muscular' || input.targetBody === 'glamour') {
    probBody = 0.22 // 상위 탄탄/글래머 체형 약 22%
  } else if (input.targetBody === 'slim') {
    probBody = 0.35 // 슬림 체형 약 35%
  }

  // 결합 확률 (조건 간 약간의 양의 상관관계를 고려한 댐핑 지수 0.88 적용)
  const rawJointProb = probHeight * probIncome * probJob * probSmoke * probBody
  const adjustedJointProb = Math.min(1.0, Math.max(0.001, Math.pow(rawJointProb, 0.88)))

  const topPercent = Math.min(99.5, Math.max(0.1, adjustedJointProb * 100))
  const percentile = 100 - topPercent

  // 100점 만점 희소도 점수
  const rarityScore = Math.round(100 - topPercent)

  const summaryBreakdown = [
    {
      label: `희망 키 ${input.targetHeightMin}cm 이상`,
      probText: `해당 성별 상위 ${Math.round((1 - probHeight) * 100)}% 지점 (충족률 약 ${Math.round(probHeight * 100)}%)`,
      isRare: probHeight < 0.25,
    },
    {
      label: input.targetIncomeMin > 0 ? `최소 연봉 ${input.targetIncomeMin.toLocaleString()}만원 이상` : '연봉 무관',
      probText: input.targetIncomeMin > 0 ? `소득 상위 약 ${Math.round((1 - probIncome) * 100)}%` : '조건 없음',
      isRare: probIncome < 0.2,
    },
    {
      label:
        input.targetJob === 'top_tier'
          ? '대기업·전문직 선호'
          : input.targetJob === 'stable'
          ? '공기업·공무원 선호'
          : '직장/직업 무관',
      probText: input.targetJob !== 'any' ? `해당 직군 비율 약 ${Math.round(probJob * 100)}%` : '조건 없음',
      isRare: input.targetJob !== 'any',
    },
    {
      label: input.targetNonSmoker ? '비흡연자 필수' : '흡연 여부 무관',
      probText: input.targetNonSmoker ? `비흡연 비율 약 ${Math.round(probSmoke * 100)}%` : '조건 없음',
      isRare: false,
    },
  ]

  return {
    topPercent,
    percentile,
    rarityScore,
    probHeight,
    probIncome,
    probJob,
    probSmoke,
    probBody,
    summaryBreakdown,
  }
}
