import { normalCdf, type AgeBucket, type Gender, type GroupModel, type Result } from '../stats'
import { HEIGHT_STATS, WEIGHT_STATS, type GenderKey } from '../statics/physicalData'
import type { Topic } from '../topics'

export interface PhysicalInput {
  myGender: Gender
  myAge: AgeBucket | null
  myHeight: number // cm
  myWeight: number // kg
  region?: string // 기본값: '계' (전국)
}

export interface PhysicalStatResult {
  // 신장
  meanHeight: number
  heightPercentile: number // 하위 %
  heightTopPercent: number // 상위 %
  heightDiff: number
  heightResult: Result

  // 체중
  meanWeight: number
  weightPercentile: number // 하위 %
  weightTopPercent: number // 상위 %
  weightDiff: number
  weightResult: Result

  // BMI
  bmi: number
  bmiCategory: string
  bmiDescription: string

  // 종합 점수 & 라벨
  characterEmoji: string
  characterTitle: string
}

export function computePhysicalStats(
  topic: Topic,
  input: PhysicalInput,
): PhysicalStatResult {
  const age: AgeBucket = input.myAge ?? '30s'
  const isMale = input.myGender === 'male'
  const genderKey: GenderKey = isMale ? '남자' : '여자'
  const region = input.region && HEIGHT_STATS[input.region] ? input.region : '계'

  // 연령 키 매핑
  const ageKey =
    age === '10s'
      ? '10s'
      : age === '20s'
      ? '20s'
      : age === '30s'
      ? '30s'
      : age === '40s'
      ? '40s'
      : age === '50s'
      ? '50s'
      : '60s'

  // 1. 2024 국가건강검진 실측 통계 데이터 조회
  const meanHeight = HEIGHT_STATS[region]?.[genderKey]?.[ageKey] ?? (isMale ? 174.55 : 161.91)
  const meanWeight = WEIGHT_STATS[region]?.[genderKey]?.[ageKey] ?? (isMale ? 79.76 : 60.19)

  // 2. 신장 분포 계산 (한국인 신장 정규분포: 남 σ=5.8cm, 여 σ=5.3cm)
  const sdHeight = isMale ? 5.8 : 5.3
  const zHeight = (input.myHeight - meanHeight) / sdHeight
  const heightPercentile = Math.min(99.5, Math.max(0.5, normalCdf(zHeight) * 100))
  const heightTopPercent = 100 - heightPercentile
  const heightDiff = Number((input.myHeight - meanHeight).toFixed(1))

  // 3. 체중 분포 계산 (한국인 체중 분포: 남 σ=10.5kg, 여 σ=8.8kg)
  const sdWeight = isMale ? 10.5 : 8.8
  const zWeight = (input.myWeight - meanWeight) / sdWeight
  const weightPercentile = Math.min(99.5, Math.max(0.5, normalCdf(zWeight) * 100))
  const weightTopPercent = 100 - weightPercentile
  const weightDiff = Number((input.myWeight - meanWeight).toFixed(1))

  // 4. BMI 계산
  const heightMeter = input.myHeight / 100
  const bmi = Number((input.myWeight / (heightMeter * heightMeter)).toFixed(1))

  let bmiCategory = '정상 체중'
  let bmiDescription = '표준적이고 건강한 신체 밸런스를 유지하고 있어요!'
  if (bmi < 18.5) {
    bmiCategory = '저체중'
    bmiDescription = '슬림한 체형이지만 근력 강화와 영양 보충을 추천해요!'
  } else if (bmi >= 23 && bmi < 25) {
    bmiCategory = '과체중 (통통)'
    bmiDescription = '체격이 다부진 편이며 적절한 유산소 운동이 도움돼요!'
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = '비만 (체중 관리 필요)'
    bmiDescription = '근육량 또는 체지방 관리를 병행하면 훨씬 건강해져요!'
  } else if (bmi >= 30) {
    bmiCategory = '고도 비만'
    bmiDescription = '체계적인 식단과 운동 관리가 꼭 필요한 상태예요!'
  }

  // 가상의 신장 Topic / 체중 Topic 생성
  const heightTopic: Topic = {
    ...topic,
    id: 'physical_height',
    navTitle: '키 (신장)',
    fmt: (v) => `${v.toFixed(1)}cm`,
  }

  const weightTopic: Topic = {
    ...topic,
    id: 'physical_weight',
    navTitle: '몸무게 (체중)',
    fmt: (v) => `${v.toFixed(1)}kg`,
  }

  const heightModel: GroupModel = {
    median: meanHeight,
    mu: Math.log(meanHeight),
    sigma: sdHeight / meanHeight,
    label: `${age.replace('s', '대')} · ${genderKey} 평균 키`,
  }

  const weightModel: GroupModel = {
    median: meanWeight,
    mu: Math.log(meanWeight),
    sigma: sdWeight / meanWeight,
    label: `${age.replace('s', '대')} · ${genderKey} 평균 체중`,
  }

  const heightResult: Result = {
    topic: heightTopic,
    model: heightModel,
    value: input.myHeight,
    percentile: heightPercentile,
    topPercent: heightTopPercent,
    diff: heightDiff,
    ratio: input.myHeight / meanHeight,
    peopleBelow: Math.round(heightPercentile),
  }

  const weightResult: Result = {
    topic: weightTopic,
    model: weightModel,
    value: input.myWeight,
    percentile: weightPercentile,
    topPercent: weightTopPercent,
    diff: weightDiff,
    ratio: input.myWeight / meanWeight,
    peopleBelow: Math.round(weightPercentile),
  }

  // 캐릭터 타이틀
  let characterEmoji = '🏃'
  let characterTitle = '황금 밸런스 피지컬'
  if (heightTopPercent <= 15 && bmi >= 18.5 && bmi <= 24) {
    characterEmoji = '👑🦒'
    characterTitle = '기럭지 우월 모델형 피지컬'
  } else if (heightTopPercent <= 15) {
    characterEmoji = '👑🏋️'
    characterTitle = '압도적 피지컬 거인형'
  } else if (bmi < 18.5) {
    characterEmoji = '🌸🧚'
    characterTitle = '여리여리 슬림형 피지컬'
  } else if (bmi >= 25) {
    characterEmoji = '🐻💪'
    characterTitle = '든든한 헐크 마동석형 피지컬'
  }

  return {
    meanHeight,
    heightPercentile,
    heightTopPercent,
    heightDiff,
    heightResult,
    meanWeight,
    weightPercentile,
    weightTopPercent,
    weightDiff,
    weightResult,
    bmi,
    bmiCategory,
    bmiDescription,
    characterEmoji,
    characterTitle,
  }
}
