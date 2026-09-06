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
import { headline, intuitiveLine, resultTitle, subline, verdict } from './copy'
import DistributionChart from './DistributionChart'
import TypeResultCard from './TypeResultCard'

import { computeOverallUniqueness } from './stats'
import { OverallResultCard } from './OverallResultCard'

type Stage = 'landing' | 'input' | 'analyzing' | 'chart' | 'card' | 'spread' | 'overall'

export default function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [age, setAge] = useState<AgeBucket | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [value, setValue] = useState(4)
  const [historyResults, setHistoryResults] = useState<Result[]>([])

  const result = useMemo<Result | null>(
    () => (topic && age && gender ? computeResult(topic, age, gender, value) : null),
    [topic, age, gender, value],
  )

  const overallUniqueness = useMemo(
    () => (historyResults.length > 0 ? computeOverallUniqueness(historyResults) : null),
    [historyResults],
  )

  function pick(t: Topic) {
    setTopic(t)
    setValue(t.default)
    setStage('input')
  }

  function handleResultComplete(newResult: Result) {
    setHistoryResults((prev) => {
      const filtered = prev.filter((r) => r.topic.id !== newResult.topic.id)
      return [...filtered, newResult]
    })
  }

  const accentStyle = topic ? ({ ['--accent' as string]: topic.accent } as React.CSSProperties) : undefined

  return (
    <div style={accentStyle} className="app-root">
      {stage === 'landing' && (
        <Landing
          onPick={pick}
          historyCount={historyResults.length}
          onViewOverall={() => setStage('overall')}
        />
      )}
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
            handleResultComplete(result)
            setStage('chart')
          }}
        />
      )}
      {stage === 'chart' && result && (
        <ChartScreen
          result={result}
          historyCount={historyResults.length}
          onNext={() => setStage('card')}
          onViewOverall={() => setStage('overall')}
        />
      )}
      {stage === 'card' && result && (
        <CardScreen
          result={result}
          onNext={() => setStage('spread')}
          onViewOverall={() => setStage('overall')}
        />
      )}
      {stage === 'overall' && overallUniqueness && (
        <div className="screen">
          <button className="link-back" onClick={() => setStage('landing')}>
            ← 메인으로 돌아가기
          </button>
          <OverallResultCard
            overall={overallUniqueness}
            onReset={() => {
              setHistoryResults([])
              setStage('landing')
            }}
          />
        </div>
      )}
      {stage === 'spread' && (
        <Spread
          onRestart={() => {
            setStage('landing')
          }}
          onViewOverall={() => setStage('overall')}
          hasHistory={historyResults.length > 0}
        />
      )}
    </div>
  )
}

function HeaderBar() {
  return (
    <header className="pm-header">
      <button className="pm-icon-btn" aria-label="메뉴">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="pm-logo">
        <div className="pm-logo-dots">
          <span className="dot-b1" />
          <span className="dot-b2" />
        </div>
        <span className="pm-logo-text">평균인간</span>
      </div>

      <div className="pm-header-right">
        <button className="pm-icon-btn" aria-label="검색">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button className="pm-icon-btn" aria-label="마이페이지">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  )
}

function Landing({
  onPick,
  historyCount,
  onViewOverall,
}: {
  onPick: (t: Topic) => void
  historyCount: number
  onViewOverall: () => void
}) {
  const [heroIdx, setHeroIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % TOPICS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const currentTopic = TOPICS[heroIdx]

  return (
    <div className="screen pm-landing-screen">
      <HeaderBar />

      {historyCount > 0 && (
        <div style={{ padding: '12px 16px 0 16px' }}>
          <button className="btn-overall" onClick={onViewOverall}>
            🦄 내 평범 이탈 지수 종합 진단 ({historyCount}개 완료) →
          </button>
        </div>
      )}

      {/* 1. 상단 핑크 팝 메인 배너 (Hero Carousel Banner) */}
      <section className="pm-hero-section">
        <div className="pm-hero-card">
          <div className="pm-card-window">
            <div className="pm-window-header">
              <span className="window-btn" />
              <span className="window-btn" />
            </div>

            <div className="pm-card-content">
              <div className="pm-card-left">
                <div className="pm-card-badge">HOT 팩폭 심테</div>
                <h1 className="pm-card-title">{currentTopic.question}</h1>
                <p className="pm-card-sub">{currentTopic.teaser}</p>

                <button className="pm-play-btn" onClick={() => onPick(currentTopic)}>
                  <span>플레이 하러가기</span>
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
                    <span>설렘 ★★★★★</span>
                    <span>공감력 ★★★★★</span>
                  </div>
                  <div className="pm-stat-row">
                    <span>팩폭 ★★★★★</span>
                    <span>재미 ★★★★★</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-page-badge">
              {heroIdx + 1} / {TOPICS.length}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 하단 최신 심테 가로 스크롤 카드 행 */}
      <section className="pm-section">
        <div className="pm-section-header">
          <h2>🆕 최신 심테</h2>
        </div>

        <div className="pm-horizontal-scroll">
          {TOPICS.map((t, idx) => (
            <div className="pm-test-card" key={t.id} onClick={() => onPick(t)}>
              <div className="pm-thumb-box" style={{ ['--accent-color' as string]: t.accent } as React.CSSProperties}>
                <div className="pm-thumb-badge">NEW</div>
                <div className="pm-thumb-emoji">{t.emoji}</div>
                <div className="pm-thumb-title">{t.navTitle}</div>
                <div className="pm-thumb-mini-stats">
                  <span>팩폭 ★★★★★</span>
                </div>
              </div>
              <div className="pm-test-title">{t.question.split('\n')[0]}</div>
              <div className="pm-test-views">
                <span>▷</span> {(1.2 + (idx % 5) * 0.4).toFixed(1)}만
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 인기 팩폭 심테 2열 카드 섹션 */}
      <section className="pm-section" style={{ marginTop: 24, marginBottom: 20 }}>
        <div className="pm-section-header">
          <h2>🔥 추천 팩폭 대결</h2>
        </div>
        <div className="pm-grid-2col">
          {TOPICS.slice(0, 4).map((t) => (
            <div className="pm-grid-item" key={t.id} onClick={() => onPick(t)}>
              <div className="pm-grid-thumb" style={{ background: t.accent }}>
                <span>{t.emoji}</span>
              </div>
              <div className="pm-grid-info">
                <div className="pm-grid-title">{t.navTitle}</div>
                <div className="pm-grid-desc">{t.teaser}</div>
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
  historyCount,
  onNext,
  onViewOverall,
}: {
  result: Result
  historyCount: number
  onNext: () => void
  onViewOverall: () => void
}) {
  return (
    <div className="screen">
      <div className="brand">
        {result.topic.emoji} {result.topic.navTitle}
      </div>
      <h2 className="result-title" style={{ marginTop: 12 }}>
        {resultTitle(result)}
      </h2>
      <div className="result-sub">{subline(result)}</div>

      <div className="card-wrap" style={{ marginTop: 22 }}>
        <DistributionChart result={result} width={330} height={180} />
      </div>

      <div style={{ marginTop: 18 }}>
        <TypeResultCard result={result} />
      </div>

      <div className="stats">
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

      <div className="verdict">{verdict(result)}</div>
      <div className="intuitive">{intuitiveLine(result)}</div>

      {historyCount > 0 && (
        <div style={{ marginTop: 16 }}>
          <button className="btn-overall" onClick={onViewOverall}>
            🦄 내 평범 이탈 지수 종합 카드 보기 ({historyCount}개 완료) →
          </button>
        </div>
      )}

      <div className="spacer" />
      <button className="btn" onClick={onNext}>
        🔥 팩폭 공유 카드 만들기
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
      <div className="c-head">{headline(result)}</div>
      <div className="c-sub">
        {subline(result)} · {intuitiveLine(result)}
      </div>
      <div style={{ marginTop: 14 }}>
        <DistributionChart result={result} width={270} height={110} compact />
      </div>
      <div style={{ marginTop: 10 }}>
        <TypeResultCard result={result} />
      </div>
      <div className="c-cta">너는 상위 몇 %야? · 평균인간에서 확인</div>
    </div>
  )
}

function CardScreen({
  result,
  onNext,
  onViewOverall,
}: {
  result: Result
  onNext: () => void
  onViewOverall: () => void
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
      const file = new File([blob], 'na-eodijjeum.png', { type: 'image/png' })
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
    <div className="screen">
      <div className="brand">공유 카드</div>
      <div className="card-wrap">
        <ShareCard result={result} innerRef={cardRef} />
      </div>
      <div className="stack">
        <button className="btn" disabled={busy} onClick={onShare}>
          {busy ? '만드는 중…' : '🔥 친구한테 결과 보내서 팩폭하기'}
        </button>
        <button className="btn ghost" disabled={busy} onClick={onSave}>
          이미지 저장
        </button>
        <button className="btn-overall" onClick={onViewOverall}>
          🦄 내 평범 이탈 지수 종합 카드 보기 →
        </button>
      </div>
      {msg && <p className="mini-hint">{msg}</p>}
      <div className="spacer" />
      <button className="btn ghost" onClick={onNext}>
        다음
      </button>
    </div>
  )
}

function Spread({
  onRestart,
  onViewOverall,
  hasHistory,
}: {
  onRestart: () => void
  onViewOverall: () => void
  hasHistory: boolean
}) {
  return (
    <div className="screen">
      <div className="brand">더 해보기</div>
      <div className="spacer" />
      <h1 style={{ fontSize: 22 }}>{'친구는 상위 몇 %일까? 😈\n링크 공유해서 팩폭 대결 가자!'}</h1>
      <p className="lead">이 링크 공유하면 친구도 10초 만에 자기 리얼 위치가 털려요 💥</p>
      <div className="stack" style={{ marginTop: 24 }}>
        <button
          className="btn"
          onClick={async () => {
            try {
              await navigator.share({
                title: '평균인간',
                text: '너는 상위 몇 %야? 나 이거 해봤는데 진짜 팩폭 멘붕 옴 😱',
                url: location.href,
              })
            } catch {
              await navigator.clipboard?.writeText(location.href)
            }
          }}
        >
          🔥 친구에게 팩폭 링크 보내기
        </button>
        {hasHistory && (
          <button className="btn-overall" onClick={onViewOverall}>
            🦄 내 평범 이탈 지수 종합 카드 보기 →
          </button>
        )}
        <button className="btn ghost" onClick={onRestart}>
          다른 주제도 팩폭 측정하기
        </button>
      </div>
      <div className="spacer" />
      <p className="mini-hint">주제를 여러 개 하면 나만의 평균 프로필이 완성돼요</p>
    </div>
  )
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'na-eodijjeum.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

