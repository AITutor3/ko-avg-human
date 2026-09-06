import type { AgeBucket, Gender, Result } from './stats'
import { fmtDuration, fmtHours } from './stats'

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
  labels: (topPercent: number) => { name: string; emoji: string }
}

const between =
  (
    bands: { upTo: number; name: string; emoji: string }[],
    fallback: { name: string; emoji: string },
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
  question: '나는 한국인 평균보다\n스마트폰을 많이 볼까?',
  teaser: '하루에 몇 시간이나 폰을 볼까. 은근 충격',
  inputLabel: '하루 평균 스마트폰 사용시간',
  inputHint: '스크린타임(iOS) / 디지털 웰빙(안드로이드)에서 확인',
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
      ? '평균보다 스마트폰을\n더 많이 봅니다'
      : r.diff <= -0.25
        ? '평균보다 스마트폰을\n덜 봅니다'
        : '거의 평균에\n가깝습니다',
  headline: (r) =>
    r.diff >= 0.25
      ? `나는 또래보다\n하루 ${fmtHours(r.diff)} 더 스마트폰을 본다`
      : r.diff <= -0.25
        ? `나는 또래보다\n하루 ${fmtHours(r.diff)} 덜 스마트폰을 본다`
        : '나는 또래 평균과\n거의 비슷하게 폰을 본다',
  verdict: (r) =>
    r.diff >= 0.25
      ? '평균보다 꽤 많이 사용하는 편이에요'
      : r.diff <= -0.25
        ? '평균보다 적게 사용하는 편이에요'
        : '딱 평균에 가깝게 사용하고 있어요',
  labels: between(
    [
      { upTo: 5, name: '심야 스크롤러 끝판왕', emoji: '🌌' },
      { upTo: 15, name: '심야 스크롤러', emoji: '🌙' },
      { upTo: 30, name: '손에서 폰이 잘 안 떨어지는 유형', emoji: '📱' },
      { upTo: 45, name: '평균보다 살짝 위', emoji: '🙂' },
      { upTo: 55, name: '거의 평균 인간', emoji: '⚖️' },
      { upTo: 70, name: '평균보다 절제하는 편', emoji: '🌿' },
      { upTo: 85, name: '디지털 미니멀 지향', emoji: '🍃' },
    ],
    { name: '폰이랑 거리두기 고수', emoji: '🧘' },
  ),
}

// ─────────────────────────────────────────────────────────
// 2. 출퇴근 시간 (편도 분)
const commute: Topic = {
  id: 'commute',
  emoji: '🚇',
  accent: '#6c8cff',
  navTitle: '출퇴근 시간',
  question: '내 출퇴근은\n또래보다 긴 편일까?',
  teaser: '내가 이렇게 힘든 게 맞았구나',
  inputLabel: '편도 출퇴근 시간',
  inputHint: '집 문 앞부터 회사·학교 도착까지',
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
      ? '또래보다 통근이\n긴 편입니다'
      : r.diff <= -5
        ? '또래보다 통근이\n짧은 편입니다'
        : '또래 평균과\n비슷합니다',
  headline: (r) =>
    r.diff >= 5
      ? `내 출퇴근은 또래보다\n하루 왕복 ${fmtDuration(r.diff * 2)} 더 길다`
      : r.diff <= -5
        ? '내 출퇴근은 또래보다\n짧은 편이다'
        : '내 출퇴근은 또래\n평균과 비슷하다',
  verdict: (r) =>
    r.diff >= 5
      ? '꽤 긴 편이에요. 고생이 많으시네요'
      : r.diff <= -5
        ? '짧은 편이에요. 시간 부자'
        : '평균적인 통근 시간이에요',
  labels: between(
    [
      { upTo: 5, name: '극한의 장거리 통근러', emoji: '🛰️' },
      { upTo: 15, name: '이동형 인간', emoji: '🚄' },
      { upTo: 35, name: '출퇴근 장거리러', emoji: '🚌' },
      { upTo: 55, name: '평범한 통근러', emoji: '🚶' },
      { upTo: 80, name: '가까운 편', emoji: '🏠' },
    ],
    { name: '슬세권 거주자', emoji: '🩴' },
  ),
}

// ─────────────────────────────────────────────────────────
// 3. 독서량 (월 권수)
const reading: Topic = {
  id: 'reading',
  emoji: '📚',
  accent: '#3ddc97',
  navTitle: '독서량',
  question: '책 안 읽는 사회에서\n나는 어디쯤일까?',
  teaser: '자랑해도 되는 결과일지도',
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
      ? '평균보다\n훨씬 많이 읽습니다'
      : r.ratio <= 0.7
        ? '평균보다\n적게 읽습니다'
        : '평균과\n비슷하게 읽습니다',
  headline: (r) =>
    r.ratio >= 1.3
      ? `나는 또래 평균보다\n${r.ratio.toFixed(1)}배 더 읽는다`
      : r.ratio <= 0.7
        ? '나는 또래 평균보다\n덜 읽는다'
        : '나는 또래 평균만큼\n읽는다',
  verdict: (r) =>
    r.ratio >= 1.3
      ? '상위권 다독가예요'
      : r.ratio <= 0.7
        ? '요즘 다들 이래요. 평균이 원래 낮아요'
        : '딱 평균 정도 읽고 있어요',
  labels: between(
    [
      { upTo: 3, name: '텍스트 포식자', emoji: '🐉' },
      { upTo: 10, name: '책벌레', emoji: '🐛' },
      { upTo: 25, name: '책 좀 읽는 편', emoji: '📖' },
      { upTo: 50, name: '가끔 읽는 편', emoji: '🔖' },
      { upTo: 80, name: '유튜브가 더 편한 편', emoji: '📺' },
    ],
    { name: '올해 완독 0권 클럽', emoji: '💤' },
  ),
}

// ─────────────────────────────────────────────────────────
// 4. 수면시간 (시간/일)
const sleep: Topic = {
  id: 'sleep',
  emoji: '😴',
  accent: '#b98cff',
  navTitle: '수면시간',
  question: '나는 또래보다\n잘 자는 편일까?',
  teaser: '내 피곤함은 근거가 있었다',
  inputLabel: '하루 평균 수면시간',
  inputHint: '실제로 잠든 시간 기준 대략치',
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
      ? '또래보다\n적게 잡니다'
      : r.diff >= 0.4
        ? '또래보다\n많이 잡니다'
        : '또래 평균만큼\n잡니다',
  headline: (r) =>
    r.diff <= -0.4
      ? `나는 또래보다\n하루 ${fmtHours(r.diff)} 덜 잔다`
      : r.diff >= 0.4
        ? `나는 또래보다\n하루 ${fmtHours(r.diff)} 더 잔다`
        : '나는 또래 평균만큼\n잔다',
  verdict: (r) =>
    r.diff <= -0.4
      ? '수면 부족인 편이에요. 근거 있는 피곤함'
      : r.diff >= 0.4
        ? '잘 자는 편이에요'
        : '평균적인 수면이에요',
  labels: between(
    [
      { upTo: 8, name: '잠 부자', emoji: '🛌' },
      { upTo: 30, name: '푹 자는 편', emoji: '😌' },
      { upTo: 60, name: '평균 수면형', emoji: '⏰' },
      { upTo: 82, name: '살짝 수면 부족형', emoji: '🥱' },
    ],
    { name: '만성 수면 부족형', emoji: '☕' },
  ),
}

export const TOPICS: Topic[] = [smartphone, commute, reading, sleep]

export function topicById(id: string): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}
