import type { AgeBucket, Gender, Result } from './stats'
import { fmtAsset, fmtDuration, fmtHours } from './stats'

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

  // 분포 모델 (단위는 주제 고유: 시간/분/권 등)
  medianByAge: Record<AgeBucket, number>
  genderAdjust: Partial<Record<Gender, Partial<Record<AgeBucket, number>>>>
  sigma: number
  floor?: number
  xMaxFactor?: number

  // 표시
  fmt: (v: number) => string
  compareVerb: string // "비슷한 100명 중 82명보다 {compareVerb}"

  // 카피 (판정이 아니라 위치 표시 톤)
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
// 1. 스마트폰 사용시간 (시간/일)
const smartphone: Topic = {
  id: 'smartphone',
  emoji: '📱',
  accent: '#ff5a5f',
  navTitle: '스마트폰 사용시간',
  question: '새벽 3시 스크롤러 덤벼라!\n나 폰중독일까 갓생러일까? 📱',
  teaser: '하루 몇 시간이나 폰 볼까? 스크린타임 깠더니 은근 충격 😱',
  inputLabel: '하루 평균 스마트폰 사용시간',
  inputHint: '스크린타임(iOS) / 디지털 웰빙(안드로이드) 팩폭 실측치',
  min: 0.5,
  max: 12,
  step: 0.5,
  default: 4,
  medianByAge: { '10s': 5.0, '20s': 4.5, '30s': 4.0, '40s': 3.4, '50s': 2.75, '60+': 2.0 },
  genderAdjust: {
    female: { '10s': 0.3, '20s': 0.3, '30s': 0.2 },
    male: { '40s': 0.2, '50s': 0.2, '60+': 0.2 },
  },
  sigma: 0.5,
  fmt: (v) => fmtHours(v),
  compareVerb: '많이 봐요',
  resultTitle: (r) =>
    r.diff >= 0.25
      ? '손에서 폰 안 떨어지는\n디지털 중독 경보! 🚨'
      : r.diff <= -0.25
        ? '현생에 집중하는\n갓생 미니멀리스트 🌿'
        : '딱 또래 표준!\n무난한 스마트폰 유저 ⚖️',
  headline: (r) =>
    r.diff >= 0.25
      ? `나는 또래보다 하루 ${fmtHours(r.diff)} 더 액정을 부수는 중 💥`
      : r.diff <= -0.25
        ? `나는 또래보다 하루 ${fmtHours(r.diff)} 덜 보고 현생 사는 중 🍃`
        : '나는 또래 평균과 거의 똑같이 폰 보는 중!',
  verdict: (r) =>
    r.diff >= 0.25
      ? '새벽 숏폼 중독 팩폭 당하셨네요! 눈 건강 챙기세요 👀'
      : r.diff <= -0.25
        ? '요즘 세상에 폰을 이렇게 안 보다니! 디지털 클린 인정 👍'
        : '남들 볼 만큼 딱 적당히 보고 계시네요!',
  labels: between(
    [
      {
        upTo: 5,
        name: '심야 스크롤러 끝판왕',
        emoji: '🌌',
        card: {
          badgeTitle: '불타는 액정',
          subTitle: '눈 붓고 충혈돼도 일단 스크롤',
          bubbleLeft: '새벽 3시인데..',
          bubbleRight: '숏폼 딱 하나만 더!',
          characterEmoji: '🔥📱🐻',
        },
      },
      {
        upTo: 15,
        name: '야행성 알고리즘 노예',
        emoji: '🌙',
        card: {
          badgeTitle: '알고리즘 억류자',
          subTitle: '자려다가 릴스에 감금당한',
          bubbleLeft: '이제 진짜 자자',
          bubbleRight: '어? 이거 꿀잼인데?',
          characterEmoji: '🌙🐻‍❄️',
        },
      },
      {
        upTo: 30,
        name: '손가락 자동 착붙형',
        emoji: '📱',
        card: {
          badgeTitle: '스마트폰 일체형',
          subTitle: '손가락이 뇌보다 빠르게 앱 켬',
          bubbleLeft: '내 폰 어디갔지?',
          bubbleRight: '손에 쥐고 있네?!',
          characterEmoji: '📱🐻',
        },
      },
      {
        upTo: 55,
        name: '황금 비율 현생러',
        emoji: '⚖️',
        card: {
          badgeTitle: '평균 황금비율',
          subTitle: '볼 만큼 보고 미련 없이 끔',
          bubbleLeft: '적당히 보고',
          bubbleRight: '현생 살러 출발!',
          characterEmoji: '⚖️🐻',
        },
      },
    ],
    {
      name: '디지털 득도 도인',
      emoji: '🧘',
      card: {
        badgeTitle: '디지털 미니멀',
        subTitle: '알림 따위에 흔들리지 않는 멘탈',
        bubbleLeft: '폰은 거들 뿐',
        bubbleRight: '내 시간이 최고지!',
        characterEmoji: '🧘🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 2. 출퇴근 시간 (편도 분)
const commute: Topic = {
  id: 'commute',
  emoji: '🚇',
  accent: '#6c8cff',
  navTitle: '출퇴근 시간',
  question: '매일 고통받는 지옥철…\n내 통근시간 진짜 제일 길까? 🚇',
  teaser: '슬세권 vs 2호선 지옥철 유랑러, 또래 팩폭 비교 🚌',
  inputLabel: '편도 출퇴근 시간',
  inputHint: '집 대문 나오는 순간부터 도착까지',
  min: 5,
  max: 120,
  step: 5,
  default: 40,
  medianByAge: { '10s': 25, '20s': 42, '30s': 46, '40s': 43, '50s': 38, '60+': 30 },
  genderAdjust: { male: { '30s': 3, '40s': 3 } },
  sigma: 0.55,
  fmt: (v) => fmtDuration(v),
  compareVerb: '오래 걸려요',
  resultTitle: (r) =>
    r.diff >= 5
      ? '지옥철 유랑자 확정!\n길에 버리는 시간 대박 😱'
      : r.diff <= -5
        ? '슬세권 축복 인생!\n시간 부자 승리자 🎉'
        : '대한민국 표준\n평범한 출퇴근길 🚶',
  headline: (r) =>
    r.diff >= 5
      ? `나는 또래보다 하루 왕복 ${fmtDuration(r.diff * 2)} 길에서 낭비 중 🚌`
      : r.diff <= -5
        ? '나는 또래보다 출퇴근 훨씬 짧아서 현생 개이득 🩴'
        : '나는 또래 평균만큼 왕복 통근하는 중!',
  verdict: (r) =>
    r.diff >= 5
      ? '길에서 버리는 시간이 엄청나네요! 팟캐스트 필수 🎧'
      : r.diff <= -5
        ? '출퇴근에 에너지 안 뺏기는 최고의 조건입니다 👏'
        : '대한민국 전형적인 직장인/학생 통근 코스군요!',
  labels: between(
    [
      {
        upTo: 10,
        name: '극한의 장거리 유랑자',
        emoji: '🛰️',
        card: {
          badgeTitle: '유랑하는 철도왕',
          subTitle: '지하철이 제2의 침실인 사람',
          bubbleLeft: '눈 뜨면 2호선',
          bubbleRight: '지옥철도 날 못 막아!',
          characterEmoji: '🚇🐻‍❄️',
        },
      },
      {
        upTo: 35,
        name: '길 위의 수호자',
        emoji: '🚌',
        card: {
          badgeTitle: '통근 만렙 전사',
          subTitle: '버스에서 꿀잠 자는 스킬 보유',
          bubbleLeft: '출퇴근 길에',
          bubbleRight: '유튜브 5편 시청',
          characterEmoji: '🚌🐻',
        },
      },
      {
        upTo: 60,
        name: '평범한 출퇴근 전사',
        emoji: '🚶',
        card: {
          badgeTitle: '표준 통근러',
          subTitle: '대한민국 어디서나 보이는',
          bubbleLeft: '무난하게 쓱',
          bubbleRight: '오늘도 칼퇴 도전!',
          characterEmoji: '🚶🐻',
        },
      },
    ],
    {
      name: '슬세권 승리자',
      emoji: '🩴',
      card: {
        badgeTitle: '직주근접 마스터',
        subTitle: '이동 시간 0분에 수렴하는',
        bubbleLeft: '가만히 앉아 있기엔',
        bubbleRight: '집이 너무 가까워!',
        characterEmoji: '🩴🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 3. 독서량 (월 권수)
const reading: Topic = {
  id: 'reading',
  emoji: '📚',
  accent: '#3ddc97',
  navTitle: '독서량',
  question: '책 안 읽는 한국 사회에서\n월 1권 อ่าน하면 상위 몇 %? 📚',
  teaser: '올해 완독 0권이어도 안심할 수 있는 이유 공개 📖',
  inputLabel: '한 달에 읽는 책',
  inputHint: '완독 기준, 웹소설·만화 제외 대략치',
  min: 0,
  max: 12,
  step: 0.5,
  default: 1,
  medianByAge: { '10s': 1.1, '20s': 0.9, '30s': 0.8, '40s': 0.7, '50s': 0.6, '60+': 0.5 },
  genderAdjust: { female: { '20s': 0.1, '30s': 0.1, '40s': 0.1 } },
  sigma: 0.95,
  floor: 0.1,
  xMaxFactor: 5,
  fmt: (v) => `월 ${v.toFixed(1)}권`,
  compareVerb: '많이 읽어요',
  resultTitle: (r) =>
    r.ratio >= 1.3
      ? '대한민국 희귀종!\n상위 10% 지식 포식자 🧠'
      : r.ratio <= 0.7
        ? '유튜브가 편한시대!\n완독 0권 클럽 당첨 💤'
        : '평균은 유지 중!\n가끔 책 펴는 유형 🔖',
  headline: (r) =>
    r.ratio >= 1.3
      ? `나는 또래 평균보다 무려 ${r.ratio.toFixed(1)}배 더 읽는 지성인 📖`
      : r.ratio <= 0.7
        ? '나는 책보다 영상이 편한 지극히 현대적인 인간 📺'
        : '나는 딱 대한민국 평균만큼 독서하는 중!',
  verdict: (r) =>
    r.ratio >= 1.3
      ? '요즘 세상에 이만큼 읽다니! 텍스트 뇌 대단합니다 💡'
      : r.ratio <= 0.7
        ? '괜찮아요! 원래 한국 성인 평균 독서량이 어마어마하게 낮습니다 😂'
        : '딱 남들 읽는 만큼 읽고 계시네요!',
  labels: between(
    [
      {
        upTo: 10,
        name: '텍스트 잡식 포식자',
        emoji: '🐉',
        card: {
          badgeTitle: '지식 지배자',
          subTitle: '책 냄새에 환장하는 진짜 지성인',
          bubbleLeft: '책장 폭발 직전',
          bubbleRight: '다음 지식 덤벼라!',
          characterEmoji: '📖📖🐻',
        },
      },
      {
        upTo: 40,
        name: '낭만 감성 독서가',
        emoji: '📖',
        card: {
          badgeTitle: '카페 독서왕',
          subTitle: '커피 한 잔과 완독의 여유',
          bubbleLeft: '커피와 책 한 권',
          bubbleRight: '이게 진짜 갓생이지!',
          characterEmoji: '☕📖🐻',
        },
      },
    ],
    {
      name: '올해 완독 0권 클럽',
      emoji: '💤',
      card: {
        badgeTitle: '영상파 수호자',
        subTitle: '유튜브 3분 요약이 최고 편함',
        bubbleLeft: '책 사놓기만 하고',
        bubbleRight: '베개로 쓰는 중!',
        characterEmoji: '💤🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 4. 수면시간 (시간/일)
const sleep: Topic = {
  id: 'sleep',
  emoji: '😴',
  accent: '#b98cff',
  navTitle: '수면시간',
  question: '내 만성 피로는 과학이었다?\n또래 수면시간 팩폭 비교 😴',
  teaser: '카페인 좀비 vs 꿀잠 드래곤, 내 진짜 피곤함의 원인은? ☕',
  inputLabel: '하루 평균 수면시간',
  inputHint: '실제로 누워서 잠든 시간 기준',
  min: 3,
  max: 10,
  step: 0.5,
  default: 6.5,
  medianByAge: { '10s': 7.2, '20s': 7.0, '30s': 6.8, '40s': 6.6, '50s': 6.6, '60+': 6.9 },
  genderAdjust: {},
  sigma: 0.16,
  xMaxFactor: 1.9,
  fmt: (v) => fmtHours(v),
  compareVerb: '오래 자요',
  resultTitle: (r) =>
    r.diff <= -0.4
      ? '만성 수면 부족!\n카페인으로 연명하는 좀비 ☕'
      : r.diff >= 0.4
        ? '침대 상위 1%!\n꿀잠 자는 잠 부자 🛌'
        : '대한민국 표준\n평범한 수면 패턴 ⏰',
  headline: (r) =>
    r.diff <= -0.4
      ? `나는 또래보다 하루 ${fmtHours(r.diff)} 덜 자서 피곤함 충족 🥱`
      : r.diff >= 0.4
        ? `나는 또래보다 하루 ${fmtHours(r.diff)} 더 잘 자는 침대 왕 👑`
        : '나는 또래 평균만큼 수면 취하는 중!',
  verdict: (r) =>
    r.diff <= -0.4
      ? '피곤한 이유가 확실했네요! 오늘 밤은 30분만 일찍 누워보세요 💤'
      : r.diff >= 0.4
        ? '수면 질이 좋으시군요! 최고의 면역력 보유자'
        : '무난하게 잘 자고 계시네요!',
  labels: between(
    [
      {
        upTo: 15,
        name: '꿀잠 자는 잠 부자',
        emoji: '🛌',
        card: {
          badgeTitle: '침대 드래곤',
          subTitle: '머리만 대면 3초 만에 딥슬립',
          bubbleLeft: '이불 속이',
          bubbleRight: '세계 최고 행복!',
          characterEmoji: '🛌🐻‍❄️',
        },
      },
      {
        upTo: 60,
        name: '표준 칼잠인',
        emoji: '⏰',
        card: {
          badgeTitle: '규칙적 수면가',
          subTitle: '알림 한 번에 깔끔하게 깨는',
          bubbleLeft: '개운한 아침',
          bubbleRight: '오늘도 파이팅!',
          characterEmoji: '⏰🐻',
        },
      },
    ],
    {
      name: '만성 수면 부족 카페인 좀비',
      emoji: '☕',
      card: {
        badgeTitle: '카페인 수혈자',
        subTitle: '혈관에 몬스터/아메리카노 흐름',
        bubbleLeft: '눈이 안 떠져..',
        bubbleRight: '스벅 아아 긴급 수혈!',
        characterEmoji: '☕🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 5. 1인가구 순자산 (만원)
const asset_single: Topic = {
  id: 'asset_single',
  emoji: '💰',
  accent: '#ffb703',
  navTitle: '1인가구 순자산',
  question: '솔직히 통장 잔고 깠을 때\n나 또래보다 모았을까? 💸',
  teaser: '1인가구 팩폭 자산 통계! 들으면 은근 멘붕 옴 😱',
  inputLabel: '순자산 (총자산 − 대출/부채)',
  inputHint: '예적금, 주식, 전세보증금에서 빚 뺀 진짜 내 돈',
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
  compareVerb: '많아요',
  resultTitle: (r) =>
    r.ratio >= 1.3
      ? '영앤리치 1인가구!\n통장 잔고 든든한 상위권 👑'
      : r.ratio <= 0.7
        ? '월급 스쳐 지나감!\n시드머니 모으기 시급 💸'
        : '또래 1인가구 평균!\n딱 남들 모은 만큼 모음 🏠',
  headline: (r) =>
    r.ratio >= 1.3
      ? `나는 또래 1인가구 평균보다 무려 ${r.ratio.toFixed(1)}배 더 끌어모았다 💰`
      : r.ratio <= 0.7
        ? '나는 또래 1인가구 평균보다 아직 아담하게 모은 편!'
        : '나는 또래 1인가구 평균과 거의 동일하다!',
  verdict: (r) =>
    r.ratio >= 1.3
      ? '알뜰살뜰 진짜 잘 모으셨네요! 1인가구 재테크 마스터 인정 👍'
      : r.ratio <= 0.7
        ? '괜찮아요! 독립 초기엔 지출이 많아서 다들 이래요. 이제부터 모으면 됨!'
        : '딱 안정적인 연령대 평균 순자산이에요!',
  labels: between(
    [
      {
        upTo: 10,
        name: '영앤리치 1인가구',
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
        upTo: 35,
        name: '알뜰살뜰 저축왕',
        emoji: '💎',
        card: {
          badgeTitle: '시드머니 다람쥐',
          subTitle: '적금/주식 알차게 구굴리는 갓생러',
          bubbleLeft: '차곡차곡 모아서',
          bubbleRight: '내 집 마련 가자!',
          characterEmoji: '💎🐻',
        },
      },
      {
        upTo: 65,
        name: '평범한 자립 독립러',
        emoji: '🏠',
        card: {
          badgeTitle: '자립형 1인가구',
          subTitle: '월세/전세 무난하게 내며 생활',
          bubbleLeft: '오늘 저녁은',
          bubbleRight: '나에게 주는 선물!',
          characterEmoji: '🏠🐻',
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
        bubbleRight: '퍼가요~ 어디 갔지?',
        characterEmoji: '🌱🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 6. 키 (cm)
const height: Topic = {
  id: 'height',
  emoji: '📏',
  accent: '#4cc9f0',
  navTitle: '키 (신장)',
  question: '맨발 키 팩폭 측정!\n내 피지컬 키는 상위 몇 %? 📏',
  teaser: '8차 한국인 인체치수 데이터 1초 비교 🦒',
  inputLabel: '신장 (cm)',
  inputHint: '까치발 금지! 맨발 측정치 입력',
  min: 140,
  max: 200,
  step: 1,
  default: 170,
  medianByAge: { '10s': 167, '20s': 168, '30s': 168, '40s': 166, '50s': 164, '60+': 161 },
  genderAdjust: {
    female: { '10s': -6, '20s': -6.5, '30s': -6, '40s': -6, '50s': -6, '60+': -6.5 },
    male: { '10s': 6, '20s': 6.5, '30s': 6.5, '40s': 6.5, '50s': 6.5, '60+': 6.5 },
  },
  sigma: 0.04,
  fmt: (v) => `${v}cm`,
  compareVerb: '큽니다',
  resultTitle: (r) =>
    r.diff >= 3
      ? '우월한 위쪽 공기!\n피지컬 상위권 당첨 🦒'
      : r.diff <= -3
        ? '귀요미 찰떡 비율!\n주머니 쏙 큐트형 🐣'
        : '황금 비율 표준 키!\n호불호 없는 키 📐',
  headline: (r) =>
    r.diff >= 3
      ? `나는 또래 평균보다 무려 ${r.diff.toFixed(1)}cm 더 우뚝 솟아 있다 🦒`
      : r.diff <= -3
        ? `나는 또래 평균보다 ${Math.abs(r.diff).toFixed(1)}cm 아담해서 귀여움 폭발 🐣`
        : '나는 또래 평균 키와 완전 딱 맞는다!',
  verdict: (r) =>
    r.diff >= 3
      ? '지하철 손잡이 높이가 시시한 피지컬 보유자!'
      : r.diff <= -3
        ? '아기자기 귀여운 비율! 소장 욕구 자극하는 매력'
        : '어떤 옷을 입어도 핏이 예쁘게 떨어지는 표준 키!',
  labels: between(
    [
      {
        upTo: 10,
        name: '우월한 거인 피지컬',
        emoji: '🦒',
        card: {
          badgeTitle: '위쪽 공기 당첨',
          subTitle: '가만히 서 있어도 멀리서 보임',
          bubbleLeft: '위쪽 공기는',
          bubbleRight: '시원하고 좋네!',
          characterEmoji: '🦒🔥🐻',
        },
      },
      {
        upTo: 35,
        name: '훤칠한 모델 핏',
        emoji: '✨',
        card: {
          badgeTitle: '황금 비율러',
          subTitle: '롱패딩 입어도 안 질 끌리는',
          bubbleLeft: '서 있기만 해도',
          bubbleRight: '모델 포스 뿜뿜!',
          characterEmoji: '✨🐻',
        },
      },
      {
        upTo: 65,
        name: '황금 표준 키',
        emoji: '📐',
        card: {
          badgeTitle: '황금 밸런스',
          subTitle: '모든 브랜드 프리사이즈 찰떡',
          bubbleLeft: '가장 많은',
          bubbleRight: '사랑을 받는 키!',
          characterEmoji: '📐🐻',
        },
      },
    ],
    {
      name: '포켓 큐트 귀요미',
      emoji: '🐣',
      card: {
        badgeTitle: '포켓형 귀요미',
        subTitle: '주머니에 쏙 넣고 다니고 싶은',
        bubbleLeft: '작지만 아주',
        bubbleRight: '매력 폭발이지!',
        characterEmoji: '🐣🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 7. 몸무게 (kg)
const weight: Topic = {
  id: 'weight',
  emoji: '⚖️',
  accent: '#f72585',
  navTitle: '몸무게 (체중)',
  question: '건강검진 체중 팩폭 데이터!\n내 몸무게 위치는 어디쯤? ⚖️',
  teaser: '은근 묵직한 내 체중 vs 국민건강보험 공단 통계 🏋️',
  inputLabel: '체중 (kg)',
  inputHint: '아침 공복 직후 리얼 측정치',
  min: 35,
  max: 130,
  step: 1,
  default: 68,
  medianByAge: { '10s': 60, '20s': 67, '30s': 70, '40s': 70, '50s': 68, '60+': 65 },
  genderAdjust: {
    female: { '10s': -8, '20s': -9, '30s': -10, '40s': -9, '50s': -8, '60+': -7 },
    male: { '10s': 8, '20s': 9, '30s': 10, '40s': 9, '50s': 8, '60+': 7 },
  },
  sigma: 0.15,
  fmt: (v) => `${v}kg`,
  compareVerb: '체중이 나갑니다',
  resultTitle: (r) =>
    r.diff >= 4
      ? '불타는 강철 피지컬!\n든든 묵직 헤비급 🏋️'
      : r.diff <= -4
        ? '바람 부면 날아갈 뻔!\n슬림한 페더급 🪶'
        : '대한민국 건강 표준!\n무난한 웰빙 체중 🥗',
  headline: (r) =>
    r.diff >= 4
      ? `나는 또래 평균보다 ${r.diff.toFixed(1)}kg 더 나가는 든든 피지컬 🏋️`
      : r.diff <= -4
        ? `나는 또래 평균보다 ${Math.abs(r.diff).toFixed(1)}kg 가벼운 슬림형 🪶`
        : '나는 또래 평균 체중과 완전 동일!',
  verdict: (r) =>
    r.diff >= 4
      ? '근육량이 많거나 남다른 파워 보유자! 좋아하면 직진 💥'
      : r.diff <= -4
        ? '가벼워서 날아갈 것 같은 가녀린 체중 보유자!'
        : '건강하게 관리 잘하고 계시네요!',
  labels: between(
    [
      {
        upTo: 10,
        name: '불타는 강철 헤비급',
        emoji: '🏋️',
        card: {
          badgeTitle: '불타는 강철',
          subTitle: '좋아하면 일단 직진하는 든든함',
          bubbleLeft: '가만히 앉아 있기엔',
          bubbleRight: '내 힘이 너무 넘쳐!',
          characterEmoji: '🏋️🔥🐻',
        },
      },
      {
        upTo: 40,
        name: '듬직한 곰돌이 피지컬',
        emoji: '🐻',
        card: {
          badgeTitle: '듬직한 포옹왕',
          subTitle: '안아주면 포근함 200% 폭발',
          bubbleLeft: '맛있는 음식 앞엔',
          bubbleRight: '장사 없다!',
          characterEmoji: '🍗🐻',
        },
      },
      {
        upTo: 75,
        name: '건강 유지 유지가',
        emoji: '⚖️',
        card: {
          badgeTitle: '표준 밸런서',
          subTitle: '잘 먹고 유산소도 적당히 하는',
          bubbleLeft: '오늘도 건강하게',
          bubbleRight: '잘 먹고 살자!',
          characterEmoji: '🥗🐻',
        },
      },
    ],
    {
      name: '슬림 페더급',
      emoji: '🪶',
      card: {
        badgeTitle: '바람에 나부끼는',
        subTitle: '강풍 불면 기둥 잡아야 하는',
        bubbleLeft: '살 좀 찌워라~',
        bubbleRight: '소리 매일 들음!',
        characterEmoji: '🪶🐻',
      },
    },
  ),
}

// ─────────────────────────────────────────────────────────
// 8. 누적 연애 횟수 (회)
const dating_count: Topic = {
  id: 'dating_count',
  emoji: '❤️',
  accent: '#ff4d6d',
  navTitle: '연애 횟수',
  question: '지나간 연애 경험 깠다!\n내 연애 횟수는 상위 몇 %? ❤️',
  teaser: '불타는 직진 사랑꾼 vs 단일 순정파 팩폭 데이터 💘',
  inputLabel: '총 연애 횟수 (회)',
  inputHint: '엑스(Ex) 연인 총합 수치',
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
  resultTitle: (r) =>
    r.diff >= 1.5
      ? '불타는 직진 사랑꾼!\n연애 경험 만렙 💘'
      : r.diff <= -1.5
        ? '한 사람만 깊게 보는\n진국 순정파 💌'
        : '또래 평균적인\n무난한 연애 경험 🌹',
  headline: (r) =>
    r.diff >= 1.5
      ? `나는 또래 평균보다 ${Math.round(r.diff)}회 더 사랑해본 직진 러버 💘`
      : r.diff <= -1.5
        ? '나는 연애 횟수보다 깊은 진심에 집중해온 타입!'
        : '나는 딱 또래 평균만큼 연애해 보았다!',
  verdict: (r) =>
    r.diff >= 1.5
      ? '사랑 앞에 망설임 없이 직진했던 열정파! 우리 사랑이 너무 뜨거워 🔥'
      : r.diff <= -1.5
        ? '한 번 만나면 길고 진하게 다 퍼주는 스타일이군요!'
        : '평균적이고 원만한 연애 경험을 쌓아오셨네요!',
  labels: between(
    [
      {
        upTo: 10,
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
        upTo: 40,
        name: '로맨틱 챔피언',
        emoji: '🌹',
        card: {
          badgeTitle: '연애 고수',
          subTitle: '진심과 밀당 타이밍을 아는',
          bubbleLeft: '사랑은 항상',
          bubbleRight: '달콤하고 솔직하게!',
          characterEmoji: '🌹🐻',
        },
      },
      {
        upTo: 75,
        name: '진국 장수 연애파',
        emoji: '💌',
        card: {
          badgeTitle: '진국 러버',
          subTitle: '한 번 시작하면 끝까지 가는',
          bubbleLeft: '횟수보다 중요한 건',
          bubbleRight: '진심 어린 마음!',
          characterEmoji: '💌🐻',
        },
      },
    ],
    {
      name: '철벽 단일 순정파',
      emoji: '🛡️',
      card: {
        badgeTitle: '순백의 지키미',
        subTitle: '진짜 운명의 인연만 기다리는',
        bubbleLeft: '내 진짜 인연은',
        bubbleRight: '곧 나타날 거야!',
        characterEmoji: '🛡️🐻',
      },
    },
  ),
}

export const TOPICS: Topic[] = [
  smartphone,
  commute,
  reading,
  sleep,
  asset_single,
  height,
  weight,
  dating_count,
]

export function topicById(id: string): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}

