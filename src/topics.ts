import type { AgeBucket, Gender, Result } from './stats'
import { fmtAsset, fmtSalary } from './stats'

export interface TopicCardBadge {
  badgeTitle: string
  subTitle?: string
  bubbleLeft: string
  bubbleRight: string
  characterEmoji: string
}

export interface Topic {
  id: string
  emoji: string
  accent: string
  /** 슬라이더 카드 제목 */
  navTitle: string
  /** 랜딩/결과에서 쓰는 핵심 질문 */
  question: string
  /** 슬라이더 카드 한 줄 소개 */
  teaser: string

  // 입력 슬라이더
  inputLabel: string
  inputHint: string
  min: number
  max: number
  step: number
  default: number

  // 분포 모델
  medianByAge: Record<AgeBucket, number>
  genderAdjust: Partial<Record<Gender, Partial<Record<AgeBucket, number>>>>
  sigma: number
  floor?: number
  xMaxFactor?: number

  // 표시
  fmt: (v: number) => string
  compareVerb: string

  // 카피
  resultTitle: (r: Result) => string
  headline: (r: Result) => string
  verdict: (r: Result) => string
  labels: (topPercent: number) => { name: string; emoji: string; card?: TopicCardBadge }
}

const between =
  (
    bands: { name: string; emoji: string; upTo: number; card?: TopicCardBadge }[],
    fallback: { name: string; emoji: string; card?: TopicCardBadge },
  ) =>
  (topPercent: number) =>
    bands.find((b) => topPercent <= b.upTo) ?? fallback

// ─────────────────────────────────────────────────────────
// 1. 내 순자산은 또래 중 상위 몇 %? (net_worth)
const net_worth: Topic = {
  id: 'net_worth',
  emoji: '💰',
  accent: '#ffb703',
  navTitle: '순자산 위치',
  question: '내 순자산은 대한민국\n또래 중 상위 몇 %일까? 💰',
  teaser: '대한민국 30대 중 상위 17%! 통장 팩폭 실측치 😱',
  inputLabel: '순자산 (총자산 − 대출/부채)',
  inputHint: '예적금, 부동산, 주식에서 빚 뺀 진짜 내 순자산',
  min: 0,
  max: 100000,
  step: 500,
  default: 8000,
  medianByAge: { '10s': 500, '20s': 3500, '30s': 12000, '40s': 21000, '50s': 27000, '60+': 22000 },
  genderAdjust: {
    female: { '20s': -300, '30s': -1000, '40s': -2000 },
    male: { '20s': 300, '30s': 1000, '40s': 2000 },
  },
  sigma: 0.9,
  floor: 100,
  xMaxFactor: 4,
  fmt: (v) => fmtAsset(v),
  compareVerb: '자산이 많아요',
  resultTitle: (r) => `대한민국 또래 중\n상위 ${Math.round(r.topPercent)}% 자산가! 💰`,
  headline: (r) => `나는 또래 100명 중 ${r.peopleBelow}명보다 자산이 많다 💸`,
  verdict: (r) =>
    r.ratio >= 1.3
      ? '차곡차곡 알뜰살뜰 모은 시드머니 부자!'
      : r.ratio <= 0.7
        ? '독립 초기엔 다들 이래요. 지금부터 차근차근 모으면 됨!'
        : '딱 안정적인 연령대 평균 순자산이에요',
  labels: between(
    [
      {
        upTo: 15,
        name: '영앤리치 자산가',
        emoji: '👑',
        card: {
          badgeTitle: '황금빛 1인가구',
          subTitle: '통장 잔고 보면 마음이 평화로움',
          bubbleLeft: '잔고 확인하면',
          bubbleRight: '절로 미소가 든든!',
          characterEmoji: '💰👑🐻',
        },
      },
      {
        upTo: 45,
        name: '시드머니 저축왕',
        emoji: '💎',
        card: {
          badgeTitle: '시드머니 다람쥐',
          subTitle: '차곡차곡 모아 집 마련 프로젝트',
          bubbleLeft: '차곡차곡 모아',
          bubbleRight: '내 집 마련 가자!',
          characterEmoji: '💎🐻',
        },
      },
    ],
    {
      name: '월급 스쳐 지나가는 새싹',
      emoji: '🌱',
      card: {
        badgeTitle: '텅장 수호자',
        subTitle: '월급날 들어와서 퍼나르기 바쁜',
        bubbleLeft: '월급 들어왔는데',
        bubbleRight: '어디로 퍼갔지?',
        characterEmoji: '🌱🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 2. 나는 연애를 많이 한 편일까? (dating_count)
const dating_count: Topic = {
  id: 'dating_count',
  emoji: '❤️',
  accent: '#ff4d6d',
  navTitle: '연애 횟수',
  question: '나는 연애를 또래보다\n많이 한 편일까? ❤️',
  teaser: '연애 경험 상위 23%! 단톡방 찰떡 공유 팩폭 💘',
  inputLabel: '총 누적 연애 횟수 (회)',
  inputHint: '지나간 옛 연인 포함 오락성 익명 팩폭치',
  min: 0,
  max: 20,
  step: 1,
  default: 3,
  medianByAge: { '10s': 1, '20s': 3, '30s': 4, '40s': 4, '50s': 4, '60+': 3 },
  genderAdjust: {},
  sigma: 0.6,
  floor: 0.5,
  fmt: (v) => `${v}회`,
  compareVerb: '연애 경험이 많아요',
  resultTitle: (r) => `연애 경험 상위 ${Math.round(r.topPercent)}%! 💘`,
  headline: (r) =>
    r.diff >= 0
      ? `또래 평균보다 ${Math.abs(r.diff).toFixed(1)}번 연애 경험이 많아요 🌹`
      : `또래 평균보다 ${Math.abs(r.diff).toFixed(1)}번 더 신중한 연애를 해왔어요 💌`,
  verdict: (r) =>
    r.diff >= 1.5
      ? '사랑에 누구보다 적극적이었던 열정파! 우리 사랑이 너무 뜨거워 🔥'
      : r.diff <= -1.5
        ? '한 번 만나면 길고 진하게 다 퍼주는 진국 스타일!'
        : '평균적이고 원만한 연애 경험을 가졌네요!',
  labels: between(
    [
      {
        upTo: 15,
        name: '불타는 사랑꾼 만렙',
        emoji: '💘',
        card: {
          badgeTitle: '불타는 사랑꾼',
          subTitle: '좋아하면 일단 노빠꾸 직진',
          bubbleLeft: '가만히 앉아 있기엔',
          bubbleRight: '우리 사랑이 너무 뜨거워!',
          characterEmoji: '💘🔥🐻‍❄️',
        },
      },
      {
        upTo: 50,
        name: '로맨틱 러버',
        emoji: '🌹',
        card: {
          badgeTitle: '연애 고수',
          subTitle: '진심과 밀당 타이밍을 아는',
          bubbleLeft: '사랑은 항상',
          bubbleRight: '달콤하고 솔직하게!',
          characterEmoji: '🌹🐻',
        },
      },
    ],
    {
      name: '단일 진국 순정파',
      emoji: '💌',
      card: {
        badgeTitle: '진국 순정파',
        subTitle: '한 번 시작하면 깊게 다 퍼주는',
        bubbleLeft: '횟수보다 중요한 건',
        bubbleRight: '진심 어린 마음!',
        characterEmoji: '💌🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 3. 내 연봉은 또래 중 상위 몇 %? (income_salary)
const income_salary: Topic = {
  id: 'income_salary',
  emoji: '💵',
  accent: '#4c6ef5',
  navTitle: '연봉 (소득)',
  question: '내 세전 연봉은 대한민국\n또래 중 상위 몇 %일까? 💵',
  teaser: '내 생각 속 위치 vs 실제 대한민국 리얼 연봉 위치 팩폭 💥',
  inputLabel: '세전 연간 소득 (연봉 만원)',
  inputHint: '세전 총수령액 (기본급 + 인센티브 + 상여금)',
  min: 1500,
  max: 20000,
  step: 100,
  default: 4200,
  medianByAge: { '10s': 2200, '20s': 3300, '30s': 4800, '40s': 5800, '50s': 6200, '60+': 4000 },
  genderAdjust: {
    female: { '20s': -200, '30s': -500, '40s': -800 },
    male: { '20s': 200, '30s': 500, '40s': 800 },
  },
  sigma: 0.45,
  fmt: (v) => fmtSalary(v),
  compareVerb: '연봉이 높아요',
  resultTitle: (r) => `대한민국 또래 연봉\n상위 ${Math.round(r.topPercent)}% 💵`,
  headline: (r) => `내 연봉 위치 깠다! 또래 100명 중 ${r.peopleBelow}명 제침 💥`,
  verdict: (r) =>
    r.ratio >= 1.3
      ? '또래보다 확실히 능력 있는 핵심 소득자!'
      : r.ratio <= 0.7
        ? '이직과 커리어 업그레이드가 시급한 순간!'
        : '대한민국 전형적인 평균 연봉대입니다!',
  labels: between(
    [
      {
        upTo: 10,
        name: '억대 연봉 능력자',
        emoji: '🏢',
        card: {
          badgeTitle: '커리어 킹',
          subTitle: '연봉 협상 테이블 지배자',
          bubbleLeft: '월급명세서 보면',
          bubbleRight: '뿌듯함이 수직 상승!',
          characterEmoji: '🏢💵🐻',
        },
      },
      {
        upTo: 45,
        name: '실속파 커리어맨',
        emoji: '💼',
        card: {
          badgeTitle: '중추 커리어러',
          subTitle: '회사 일 든든하게 해내는 능력자',
          bubbleLeft: '오늘도 열일하고',
          bubbleRight: '맛있는 거 먹자!',
          characterEmoji: '💼🐻',
        },
      },
    ],
    {
      name: '연봉 상승 열망러',
      emoji: '📈',
      card: {
        badgeTitle: '커리어 새싹',
        subTitle: '스펙 업하고 이직 준비 중인',
        bubbleLeft: '내 연봉은',
        bubbleRight: '이제부터 우상향!',
        characterEmoji: '📈🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 4. 내 이상형 조건은 대한민국 상위 몇 %짜리일까? (ideal_match)
const ideal_match: Topic = {
  id: 'ideal_match',
  emoji: '💘',
  accent: '#f72585',
  navTitle: '이상형 희소성',
  question: '내 이상형 조건은 대한민국에\n상위 몇 %나 존재할까? 💘',
  teaser: '키 180+ / 연봉 6천+… 대한민국에 생각보다 별로 없다 😱',
  inputLabel: '원하는 이상형 조건 수준 (100점 만점)',
  inputHint: '키, 연봉, 학벌, 스타일 종합 까다로움 지수',
  min: 10,
  max: 100,
  step: 5,
  default: 70,
  medianByAge: { '10s': 50, '20s': 55, '30s': 60, '40s': 60, '50s': 55, '60+': 50 },
  genderAdjust: {},
  sigma: 0.4,
  fmt: (v) => `${v}점`,
  compareVerb: '이상형 기준이 까다로워요',
  resultTitle: (r) => `당신의 이상형은 대한민국\n상위 ${(100 - r.percentile).toFixed(1)}% 수준 😱`,
  headline: (r) => `내 이상형… 대한민국에 생각보다 별로 없다! (상위 ${Math.round(r.topPercent)}%) 💘`,
  verdict: (r) =>
    r.topPercent <= 15
      ? `눈이 진짜 높으시네요! (상위 ${Math.round(r.topPercent)}%) 한국인 상위 1%급 조건을 원하는 중`
      : `현실과 타협 가능한 균형 있는 이상형 조건입니다! (상위 ${Math.round(r.topPercent)}%)`,
  labels: between(
    [
      {
        upTo: 10,
        name: '유니콘을 찾는 사람',
        emoji: '🦄',
        card: {
          badgeTitle: '유니콘 수색꾼',
          subTitle: '대한민국 상위 1% 조건만 모은',
          bubbleLeft: '내 눈이 높은 게 아니라',
          bubbleRight: '유니콘이 희귀한 거야!',
          characterEmoji: '🦄💘🐻',
        },
      },
    ],
    {
      name: '현실 찰떡 러버',
      emoji: '🌸',
      card: {
        badgeTitle: '현실 사랑꾼',
        subTitle: '진심과 통함이 더 중요한 사람',
        bubbleLeft: '조건보다 중요한 건',
        bubbleRight: '나랑 잘 통하는 마음!',
        characterEmoji: '🌸🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 5. 결혼 시장에서 나는 얼마나 희귀한 조건일까? (marriage_rarity)
const marriage_rarity: Topic = {
  id: 'marriage_rarity',
  emoji: '💍',
  accent: '#7209b7',
  navTitle: '결혼시장 희소성',
  question: '결혼 시장에서 나는\n얼마나 희귀한 인재일까? 💍',
  teaser: '대한민국 희귀종 등판! 나와 같은 조건은 100명 중 약 4명꼴 👑',
  inputLabel: '내 종합 프로필 매력 스펙트럼 (점수)',
  inputHint: '나이 + 소득 + 자산 + 키 종합 밸런스 점수',
  min: 10,
  max: 100,
  step: 5,
  default: 65,
  medianByAge: { '10s': 50, '20s': 55, '30s': 60, '40s': 60, '50s': 55, '60+': 50 },
  genderAdjust: {},
  sigma: 0.35,
  fmt: (v) => `${v}점`,
  compareVerb: '희소성이 높아요',
  resultTitle: (r) => `나와 동일한 조건은\n또래 100명 중 약 ${Math.max(1, Math.round(100 - r.percentile))}명꼴! 👑`,
  headline: (r) => `결혼 시장 희귀종 등판! 100명 중 약 ${Math.max(1, Math.round(100 - r.percentile))}명 존재 💍`,
  verdict: (r) =>
    r.topPercent <= 15
      ? '상위권 육각형 완벽 프로필! 결혼 시장 희귀종 인정'
      : '무난하고 가치 있는 매력적인 조건입니다!',
  labels: between(
    [
      {
        upTo: 10,
        name: '육각형 완벽 인재',
        emoji: '👑',
        card: {
          badgeTitle: '육각형 챔피언',
          subTitle: '모든 스펙이 균형 잡힌 최고의 인재',
          bubbleLeft: '나 같은 조건은',
          bubbleRight: '대한민국 희귀종이지!',
          characterEmoji: '👑💍🐻',
        },
      },
    ],
    {
      name: '친근한 매력 인재',
      emoji: '😊',
      card: {
        badgeTitle: '볼매 유망주',
        subTitle: '볼수록 진국인 매력 소유자',
        bubbleLeft: '스펙보다 깊은',
        bubbleRight: '내 진짜 매력을 봐!',
        characterEmoji: '😊🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 6. 내 소비 수준은 또래보다 얼마나 센가? (spending_style)
const spending_style: Topic = {
  id: 'spending_style',
  emoji: '💳',
  accent: '#ff477e',
  navTitle: '소비 수준',
  question: '한 달에 지르는 돈…\n내 소비 수준은 또래보다 셀까? 💳',
  teaser: '저축형 vs 경험소비형 vs 플렉스 과소비형 캐릭터 팩폭 🛍️',
  inputLabel: '한 달 총 소비 지출 (만원)',
  inputHint: '배달, 쇼핑, 카페, 생활비 포함 월 지출',
  min: 30,
  max: 1000,
  step: 10,
  default: 150,
  medianByAge: { '10s': 50, '20s': 120, '30s': 180, '40s': 230, '50s': 250, '60+': 160 },
  genderAdjust: {},
  sigma: 0.5,
  fmt: (v) => `${v.toLocaleString()}만원`,
  compareVerb: '소비가 많아요',
  resultTitle: (r) => `대한민국 또래 소비 수준\n상위 ${Math.round(r.topPercent)}%! 💳`,
  headline: (r) => `나는 또래 100명 중 ${r.peopleBelow}명보다 신나게 지르는 중 🛍️`,
  verdict: (r) =>
    r.diff >= 50
      ? '플렉스 과소비형 팩폭! 텅장 되지 않게 통장 관리에 주의하세요 🔥'
      : r.diff <= -30
        ? '알뜰살뜰 저축 수호형! 남들 지를 때 차곡차곡 잘 아끼네요 👍'
        : '딱 평균적인 무난한 소비형입니다!',
  labels: between(
    [
      {
        upTo: 15,
        name: '플렉스 과소비 마왕',
        emoji: '💸',
        card: {
          badgeTitle: '플렉스 과소비형',
          subTitle: '지르면 기분이 좋아지는 직진러',
          bubbleLeft: '돈은 쓰라고',
          bubbleRight: '버는 거잖아!',
          characterEmoji: '💸💳🐻',
        },
      },
      {
        upTo: 50,
        name: '경험 라이프 소비러',
        emoji: '🍹',
        card: {
          badgeTitle: '경험소비형',
          subTitle: '여행과 맛집에 돈 안 아끼는',
          bubbleLeft: '행복한 경험에',
          bubbleRight: '투자하는 인생!',
          characterEmoji: '🍹🐻',
        },
      },
    ],
    {
      name: '알뜰 자산 저축가',
      emoji: '🪙',
      card: {
        badgeTitle: '저축 수호형',
        subTitle: '남들 쓸 때 차곡차곡 아끼는',
        bubbleLeft: '아낀 만큼',
        bubbleRight: '시드머니로 직행!',
        characterEmoji: '🪙🐻',
      },
    },
  ),
}

export const TOPICS: Topic[] = [
  net_worth,
  dating_count,
  income_salary,
  ideal_match,
  marriage_rarity,
  spending_style,
]

export function topicById(id: string): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}


