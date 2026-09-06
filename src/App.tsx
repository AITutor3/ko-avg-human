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
import { headline, intuitiveLine, verdict } from './copy'
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

function HeaderBar({ onShareUrl }: { onShareUrl?: () => void }) {
  return (
    <header className="pm-header-clean">
      <div className="pm-logo-clean">
        <span className="pm-logo-text">평균인간</span>
        <span className="pm-logo-dot">•</span>
      </div>
      <div className="pm-header-actions">
        <button className="pm-icon-btn" aria-label="공유" onClick={onShareUrl}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>
    </header>
  )
}

function Landing({ onPick }: { onPick: (t: Topic) => void }) {
  const [heroIdx, setHeroIdx] = useState(0)
  const [sortTab, setSortTab] = useState<'popular' | 'latest'>('popular')
  const [toastMsg, setToastMsg] = useState('')

  const top3Topics = useMemo(() => {
    return [...TOPICS].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 3)
  }, [])

  const sortedTopics = useMemo(() => {
    if (sortTab === 'popular') {
      return [...TOPICS].sort((a, b) => b.viewsCount - a.viewsCount)
    }
    return [...TOPICS]
  }, [sortTab])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % top3Topics.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [top3Topics.length])

  const currentTopic = top3Topics[heroIdx]

  async function handleShareUrl() {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: '평균인간 - 대한민국 팩폭 테스트',
          url: shareUrl,
        })
      } catch {
        // 공유 취소 시 무시
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      showToast('링크가 복사되었습니다!')
    } else {
      showToast('링크가 복사되었습니다!')
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2200)
  }

  function prevHero() {
    setHeroIdx((prev) => (prev - 1 + top3Topics.length) % top3Topics.length)
  }

  function nextHero() {
    setHeroIdx((prev) => (prev + 1) % top3Topics.length)
  }

  return (
    <div className="screen pm-landing-screen-clean">
      <HeaderBar onShareUrl={handleShareUrl} />

      {/* 1. 상단 소프트 핑크 메인 히어로 카드 */}
      <section className="pm-hero-section-clean">
        <div className="pm-hero-card-clean">
          <div className="pm-hero-card-top">
            <span className="pm-pill-badge-red">🔥 실시간 인기 TOP {heroIdx + 1}</span>
            
            <div className="pm-hero-nav-controls">
              <button className="hero-arrow-btn" onClick={prevHero} aria-label="이전 카드">‹</button>
              <div className="pm-hero-heart-badge">
                <span className="heart-emoji">💖</span>
                <span className="page-num">{heroIdx + 1} / {top3Topics.length}</span>
              </div>
              <button className="hero-arrow-btn" onClick={nextHero} aria-label="다음 카드">›</button>
            </div>
          </div>

          <h1 className="pm-hero-title-clean">
            {currentTopic.question.split('\n')[0]} <br />
            <span className="highlight-text">{currentTopic.question.split('\n')[1] ?? ''}</span>
          </h1>

          <p className="pm-hero-sub-clean">{currentTopic.teaser}</p>

          <button className="pm-hero-play-btn" onClick={() => onPick(currentTopic)}>
            <span>플레이 하러가기 (▷ {currentTopic.viewsCount}만)</span>
            <span className="arrow">→</span>
          </button>

          <div className="pm-hero-metrics-clean">
            <span className="metric-item">조회 <b className="num">{currentTopic.viewsCount}만</b></span>
            <span className="metric-divider">|</span>
            <span className="metric-item">공감 <span className="stars">★★★★★</span></span>
          </div>
        </div>
      </section>

      {/* 2. 인기 심테 랭킹 가로 스크롤 카드 */}
      <section className="pm-section-clean">
        <div className="pm-section-header-clean">
          <h2>🔥 인기 심테 랭킹</h2>
          <span className="side-hint">옆으로 넘겨보기</span>
        </div>

        <div className="pm-horizontal-scroll-clean">
          {TOPICS.map((t, idx) => (
            <div className="pm-rank-card" key={t.id} onClick={() => onPick(t)}>
              <div className={`pm-rank-thumb-box theme-${t.id}`}>
                <div className="pm-rank-emoji">{t.emoji}</div>
                <div className="pm-rank-nav-title">{t.navTitle}</div>
              </div>
              <div className="pm-rank-card-title">{t.question.split('\n')[0]}</div>
              <div className="pm-rank-card-footer">
                <span className="views">▷ {t.viewsCount}만</span>
                <span className="rank-tag">{idx + 1}위</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 전체 팩폭 테스트 목록 (인기순 / 최신순 탭) */}
      <section className="pm-section-clean" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="pm-section-header-clean">
          <h2>🎯 전체 팩폭 테스트 목록</h2>
          <div className="pm-tab-pills">
            <button className={`tab-btn${sortTab === 'popular' ? ' active' : ''}`} onClick={() => setSortTab('popular')}>인기순</button>
            <button className={`tab-btn${sortTab === 'latest' ? ' active' : ''}`} onClick={() => setSortTab('latest')}>최신순</button>
          </div>
        </div>

        <div className="pm-grid-2col-clean">
          {sortedTopics.map((t) => (
            <div className="pm-grid-card-clean" key={t.id} onClick={() => onPick(t)}>
              <div className={`pm-grid-icon-box theme-${t.id}`}>
                <span>{t.emoji}</span>
              </div>
              <div className="pm-grid-card-info">
                <div className="pm-grid-card-title">{t.navTitle}</div>
                <div className="pm-grid-card-views">▷ {t.viewsCount}만 참여</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 토스트 알림 / 팝업 토스트 */}
      {toastMsg && (
        <div className="toast-popup-msg">
          {toastMsg}
        </div>
      )}

      {/* 4. 최하단 고정 네비게이션 바 (인기랭킹 제거, 내 보관함 누를 시 팝업) */}
      <div className="pm-bottom-nav">
        <button className="nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>홈</span>
        </button>
        <button className="nav-item" onClick={() => showToast('준비중입니다.')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <span>내 보관함</span>
        </button>
      </div>
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
  // 월 예상 실수령액 계산 (연봉 주제 특화)
  const monthlyEstimate = topic.id === 'income_salary' ? Math.round((value * 0.8) / 12) : null

  return (
    <div className="screen input-screen-clean">
      {/* 1. 상단 뒤로가기 & 주제 뱃지 */}
      <div className="input-top-bar">
        <button className="link-back-clean" onClick={onBack}>
          ‹ 다른 주제 고르기
        </button>
        <span className="topic-pill-badge" style={{ background: `${topic.accent}20`, color: topic.accent }}>
          {topic.emoji} {topic.navTitle}
        </span>
      </div>

      {/* 2. 메인 질문 타이틀 & 서브 안내 */}
      <div className="input-header-group">
        <h1 className="input-main-title">
          {topic.question.split('\n')[0]} <br />
          <span className="title-highlight" style={{ color: topic.accent }}>
            {topic.question.split('\n')[1] ?? ''}
          </span>
        </h1>
        <p className="input-sub-desc">통계청 및 고용노동부 최신 임금직무 정보 기반</p>
      </div>

      {/* 3. 나이대 선택 */}
      <div className="input-field-group">
        <div className="field-label-row">
          <span className="field-label">나이대 선택</span>
          <span className="field-hint">만 나이 기준</span>
        </div>
        <div className="age-chips-row">
          {AGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`age-chip-btn${age === o.value ? ' active' : ''}`}
              onClick={() => setAge(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 성별 선택 */}
      <div className="input-field-group">
        <span className="field-label">성별 선택</span>
        <div className="gender-chips-row">
          {GENDER_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`gender-chip-btn${gender === o.value ? ' active' : ''}`}
              onClick={() => setGender(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. 금액/수치 입력 카드 */}
      <div className="input-card-box">
        <div className="input-card-header">
          <span className="input-card-title">{topic.inputLabel}</span>
          <span className="live-badge">실시간 반영</span>
        </div>

        <div className="input-card-body">
          <div className="value-display-row">
            <div className="main-val-text">
              <span className="num">{topic.fmt(value)}</span>
            </div>
            {monthlyEstimate !== null && (
              <div className="monthly-estimate-box">
                <span className="lbl">월 예상 실수령액</span>
                <span className="val">약 {monthlyEstimate.toLocaleString()}만원</span>
              </div>
            )}
          </div>

          <div className="slider-container">
            <input
              type="range"
              min={topic.min}
              max={topic.max}
              step={topic.step}
              value={value}
              className="custom-range-slider"
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </div>

          <div className="range-ticks-row">
            <span>{topic.fmt(topic.min)}</span>
            <span>{topic.fmt(Math.round((topic.min + topic.max) * 0.35))}</span>
            <span>{topic.fmt(Math.round((topic.min + topic.max) * 0.7))}</span>
            <span>{topic.fmt(topic.max)}+</span>
          </div>
        </div>
      </div>

      {/* 제출 블루 메인 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 팩폭 결과 확인하기
        </button>
      </div>
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
  const characterCardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function render(): Promise<Blob | null> {
    const target = characterCardRef.current || cardRef.current
    if (!target) return null
    const dataUrl = await toPng(target, { pixelRatio: 3, cacheBust: true })
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

  const metaLabel = result.model.label

  return (
    <div className="screen chart-screen-wrap" style={{ padding: '16px 14px', background: '#f8f9fa' }}>
      {/* 1. 상단 뒤로가기 버튼 */}
      <button className="link-back" onClick={onRestart} style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#8b95a1' }}>
        ‹ 다른 테스트 선택하기
      </button>

      {/* 캡처 & 렌더링 카드 전체 Container */}
      <div
        className="result-main-container"
        ref={cardRef}
        style={{ ['--accent' as string]: result.topic.accent } as React.CSSProperties}
      >
        {/* 상단 뱃지 & 타이틀 헤더 */}
        <div className="result-header-section">
          <div className="result-pill-badge">
            💰 {result.topic.navTitle} 팩폭 결과
          </div>
          <div className="result-sub-branding">
            평균인간 · {result.topic.navTitle}
          </div>
          <h1 className="result-main-headline">
            {headline(result)} 💸
          </h1>
          <div className="result-meta-chips">
            <span className="meta-chip">{metaLabel} 기준</span>
            <span className="divider">|</span>
            <span className="top-percent-chip">🔥 상위 {Math.round(result.topPercent)}%</span>
          </div>
        </div>

        {/* 2. 캐릭터 카드 (독립형 카드 - 공유/저장 캡처 대상) */}
        <div className="card-box character-card-box">
          <TypeResultCard result={result} onShare={onShare} onSave={onSave} busy={busy} cardInnerRef={characterCardRef} />
        </div>

        {/* 3. 분포 곡선 차트 카드 (독립형 카드) */}
        <div className="card-box chart-card-box">
          <div className="chart-card-header">
            <span className="chart-title">또래 {result.topic.navTitle} 분포 곡선</span>
            <span className="chart-highlight-badge">상위 {Math.round(result.topPercent)}% 지점</span>
          </div>
          <div className="chart-svg-container">
            <DistributionChart result={result} width={310} height={135} compact />
          </div>
        </div>

        {/* 4. 3열 수치 박스 (독립형 3개 카드로 구성, 중앙 '나' 박스 강조) */}
        <div className="stats-triple-row">
          <div className="stat-box">
            <span className="stat-label">또래 평균</span>
            <b className="stat-val">{result.topic.fmt(result.model.median)}</b>
          </div>
          <div className="stat-box me-highlight-box">
            <div className="me-top-tag">나</div>
            <span className="stat-label">내 {result.topic.navTitle.replace(' 위치', '')}</span>
            <b className="stat-val me-val">{result.topic.fmt(result.value)}</b>
          </div>
          <div className="stat-box">
            <span className="stat-label">차이</span>
            <b className="stat-val diff-val">
              {result.diff >= 0 ? '+' : '−'}
              {result.topic.fmt(Math.abs(result.diff))}
            </b>
          </div>
        </div>

        {/* 5. 최하단 팩폭 문구 & 브랜딩 푸터 */}
        <div className="result-footer-section">
          <h3 className="verdict-title">{verdict(result)}</h3>
          <p className="verdict-sub">{intuitiveLine(result)}</p>
          <div className="footer-viral-text">
            너는 상위 몇 %야? · <span className="brand-link">평균인간에서 확인</span>
          </div>
        </div>
      </div>

      {msg && <p className="mini-hint">{msg}</p>}

      <div className="spacer" style={{ minHeight: 16 }} />
      <button className="btn ghost" onClick={onRestart} style={{ marginBottom: 12, marginTop: 16 }}>
        🔄 다른 테스트도 해보기
      </button>
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

