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
      style={{ overflow: 'visible' }}
    >
      {/* 1. 내 위치까지의 영역 채우기 (페이드인 애니메이션) */}
      <path
        d={fill}
        fill={hexA(accent, 0.22)}
        style={{
          animation: 'chart-fade 0.8s ease-out forwards',
          transformOrigin: 'bottom',
        }}
      />

      {/* 2. 분포곡선 라인 (드러나는 그리기 애니메이션) */}
      <path
        d={line}
        fill="none"
        stroke="#343a40"
        strokeWidth={2.8}
        strokeLinecap="round"
        style={{
          strokeDasharray: 600,
          strokeDashoffset: 600,
          animation: 'chart-draw 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        }}
      />

      {/* 3. 평균선 (점선 페이드인) */}
      <line
        x1={meanX}
        y1={pad.t}
        x2={meanX}
        y2={baselineY}
        stroke="#4c6ef5"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        style={{
          animation: 'chart-fade 0.6s ease-out 0.4s forwards',
          opacity: 0,
        }}
      />
      {!compact && (
        <text
          x={clampText(meanX, width)}
          y={pad.t - 5}
          fill="#4c6ef5"
          fontSize={10}
          fontWeight={700}
          textAnchor="middle"
          style={{
            animation: 'chart-fade 0.6s ease-out 0.4s forwards',
            opacity: 0,
          }}
        >
          평균 {topic.fmt(model.median)}
        </text>
      )}

      {/* 4. 내 위치 수직선 & 핀 포인트 (곡선이 그려진 후 톡 튀어나오는 팝 애니메이션) */}
      <line
        x1={userX}
        y1={pad.t - 2}
        x2={userX}
        y2={baselineY}
        stroke={accent}
        strokeWidth={2.5}
        style={{
          animation: 'chart-pin-line 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.9s forwards',
          transformOrigin: `center ${baselineY}px`,
          opacity: 0,
        }}
      />
      <circle
        cx={userX}
        cy={sy(interpY(points, value))}
        r={6}
        fill={accent}
        stroke="#fff"
        strokeWidth={2.5}
        style={{
          animation: 'chart-pin-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.0s forwards',
          transformOrigin: `${userX}px ${sy(interpY(points, value))}px`,
          opacity: 0,
        }}
      />
      {!compact && (
        <g
          style={{
            animation: 'chart-pin-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.1s forwards',
            transformOrigin: `${clampText(userX, width)}px ${baselineY + 16}px`,
            opacity: 0,
          }}
        >
          <rect
            x={clampText(userX, width) - 34}
            y={baselineY + 4}
            width={68}
            height={20}
            rx={10}
            fill={accent}
          />
          <text
            x={clampText(userX, width)}
            y={baselineY + 18}
            fill="#ffffff"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            나 {topic.fmt(value)}
          </text>
        </g>
      )}

      <line x1={pad.l} y1={baselineY} x2={pad.l + innerW} y2={baselineY} stroke="#ced4da" strokeWidth={1} />
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
