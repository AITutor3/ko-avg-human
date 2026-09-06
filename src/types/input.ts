import type { AgeBucket, Gender } from '../stats'

export interface BaseInputState {
  age: AgeBucket | null
  gender: Gender | null
}

// 1. 이상형 희소성 (ideal_match)
export interface IdealMatchInput {
  myGender: Gender
  myAge: AgeBucket | null
  targetGender: Gender
  targetAgePref: 'same' | 'older_1_3' | 'older_4_plus' | 'younger_1_3' | 'younger_4_plus' | 'any'
  targetHeightMin: number // cm
  targetIncomeMin: number // 만원 (0: 무관)
  targetJob: 'any' | 'top_tier' | 'stable' | 'general' // 대기업·전문직 / 공기업·공무원 / 일반·무관
  targetBody: 'any' | 'slim' | 'standard' | 'muscular' | 'glamour'
  targetNonSmoker: boolean
}

// 2. 신체적 조건 (physical_condition - 키, 몸무게)
export interface PhysicalInput {
  myGender: Gender
  myAge: AgeBucket | null
  myHeight: number // cm
  myWeight: number // kg
  region?: string // '계' (전국), '서울특별시', '경기도' 등
}

// 2-2. 결혼시장 희소성 (이전 버전 호환용)
export interface MarriageRarityInput {
  myGender: Gender
  myAge: AgeBucket | null
  myHeight: number // cm
  myBody: 'slim' | 'standard' | 'muscular' | 'chubby'
  mySalary: number // 만원 (영끌)
  myNetWorth: number // 만원 (순자산)
  myJob: 'top_tier' | 'stable' | 'general' | 'freelancer'
  myHousing: 'owned' | 'jeonse' | 'monthly' | 'parents'
}

// 3. 순자산 위치 (net_worth)
export interface NetWorthInput {
  myGender: Gender
  myAge: AgeBucket | null
  financialAssets: number // 예적금, 주식, 코인 (만원)
  realEstate: number // 부동산/전세보증금 (만원)
  debts: number // 대출/빚 (만원)
  netWorth: number // 실질 순자산 (만원)
}

// 4. 연봉 (income_salary) - 영끌 연봉
export interface IncomeSalaryInput {
  myGender: Gender
  myAge: AgeBucket | null
  totalSalary: number // 영끌 세전 연봉 (만원)
}

// 5. 소비 수준 (spending_style)
export interface SpendingStyleInput {
  myGender: Gender
  myAge: AgeBucket | null
  monthlyIncome: number // 세후 월수입 (만원)
  monthlySpending: number // 월 총 지출 (만원)
}

// 6. 연애 횟수 (dating_count)
export interface DatingCountInput {
  myGender: Gender
  myAge: AgeBucket | null
  count: number // 총 연애 횟수
  longestDuration: 'under_6m' | '6m_1y' | '1y_3y' | '3y_plus'
}
