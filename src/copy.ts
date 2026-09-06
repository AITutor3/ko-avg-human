import type { Result } from './stats'

// 주제별 카피는 topics.ts 안에 있고, 여기서는 공통 포맷만 담당한다.
export const resultTitle = (r: Result) => r.topic.resultTitle(r)
export const headline = (r: Result) => r.topic.headline(r)
export const verdict = (r: Result) => r.topic.verdict(r)
export const label = (r: Result) => r.topic.labels(r.topPercent)

export const subline = (r: Result) =>
  `${r.model.label} 기준 🔥 상위 ${Math.round(r.topPercent)}%`

export const comprehensiveSummary = (r: Result) => {
  const lab = label(r)
  const medianFmt = r.topic.fmt(r.model.median)
  const valueFmt = r.topic.fmt(r.value)
  const diffFmt = r.topic.fmt(Math.abs(r.diff))
  const cardSub = lab.card?.subTitle ?? ''

  const compText =
    r.diff > 0
      ? `또래 평균보다 ${diffFmt} 더 높은 치수를 기록했어요!`
      : r.diff < 0
      ? `또래 평균보다 ${diffFmt} 더 신중하고 견고한 수치를 보이고 있어요.`
      : `또래 평균과 완벽하게 똑같은 수준이에요.`

  return `${r.model.label} 평균은 ${medianFmt}이며, 당신은 ${valueFmt}를 기록하여 ${compText} 당신의 유형은 [${lab.name}]으로 ${cardSub ? `'${cardSub}'` : ''} 특성을 가집니다. 남들과 비교해도 독보적인 매력을 가진 편인데, 혹시 잘 관리하며 만나는 편인가요? 😉`
}

