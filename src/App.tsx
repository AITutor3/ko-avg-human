import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  computeResult,
  type AgeBucket,
  type Gender,
  type Result,
} from './stats'
import { TOPICS, type Topic } from './topics'
import { headline, intuitiveLine, subline, verdict } from './copy'
import DistributionChart from './DistributionChart'
import TypeResultCard from './TypeResultCard'

type Stage = 'landing' | 'input' | 'analyzing' | 'chart'

export default function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [age, setAge] = useState<AgeBucket | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [value, setValue] = useState(4)

  const result = useMemo<Result | null>(
    () => (topic && age && gender ? computeResult(topic, age, gender, value) : null),
    [topic, age, gender, value],
  )

  function pick(t: Topic) {
    setTopic(t)
    setValue(t.default)
    setStage('input')
  }

  const accentStyle = topic ? ({ ['--accent' as string]: topic.accent } as React.CSSProperties) : undefined

  return (
    <div style={accentStyle} className="app-root">
      {stage === 'landing' && <Landing onPick={pick} />}
      {stage === 'input' && topic && (
        <InputScreen
          topic={topic}
          age={age}
          gender={gender}
          value={value}
          setAge={setAge}
          setGender={setGender}
          setValue={setValue}
          onBack={() => setStage('landing')}
          onNext={() => setStage('analyzing')}
        />
      )}
      {stage === 'analyzing' && result && (
        <Analyzing
          result={result}
          onDone={() => {
            setStage('chart')
          }}
        />
      )}
      {stage === 'chart' && result && (
        <ChartScreen
          result={result}
          onRestart={() => setStage('landing')}
        />
      )}
    </div>
  )
}

function HeaderBar() {
  return (
    <header className="pm-header">
      <div className="pm-logo">
        <span className="pm-logo-text">평균인간</span>
      </div>
    </header>
  )
}

function Landing({ onPick }: { onPick: (t: Topic) => void }) {
  const [heroIdx, setHeroIdx] = useState(0)

  // 조회수 순 TOP 3 주제 필터링
  const top3Topics = useMemo(() => {
    return [...TOPICS].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 3)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % top3Topics.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [top3Topics.length])

  const currentTopic = top3Topics[heroIdx]

  return (
    <div className="screen pm-landing-screen">
      <HeaderBar />

      {/* 1. 상단 핑크 팝 메인 배너 (조회수 Top 3 순환 배너) */}
      <section className="pm-hero-section">
        <div className="pm-hero-card">
          <div className="pm-card-window">
            <div className="pm-window-header">
              <span className="window-btn" />
              <span className="window-btn" />
            </div>

            <div className="pm-card-content">
              <div className="pm-card-left">
                <div className="pm-card-badge">🔥 실시간 인기 TOP {heroIdx + 1}</div>
                <h1 className="pm-card-title">{currentTopic.question}</h1>
                <p className="pm-card-sub">{currentTopic.teaser}</p>

                <button className="pm-play-btn" onClick={() => onPick(currentTopic)}>
                  <span>플레이 하러가기 (▷ {currentTopic.viewsCount}만)</span>
                  <span>→</span>
                </button>
              </div>

              <div className="pm-card-right">
                <div className="pm-character-box">
                  <div className="pm-heart-icon">💖</div>
                  <div className="pm-bear-avatar">{currentTopic.emoji}</div>
                </div>

                <div className="pm-stats-box">
                  <div className="pm-stat-row">
                    <span>조회수</span>
                    <span>▷ {currentTopic.viewsCount}만회</span>
                  </div>
                  <div className="pm-stat-row">
                    <span>공감력 ★★★★★</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-page-badge">
              {heroIdx + 1} / {top3Topics.length}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 하단 전체 심테 가로 스크롤 카드 행 */}
      <section className="pm-section">
        <div className="pm-section-header">
          <h2>🔥 인기 심테 랭킹</h2>
        </div>

        <div className="pm-horizontal-scroll">
          {TOPICS.map((t) => (
            <div className="pm-test-card" key={t.id} onClick={() => onPick(t)}>
              <div className="pm-thumb-box" style={{ ['--accent-color' as string]: t.accent } as React.CSSProperties}>
                <div className="pm-thumb-emoji">{t.emoji}</div>
                <div className="pm-thumb-title">{t.navTitle}</div>
                <div className="pm-thumb-mini-stats">
                  <span>▷ {t.viewsCount}만회</span>
                </div>
              </div>
              <div className="pm-test-title">{t.question.split('\n')[0]}</div>
              <div className="pm-test-views">
                <span>▷</span> {t.viewsCount}만 참여
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 인기 팩폭 심테 2열 카드 섹션 */}
      <section className="pm-section" style={{ marginTop: 24, marginBottom: 20 }}>
        <div className="pm-section-header">
          <h2>🎯 전체 팩폭 테스트 목록</h2>
        </div>
        <div className="pm-grid-2col">
          {TOPICS.map((t) => (
            <div className="pm-grid-item" key={t.id} onClick={() => onPick(t)}>
              <div className="pm-grid-thumb" style={{ background: t.accent }}>
                <span>{t.emoji}</span>
              </div>
              <div className="pm-grid-info">
                <div className="pm-grid-title">{t.navTitle}</div>
                <div className="pm-grid-desc">▷ {t.viewsCount}만회 참여</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function InputScreen({
  topic,
  age,
  gender,
  value,
  setAge,
  setGender,
  setValue,
  onBack,
  onNext,
}: {
  topic: Topic
  age: AgeBucket | null
  gender: Gender | null
  value: number
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  setValue: (v: number) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="screen">
      <button className="link-back" onClick={onBack}>
        ← 다른 주제 고르기
      </button>
      <div className="brand" style={{ marginTop: 6 }}>
        {topic.emoji} {topic.navTitle}
      </div>
      <h1 style={{ fontSize: 21, marginTop: 14 }}>{topic.question}</h1>

      <div className="field">
        <label>나이대 선택</label>
        <div className="chips">
          {AGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`chip${age === o.value ? ' on' : ''}`}
              onClick={() => setAge(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>성별 선택</label>
        <div className="chips">
          {GENDER_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`chip${gender === o.value ? ' on' : ''}`}
              onClick={() => setGender(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>{topic.inputLabel}</label>
        <div className="slider-row">
          <span className="slider-val">{topic.fmt(value)}</span>
        </div>
        <input
          type="range"
          min={topic.min}
          max={topic.max}
          step={topic.step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <p className="intuitive">{topic.inputHint}</p>
      </div>

      <div className="spacer" />
      <button className="btn" disabled={!age || !gender} onClick={onNext}>
        🔥 팩폭 결과 확인하기
      </button>
    </div>
  )
}

const STEPS = [
  '비슷한 조건 또래 팩폭 데이터 추출 중… 📊',
  '분포곡선 위에서 내 리얼 위치 검색 중… 🔍',
  '팩폭 결과 준비 완료! 멘탈 잡으세요 💥',
]

function Analyzing({ result, onDone }: { result: Result; onDone: () => void }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setI(1), 750)
    const t2 = setTimeout(() => setI(2), 1500)
    const t3 = setTimeout(onDone, 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])
  return (
    <div className="screen analyzing">
      <div className="ring" />
      <div style={{ fontWeight: 800 }}>{result.model.label} 기준 팩폭 분석 중</div>
      <div className="step">{STEPS[i]}</div>
    </div>
  )
}

function ChartScreen({
  result,
  onRestart,
}: {
  result: Result
  onRestart: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function render(): Promise<Blob | null> {
    if (!cardRef.current) return null
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
    const res = await fetch(dataUrl)
    return res.blob()
  }

  async function onShare() {
    setBusy(true)
    setMsg('')
    try {
      const blob = await render()
      if (!blob) return
      const file = new File([blob], 'peunggyun-ingane.png', { type: 'image/png' })
      const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: '나 이거 해봤는데 진짜 팩폭 당함😱 너는 상위 몇 % 나와?' })
      } else {
        downloadBlob(blob)
        setMsg('이미지를 저장했어요. 스토리·피드에 자랑해보세요!')
      }
    } catch {
      setMsg('공유가 취소됐어요.')
    } finally {
      setBusy(false)
    }
  }

  async function onSave() {
    setBusy(true)
    setMsg('')
    try {
      const blob = await render()
      if (blob) {
        downloadBlob(blob)
        setMsg('이미지를 저장했어요.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen" style={{ padding: '16px 12px' }}>
      {/* 바깥 상단 중복 텍스트 제거 및 깔끔한 단일 카드 레이아웃 */}
      <div className="card-wrap" style={{ marginTop: 0 }}>
        <ShareCard result={result} innerRef={cardRef} />
      </div>

      <div className="stack" style={{ marginTop: 20 }}>
        <button className="btn" disabled={busy} onClick={onShare}>
          {busy ? '카드 생성 중…' : '🚀 친구 단톡방에 팩폭 결과 공유하기'}
        </button>
        <button className="btn ghost" disabled={busy} onClick={onSave}>
          💾 카드 이미지 저장하기
        </button>
      </div>
      {msg && <p className="mini-hint">{msg}</p>}

      <div className="spacer" style={{ minHeight: 20 }} />
      <button className="btn ghost" onClick={onRestart} style={{ marginBottom: 12 }}>
        🔄 다른 테스트도 해보기
      </button>
    </div>
  )
}

function ShareCard({
  result,
  innerRef,
}: {
  result: Result
  innerRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div className="card" ref={innerRef} style={{ ['--accent' as string]: result.topic.accent } as React.CSSProperties}>
      <div className="c-brand">평균인간 · {result.topic.navTitle}</div>
      <h2 className="c-head" style={{ marginTop: 8 }}>{headline(result)}</h2>
      <div className="c-sub" style={{ marginTop: 4, marginBottom: 8 }}>
        {subline(result)}
      </div>

      <div style={{ marginTop: 10 }}>
        <DistributionChart result={result} width={290} height={125} compact />
      </div>

      <div style={{ marginTop: 12 }}>
        <TypeResultCard result={result} />
      </div>

      {/* 수치 3열 박스도 바깥 카드 안으로 포함 */}
      <div className="stats" style={{ marginTop: 12 }}>
        <div className="stat">
          <b>{result.topic.fmt(result.model.median)}</b>
          <span>또래 평균</span>
        </div>
        <div className="stat">
          <b>{result.topic.fmt(result.value)}</b>
          <span>나</span>
        </div>
        <div className="stat">
          <b>
            {result.diff >= 0 ? '+' : '−'}
            {result.topic.fmt(Math.abs(result.diff))}
          </b>
          <span>차이</span>
        </div>
      </div>

      <div className="verdict" style={{ marginTop: 14, textAlign: 'center', fontSize: 14, fontWeight: 800 }}>
        {verdict(result)}
      </div>
      <div className="intuitive" style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>
        {intuitiveLine(result)}
      </div>

      <div className="c-cta" style={{ marginTop: 16 }}>너는 상위 몇 %야? · 평균인간에서 확인</div>
    </div>
  )
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'peunggyun-ingane.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

