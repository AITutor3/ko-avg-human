import type { Result } from './stats'
import { fmtDuration } from './stats'

// 상위 몇 %에 따라 별명 라벨 부여 (판정이 아니라 "위치 표시")
export function label(topPercent: number): { name: string; emoji: string } {
  if (topPercent <= 5) return { name: '심야 스크롤러 끝판왕', emoji: '🌌' }
  if (topPercent <= 15) return { name: '심야 스크롤러', emoji: '🌙' }
  if (topPercent <= 30) return { name: '손에서 폰이 잘 안 떨어지는 유형', emoji: '📱' }
  if (topPercent <= 45) return { name: '평균보다 살짝 위', emoji: '🙂' }
  if (topPercent <= 55) return { name: '거의 평균 인간', emoji: '⚖️' }
  if (topPercent <= 70) return { name: '평균보다 절제하는 편', emoji: '🌿' }
  if (topPercent <= 85) return { name: '디지털 미니멀 지향', emoji: '🍃' }
  return { name: '폰이랑 거리두기 고수', emoji: '🧘' }
}

export function headline(r: Result): string {
  const d = Math.abs(r.diffMin)
  if (r.diffMin >= 15) {
    return `나는 또래보다\n하루 ${fmtDuration(d)} 더 스마트폰을 본다`
  }
  if (r.diffMin <= -15) {
    return `나는 또래보다\n하루 ${fmtDuration(d)} 덜 스마트폰을 본다`
  }
  return `나는 또래 평균과\n거의 비슷하게 스마트폰을 본다`
}

export function verdict(r: Result): string {
  if (r.diffMin >= 15) return '평균보다 꽤 많이 사용하는 편이에요'
  if (r.diffMin <= -15) return '평균보다 적게 사용하는 편이에요'
  return '딱 평균에 가깝게 사용하고 있어요'
}

export function subline(r: Result): string {
  return `${r.model.label} 기준 · 상위 ${Math.round(r.topPercent)}%`
}

export function intuitiveLine(r: Result): string {
  return `비슷한 100명 중 ${r.peopleBelow}명보다 많이 봐요`
}
