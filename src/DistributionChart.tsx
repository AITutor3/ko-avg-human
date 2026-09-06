import { useMemo } from 'react'
import { densityCurve, type Result } from './stats'

interface Props {
  result: Result
  width?: number
  height?: number
  compact?: boolean
}

// 밀도곡선 + 평균선 + 내 위치 핀. "나까지"의 왼쪽 영역을 채워
// "여기까지가 나"를 직관적으로 보여준다.
export default function DistributionChart({
  result,
  width = 300,
  height = 160,
  compact = false,
}: Props) {
  const { model, value, topic } = result
  const accent = topic.accent
  const pad = { l: 8, r: 8, t: 16, b: compact ? 14 : 26 }

  const { xMax, maxY, points } = useMemo(() => {
    const c = densityCurve(model, topic.xMaxFactor ?? 3.4, 140)
    const my = Math.max(...c.points.map((p) => p.y))
    return { xMax: c.xMax, maxY: my, points: c.points }
  }, [model, topic])

  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const sx = (x: number) => pad.l + (Math.min(x, xMax) / xMax) * innerW
  const sy = (y: number) => pad.t + innerH - (y / maxY) * innerH

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(' ')

  const userX = sx(value)
  const meanX = sx(model.median)
  const baselineY = pad.t + innerH

  const leftPts = points.filter((p) => p.x <= value)
  const fill =
    `M${sx(0).toFixed(1)},${baselineY.toFixed(1)} ` +
    leftPts.map((p) => `L${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ') +
    ` L${userX.toFixed(1)},${baselineY.toFixed(1)} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`분포곡선에서 내 위치는 상위 ${Math.round(result.topPercent)}%`}
    >
      <path d={fill} fill={hexA(accent, 0.22)} />
      <path d={line} fill="none" stroke="#8a8a96" strokeWidth={2} />
      <line
        x1={meanX}
        y1={pad.t}
        x2={meanX}
        y2={baselineY}
        stroke="#6c8cff"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {!compact && (
        <text x={clampText(meanX, width)} y={pad.t - 5} fill="#6c8cff" fontSize={10} fontWeight={700} textAnchor="middle">
          평균 {topic.fmt(model.median)}
        </text>
      )}
      <line x1={userX} y1={pad.t - 2} x2={userX} y2={baselineY} stroke={accent} strokeWidth={2} />
      <circle cx={userX} cy={sy(interpY(points, value))} r={5} fill={accent} stroke="#fff" strokeWidth={2} />
      {!compact && (
        <text
          x={clampText(userX, width)}
          y={baselineY + 16}
          fill={accent}
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          나 {topic.fmt(value)}
        </text>
      )}
      <line x1={pad.l} y1={baselineY} x2={pad.l + innerW} y2={baselineY} stroke="#2a2a34" strokeWidth={1} />
    </svg>
  )
}

function interpY(points: { x: number; y: number }[], x: number): number {
  for (let i = 1; i < points.length; i++) {
    if (points[i].x >= x) {
      const a = points[i - 1]
      const b = points[i]
      const t = (x - a.x) / (b.x - a.x || 1)
      return a.y + t * (b.y - a.y)
    }
  }
  return points[points.length - 1].y
}

function clampText(x: number, w: number) {
  return Math.min(w - 26, Math.max(26, x))
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
