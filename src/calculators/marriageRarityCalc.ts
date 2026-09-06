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
  const heightMean = isMale ? 174.0 : 161.5
  const heightSd = isMale ? 5.8 : 5.3
  const zHeight = (input.myHeight - heightMean) / heightSd
  const heightScore = Math.min(99, Math.max(1, Math.round(normalCdf(zHeight) * 100)))

  // 2. 연봉 백분위 (로그정규분포)
  const salaryMedians: Record<AgeBucket, number> = {
    '10s': 2200,
    '20s': 3300,
    '30s': 4800,
    '40s': 5800,
    '50s': 6200,
    '60+': 4000,
  }
  const baseSalaryMedian = salaryMedians[age] + (isMale ? 500 : -500)
  const zSalary = (Math.log(Math.max(1000, input.mySalary)) - Math.log(baseSalaryMedian)) / 0.45
  const salaryScore = Math.min(99, Math.max(1, Math.round(normalCdf(zSalary) * 100)))

  // 3. 순자산 백분위 (로그정규분포)
  const assetMedians: Record<AgeBucket, number> = {
    '10s': 500,
    '20s': 3500,
    '30s': 12000,
    '40s': 21000,
    '50s': 27000,
    '60+': 22000,
  }
  const baseAssetMedian = assetMedians[age] + (isMale ? 1000 : -1000)
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
