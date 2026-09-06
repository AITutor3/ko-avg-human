import type { Result } from './stats'

// 주제별 카피는 topics.ts 안에 있고, 여기서는 공통 포맷만 담당한다.
export const resultTitle = (r: Result) => r.topic.resultTitle(r)
export const headline = (r: Result) => r.topic.headline(r)
export const verdict = (r: Result) => r.topic.verdict(r)
export const label = (r: Result) => r.topic.labels(r.topPercent)

export const subline = (r: Result) =>
  `${r.model.label} 기준 · 상위 ${Math.round(r.topPercent)}%`

export const intuitiveLine = (r: Result) =>
  `비슷한 100명 중 ${r.peopleBelow}명보다 ${r.topic.compareVerb}`
