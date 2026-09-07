import { normalCdf, type AgeBucket } from '../stats'
import type { MarriageRarityInput } from '../types/input'

export interface MarriageRarityStatResult {
  topPercent: number // 상위 몇 % (결혼시장 종합 경쟁력)
  percentile: number // 하위 몇 % (100 - topPercent)
  compositeScore: number // 100점 만점 종합 점수
  breakdown: {
    heightScore: number // 0~100
    salaryScore: number // 0~100
    assetScore: number // 0~100
    housingScore: number // 0~100
    jobScore: number // 0~100
  }
}

export function computeMarriageRarityStat(input: MarriageRarityInput): MarriageRarityStatResult {
  const age: AgeBucket = input.myAge ?? '30s'
  const isMale = input.myGender === 'male'

  // 1. 신장 백분위
  const heightMean = isMale ? 174.55 : 161.91
  const heightSd = isMale ? 5.8 : 5.3
  const zHeight = (input.myHeight - heightMean) / heightSd
  const heightScore = Math.min(99, Math.max(1, Math.round(normalCdf(zHeight) * 100)))

  // 2. 연봉 모델 점수: 2024년 12월 성별·연령별 월평균 보수 × 12.
  // 공식 중앙값이나 백분위가 아니므로 종합 희소도용 추정치로만 사용한다.
  const salaryBenchmarks: Record<'male' | 'female', Record<AgeBucket, number>> = {
    male: { '10s': 1236, '20s': 3432, '30s': 5136, '40s': 6528, '50s': 6576, '60+': 4344 },
    female: { '10s': 1056, '20s': 3060, '30s': 4248, '40s': 4356, '50s': 3672, '60+': 2400 },
  }
  const baseSalaryMedian = salaryBenchmarks[isMale ? 'male' : 'female'][age]
  const zSalary = (Math.log(Math.max(1000, input.mySalary)) - Math.log(baseSalaryMedian)) / 0.45
  const salaryScore = Math.min(99, Math.max(1, Math.round(normalCdf(zSalary) * 100)))

  // 3. 순자산 모델 점수: 2025년 가구주 연령별 가구 순자산 중앙값.
  // 연령×성별 중앙값이 없어 성별 보정은 적용하지 않는다.
  const assetMedians: Record<AgeBucket, number> = {
    '10s': 5000,
    '20s': 5000,
    '30s': 15585,
    '40s': 28384,
    '50s': 31685,
    '60+': 25000,
  }
  const baseAssetMedian = assetMedians[age]
  const zAsset = (Math.log(Math.max(100, input.myNetWorth)) - Math.log(baseAssetMedian)) / 0.9
  const assetScore = Math.min(99, Math.max(1, Math.round(normalCdf(zAsset) * 100)))

  // 4. 주거 형태 점수
  let housingScore = 50
  if (input.myHousing === 'owned') housingScore = 95 // 자가
  else if (input.myHousing === 'jeonse') housingScore = 75 // 전세
  else if (input.myHousing === 'parents') housingScore = 55 // 부모님 동거
  else if (input.myHousing === 'monthly') housingScore = 40 // 월세

  // 5. 직장/직업 점수
  let jobScore = 50
  if (input.myJob === 'top_tier') jobScore = 92 // 대기업/전문직
  else if (input.myJob === 'stable') jobScore = 80 // 공기업/공무원
  else if (input.myJob === 'general') jobScore = 55 // 일반 기업
  else if (input.myJob === 'freelancer') jobScore = 50 // 프리랜서/기타

  // 종합 가중 점수 (자산 30%, 연봉 30%, 신장 15%, 주거 15%, 직장 10%)
  const compositeScore = Math.round(
    salaryScore * 0.3 +
      assetScore * 0.3 +
      heightScore * 0.15 +
      housingScore * 0.15 +
      jobScore * 0.1,
  )

  // 상위 백분위 도출
  const topPercent = Math.min(99.5, Math.max(0.5, 100 - compositeScore))
  const percentile = 100 - topPercent

  return {
    topPercent,
    percentile,
    compositeScore,
    breakdown: {
      heightScore,
      salaryScore,
      assetScore,
      housingScore,
      jobScore,
    },
  }
}
