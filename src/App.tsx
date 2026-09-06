import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  groupModel,
  computeResult,
  type AgeBucket,
  type Gender,
  type Result,
} from './stats'
import { TOPICS, type Topic } from './topics'
import { comprehensiveSummary, headline, verdict } from './copy'
import DistributionChart from './DistributionChart'
import TypeResultCard from './TypeResultCard'
import { event, initGA, pageview } from './gtag'
import type {
  IdealMatchInput,
  PhysicalInput,
  NetWorthInput,
  IncomeSalaryInput,
  SpendingStyleInput,
  DatingCountInput,
} from './types/input'
import { computeIdealMatchStat } from './calculators/idealMatchCalc'
import { computePhysicalStats } from './calculators/physicalStatsCalc'

import IdealMatchForm from './components/inputs/IdealMatchForm'
import PhysicalStatsForm from './components/inputs/PhysicalStatsForm'
import NetWorthForm from './components/inputs/NetWorthForm'
import IncomeSalaryForm from './components/inputs/IncomeSalaryForm'
import SpendingStyleForm from './components/inputs/SpendingStyleForm'
import DatingCountForm from './components/inputs/DatingCountForm'

import {
  fetchAllTestViews,
  recordTestView,
  formatViewCount,
  FALLBACK_VIEWS,
} from './lib/neon'

type Stage = 'landing' | 'input' | 'analyzing' | 'chart'

export default function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [age, setAge] = useState<AgeBucket | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [viewsMap, setViewsMap] = useState<Record<string, number>>(FALLBACK_VIEWS)

  useEffect(() => {
    // Neon DB에서 실시간 조회수 불러오기
    fetchAllTestViews().then((data) => {
      setViewsMap(data)
    })
  }, [])

  // 각 주제별 특화 폼 상태
  const [idealMatchForm, setIdealMatchForm] = useState<IdealMatchInput>({
    myGender: 'female',
    myAge: null,
    targetGender: 'male',
    targetAgePref: 'same',
    targetHeightMin: 176,
    targetIncomeMin: 4500,
    targetJob: 'general',
    targetBody: 'standard',
    targetNonSmoker: true,
  })

  // 신체적 조건 (키, 몸무게)
  const [physicalForm, setPhysicalForm] = useState<PhysicalInput>({
    myGender: 'male',
    myAge: null,
    myHeight: 174.5,
    myWeight: 74.0,
    region: '계',
  })

  const [netWorthForm, setNetWorthForm] = useState<NetWorthInput>({
    myGender: 'female',
    myAge: null,
    financialAssets: 3500,
    realEstate: 6000,
    debts: 1500,
    netWorth: 8000,
  })

  const [incomeSalaryForm, setIncomeSalaryForm] = useState<IncomeSalaryInput>({
    myGender: 'male',
    myAge: null,
    totalSalary: 4500,
  })

  const [spendingStyleForm, setSpendingStyleForm] = useState<SpendingStyleInput>({
    myGender: 'female',
    myAge: null,
    monthlyIncome: 300,
    monthlySpending: 150,
  })

  const [datingCountForm, setDatingCountForm] = useState<DatingCountInput>({
    myGender: 'female',
    myAge: null,
    count: 3,
    longestDuration: '1y_3y',
  })

  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    pageview(`/${stage}${topic ? `/${topic.id}` : ''}`)
  }, [stage, topic])

  // 결과 연산
  const result = useMemo<Result | null>(() => {
    if (!topic || !age || !gender) return null

    // 1. 이상형 희소성 결합 확률 통계
    if (topic.id === 'ideal_match') {
      const stat = computeIdealMatchStat({
        ...idealMatchForm,
        myAge: age,
        myGender: gender,
      })
      const model = groupModel(topic, age, gender)
      return {
        topic,
        model,
        value: stat.rarityScore,
        percentile: stat.percentile,
        topPercent: stat.topPercent,
        diff: stat.rarityScore - model.median,
        ratio: stat.rarityScore / model.median,
        peopleBelow: Math.round(stat.percentile),
        extraInfo: {
          breakdownItems: stat.summaryBreakdown,
          subtitleSummary: `상위 ${stat.topPercent.toFixed(1)}%의 유니콘급 이상형 조건`,
        },
      }
    }

    // 2. 신체적 조건 (2024 국가건강검진 실측 키 & 몸무게 2개 차트)
    if (topic.id === 'physical_condition') {
      const stat = computePhysicalStats(topic, {
        ...physicalForm,
        myAge: age,
        myGender: gender,
      })
      const model = groupModel(topic, age, gender)
      return {
        topic,
        model,
        value: physicalForm.myHeight,
        percentile: stat.heightPercentile,
        topPercent: stat.heightTopPercent,
        diff: stat.heightDiff,
        ratio: physicalForm.myHeight / stat.meanHeight,
        peopleBelow: Math.round(stat.heightPercentile),
        extraInfo: {
          subtitleSummary: `키 상위 ${Math.round(stat.heightTopPercent)}% · 몸무게 상위 ${Math.round(stat.weightTopPercent)}% (BMI ${stat.bmi})`,
          physicalStats: {
            heightResult: stat.heightResult,
            weightResult: stat.weightResult,
            meanHeight: stat.meanHeight,
            meanWeight: stat.meanWeight,
            heightDiff: stat.heightDiff,
            weightDiff: stat.weightDiff,
            bmi: stat.bmi,
            bmiCategory: stat.bmiCategory,
            bmiDescription: stat.bmiDescription,
          },
        },
      }
    }

    // 3. 순자산
    if (topic.id === 'net_worth') {
      return computeResult(topic, age, gender, netWorthForm.netWorth)
    }

    // 4. 연봉
    if (topic.id === 'income_salary') {
      return computeResult(topic, age, gender, incomeSalaryForm.totalSalary)
    }

    // 5. 소비 수준
    if (topic.id === 'spending_style') {
      return computeResult(topic, age, gender, spendingStyleForm.monthlySpending)
    }

    // 6. 연애 횟수
    if (topic.id === 'dating_count') {
      return computeResult(topic, age, gender, datingCountForm.count)
    }

    return computeResult(topic, age, gender, topic.default)
  }, [
    topic,
    age,
    gender,
    idealMatchForm,
    physicalForm,
    netWorthForm,
    incomeSalaryForm,
    spendingStyleForm,
    datingCountForm,
  ])

  const refreshViews = () => {
    fetchAllTestViews().then((data) => {
      setViewsMap(data)
    })
  }

  useEffect(() => {
    // Neon DB에서 실시간 조회수 불러오기
    refreshViews()
  }, [])

  function pick(t: Topic) {
    setTopic(t)
    setStage('input')
    event({ action: 'select_topic', category: 'interaction', label: t.navTitle })

    // Neon DB 실시간 조회수 증가 및 로컬 상태 즉시 반영
    recordTestView(t.id, t.navTitle).then((newCount) => {
      if (newCount !== null) {
        setViewsMap((prev) => ({ ...prev, [t.id]: newCount }))
      }
    })
  }

  const goLanding = () => {
    setStage('landing')
    refreshViews()
  }

  const accentStyle = topic ? ({ ['--accent' as string]: topic.accent } as React.CSSProperties) : undefined

  return (
    <div style={accentStyle} className="app-root">
      {stage === 'landing' && <Landing onPick={pick} viewsMap={viewsMap} />}
      {stage === 'input' && topic && (
        <InputScreen
          topic={topic}
          age={age}
          gender={gender}
          setAge={setAge}
          setGender={setGender}
          idealMatchForm={idealMatchForm}
          setIdealMatchForm={setIdealMatchForm}
          physicalForm={physicalForm}
          setPhysicalForm={setPhysicalForm}
          netWorthForm={netWorthForm}
          setNetWorthForm={setNetWorthForm}
          incomeSalaryForm={incomeSalaryForm}
          setIncomeSalaryForm={setIncomeSalaryForm}
          spendingStyleForm={spendingStyleForm}
          setSpendingStyleForm={setSpendingStyleForm}
          datingCountForm={datingCountForm}
          setDatingCountForm={setDatingCountForm}
          onBack={goLanding}
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
          onRestart={goLanding}
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

function Landing({
  onPick,
  viewsMap,
}: {
  onPick: (t: Topic) => void
  viewsMap: Record<string, number>
}) {
  const [heroIdx, setHeroIdx] = useState(0)
  const [sortTab, setSortTab] = useState<'popular' | 'latest'>('popular')
  const [toastMsg, setToastMsg] = useState('')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const getViewCount = (topicId: string) => {
    return viewsMap[topicId] ?? 0
  }

  const top3Topics = useMemo(() => {
    return [...TOPICS]
      .sort((a, b) => getViewCount(b.id) - getViewCount(a.id))
      .slice(0, 3)
  }, [viewsMap])

  const sortedTopics = useMemo(() => {
    if (sortTab === 'popular') {
      return [...TOPICS].sort((a, b) => getViewCount(b.id) - getViewCount(a.id))
    }
    return [...TOPICS]
  }, [sortTab, viewsMap])

  // 자동 슬라이드 롤링 (4.5초 주기)
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % top3Topics.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [top3Topics.length])

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

  // 모바일 터치 스와이프 제스처 핸들러
  function onTouchStart(e: React.TouchEvent) {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  function onTouchMove(e: React.TouchEvent) {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  function onTouchEnd() {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 40
    const isRightSwipe = distance < -40
    if (isLeftSwipe) {
      nextHero()
    } else if (isRightSwipe) {
      prevHero()
    }
  }

  return (
    <div className="screen pm-landing-screen-clean">
      <HeaderBar onShareUrl={handleShareUrl} />

      {/* 1. 메인 히어로 좌우 슬라이딩 캐러셀 트랙 */}
      <section className="pm-hero-section-clean">
        <div
          className="pm-hero-carousel-wrapper"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="pm-hero-carousel-track"
            style={{
              transform: `translateX(-${heroIdx * 100}%)`,
            }}
          >
            {top3Topics.map((t, idx) => (
              <div className="pm-hero-carousel-slide" key={t.id}>
                <div
                  className="pm-hero-card-clean"
                  style={{
                    background: `linear-gradient(145deg, #ffffff 0%, ${t.accent}18 100%)`,
                    borderColor: `${t.accent}40`,
                    boxShadow: `0 8px 24px ${t.accent}25`,
                  }}
                >
                  <div className="pm-hero-card-top">
                    <span
                      className="pm-pill-badge-red"
                      style={{
                        background: t.accent,
                        color: '#ffffff',
                        boxShadow: `0 3px 10px ${t.accent}50`,
                      }}
                    >
                      🔥 실시간 인기 TOP {idx + 1}
                    </span>
                    
                    <div className="pm-hero-nav-controls">
                      <button
                        className="hero-arrow-btn"
                        onClick={prevHero}
                        aria-label="이전 카드"
                        style={{ color: t.accent }}
                      >
                        ‹
                      </button>
                      <div className="pm-hero-heart-badge">
                        <span className="heart-emoji">💖</span>
                        <span className="page-num">{idx + 1} / {top3Topics.length}</span>
                      </div>
                      <button
                        className="hero-arrow-btn"
                        onClick={nextHero}
                        aria-label="다음 카드"
                        style={{ color: t.accent }}
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <h1 className="pm-hero-title-clean">
                    {t.question.split('\n')[0]} <br />
                    <span className="highlight-text" style={{ color: t.accent }}>
                      {t.question.split('\n')[1] ?? ''}
                    </span>
                  </h1>

                  <p className="pm-hero-sub-clean">{t.teaser}</p>

                  <button className="pm-hero-play-btn" onClick={() => onPick(t)}>
                    <span>플레이 하러가기</span>
                    <span className="arrow">→</span>
                  </button>

                  <div className="pm-hero-metrics-clean">
                    <span className="metric-item">조회 <b className="num" style={{ color: t.accent }}>{formatViewCount(viewsMap[t.id] ?? 0)}</b></span>
                    <span className="metric-divider">|</span>
                    <span className="metric-item">공감 <span className="stars">★★★★★</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 캐러셀 하단 도트 인디케이터 */}
        <div className="pm-hero-dots-indicator">
          {top3Topics.map((t, idx) => (
            <div
              key={t.id}
              className={`pm-hero-dot ${heroIdx === idx ? 'active' : ''}`}
              style={{
                backgroundColor: heroIdx === idx ? t.accent : '#cbd5e1',
              }}
              onClick={() => setHeroIdx(idx)}
            />
          ))}
        </div>
      </section>

      {/* 2. 인기 심테 랭킹 가로 스크롤 카드 */}
      <section className="pm-section-clean">
        <div className="pm-section-header-clean">
          <h2>🔥 인기 심테 랭킹</h2>
          <span className="side-hint">옆으로 넘겨보기</span>
        </div>

        <div className="pm-horizontal-scroll-clean">
          {[...TOPICS]
            .sort((a, b) => (viewsMap[b.id] ?? 0) - (viewsMap[a.id] ?? 0))
            .map((t, idx) => (
            <div className="pm-rank-card" key={t.id} onClick={() => onPick(t)}>
              <div className={`pm-rank-thumb-box theme-${t.id}`}>
                <div className="pm-rank-emoji">{t.emoji}</div>
                <div className="pm-rank-nav-title">{t.navTitle}</div>
              </div>
              <div className="pm-rank-card-title">{t.question.split('\n')[0]}</div>
              <div className="pm-rank-card-footer">
                <span className="views">▷ {formatViewCount(viewsMap[t.id] ?? 0)}</span>
                <span className="rank-tag">{idx + 1}위</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 전체 팩폭 테스트 목록 */}
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
                <div className="pm-grid-card-views">▷ {formatViewCount(viewsMap[t.id] ?? 0)} 참여</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 토스트 알림 */}
      {toastMsg && <div className="toast-popup-msg">{toastMsg}</div>}

      {/* 최하단 네비게이션 바 */}
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
  setAge,
  setGender,
  idealMatchForm,
  setIdealMatchForm,
  physicalForm,
  setPhysicalForm,
  netWorthForm,
  setNetWorthForm,
  incomeSalaryForm,
  setIncomeSalaryForm,
  spendingStyleForm,
  setSpendingStyleForm,
  datingCountForm,
  setDatingCountForm,
  onBack,
  onNext,
}: {
  topic: Topic
  age: AgeBucket | null
  gender: Gender | null
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  idealMatchForm: IdealMatchInput
  setIdealMatchForm: (v: IdealMatchInput) => void
  physicalForm: PhysicalInput
  setPhysicalForm: (v: PhysicalInput) => void
  netWorthForm: NetWorthInput
  setNetWorthForm: (v: NetWorthInput) => void
  incomeSalaryForm: IncomeSalaryInput
  setIncomeSalaryForm: (v: IncomeSalaryInput) => void
  spendingStyleForm: SpendingStyleInput
  setSpendingStyleForm: (v: SpendingStyleInput) => void
  datingCountForm: DatingCountInput
  setDatingCountForm: (v: DatingCountInput) => void
  onBack: () => void
  onNext: () => void
}) {
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

      {/* 2. 메인 질문 타이틀 */}
      <div className="input-header-group">
        <h1 className="input-main-title">
          {topic.question.split('\n')[0]} <br />
          <span className="title-highlight" style={{ color: topic.accent }}>
            {topic.question.split('\n')[1] ?? ''}
          </span>
        </h1>
        <p className="input-sub-desc">대한민국 2024 국가건강검진 및 공식 모집단 데이터 기반 실측</p>
      </div>

      {/* 3. 주제별 특화 폼 렌더링 */}
      {topic.id === 'ideal_match' && (
        <IdealMatchForm
          age={age}
          gender={gender}
          formState={idealMatchForm}
          onChange={setIdealMatchForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}

      {topic.id === 'physical_condition' && (
        <PhysicalStatsForm
          age={age}
          gender={gender}
          formState={physicalForm}
          onChange={setPhysicalForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}

      {topic.id === 'net_worth' && (
        <NetWorthForm
          age={age}
          gender={gender}
          formState={netWorthForm}
          onChange={setNetWorthForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}

      {topic.id === 'income_salary' && (
        <IncomeSalaryForm
          age={age}
          gender={gender}
          formState={incomeSalaryForm}
          onChange={setIncomeSalaryForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}

      {topic.id === 'spending_style' && (
        <SpendingStyleForm
          age={age}
          gender={gender}
          formState={spendingStyleForm}
          onChange={setSpendingStyleForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}

      {topic.id === 'dating_count' && (
        <DatingCountForm
          age={age}
          gender={gender}
          formState={datingCountForm}
          onChange={setDatingCountForm}
          setAge={setAge}
          setGender={setGender}
          onNext={onNext}
        />
      )}
    </div>
  )
}

const STEPS = [
  '2024 국가건강검진 실측 데이터 추출 중… 📊',
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

  const [step, setStep] = useState(1)
  const fullText = useMemo(() => comprehensiveSummary(result), [result])
  const [typedText, setTypedText] = useState('')

  const physicalStats = result.extraInfo?.physicalStats

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(2)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (step < 2) return
    let index = 0
    setTypedText('')
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [step, fullText])

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
            {result.topic.emoji} {result.topic.navTitle} 팩폭 결과
          </div>
          <div className="result-sub-branding">
            평균인간 · {result.topic.navTitle}
          </div>
          <h1 className="result-main-headline">
            {headline(result)}
          </h1>
          <div className="result-meta-chips">
            <span className="meta-chip">{metaLabel} 기준</span>
            <span className="divider">|</span>
            <span className="top-percent-chip">🔥 상위 {Math.round(result.topPercent)}%</span>
          </div>
        </div>

        {/* 2. 캐릭터 카드 (1단계: 가장 먼저 등장) */}
        <div className="card-box character-card-box animate-pop">
          <TypeResultCard result={result} onShare={onShare} onSave={onSave} busy={busy} cardInnerRef={characterCardRef} />
        </div>

        {/* 3-A. 신체 조건 특화: 차트 2개 (1. 키 분포곡선 + 2. 몸무게 분포곡선) */}
        {step >= 2 && physicalStats && (
          <>
            {/* 차트 1: 키 (신장) 분포곡선 */}
            <div className="card-box summary-report-card animate-fade-up" style={{ marginTop: 12 }}>
              <div className="report-card-header">
                <span className="report-badge">📏 1. 키 (신장) 분포곡선</span>
                <span className="chart-highlight-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                  상위 {Math.round(physicalStats.heightResult.topPercent)}% 지점
                </span>
              </div>
              
              <div className="chart-svg-container" style={{ margin: '8px 0' }}>
                <DistributionChart result={physicalStats.heightResult} width={310} height={135} compact />
              </div>

              <div className="stats-triple-row" style={{ marginTop: 8 }}>
                <div className="stat-box">
                  <span className="stat-label">또래 평균 키</span>
                  <b className="stat-val">{physicalStats.meanHeight.toFixed(1)}cm</b>
                </div>
                <div className="stat-box me-highlight-box">
                  <div className="me-top-tag">내 키</div>
                  <span className="stat-label">내 신장</span>
                  <b className="stat-val me-val">{result.value.toFixed(1)}cm</b>
                </div>
                <div className="stat-box">
                  <span className="stat-label">평균 대비</span>
                  <b className="stat-val diff-val">
                    {physicalStats.heightDiff >= 0 ? '+' : ''}
                    {physicalStats.heightDiff.toFixed(1)}cm
                  </b>
                </div>
              </div>
            </div>

            {/* 차트 2: 몸무게 (체중) 분포곡선 */}
            <div className="card-box summary-report-card animate-fade-up" style={{ marginTop: 14 }}>
              <div className="report-card-header">
                <span className="report-badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' }}>
                  ⚖️ 2. 몸무게 (체중) 분포곡선
                </span>
                <span className="chart-highlight-badge" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                  상위 {Math.round(physicalStats.weightResult.topPercent)}% 지점
                </span>
              </div>
              
              <div className="chart-svg-container" style={{ margin: '8px 0' }}>
                <DistributionChart result={physicalStats.weightResult} width={310} height={135} compact />
              </div>

              <div className="stats-triple-row" style={{ marginTop: 8 }}>
                <div className="stat-box">
                  <span className="stat-label">또래 평균 체중</span>
                  <b className="stat-val">{physicalStats.meanWeight.toFixed(1)}kg</b>
                </div>
                <div className="stat-box me-highlight-box" style={{ borderColor: '#8b5cf6' }}>
                  <div className="me-top-tag" style={{ background: '#8b5cf6' }}>내 체중</div>
                  <span className="stat-label">내 몸무게</span>
                  <b className="stat-val me-val" style={{ color: '#7c3aed' }}>
                    {physicalStats.weightResult.value.toFixed(1)}kg
                  </b>
                </div>
                <div className="stat-box">
                  <span className="stat-label">평균 대비</span>
                  <b className="stat-val diff-val">
                    {physicalStats.weightDiff >= 0 ? '+' : ''}
                    {physicalStats.weightDiff.toFixed(1)}kg
                  </b>
                </div>
              </div>
            </div>

            {/* BMI 분석 종합 리포트 카드 */}
            <div className="card-box breakdown-card-box animate-fade-up" style={{ marginTop: 14 }}>
              <div className="report-card-header">
                <span className="report-badge">📋 BMI 체질량 종합 분석</span>
                <span className="rare-pill" style={{ background: '#10b981' }}>{physicalStats.bmiCategory}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>
                  BMI 체질량 지수 <b style={{ color: '#059669' }}>{physicalStats.bmi}</b>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563', marginTop: 6, lineHeight: 1.5 }}>
                  {physicalStats.bmiDescription}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 3-B. 일반 주제: 단일 종합 분석 리포트 & 차트 */}
        {step >= 2 && !physicalStats && (
          <>
            <div className="card-box summary-report-card animate-fade-up">
              <div className="report-card-header">
                <span className="report-badge">📋 종합 분석 리포트</span>
                <span className="chart-highlight-badge">상위 {Math.round(result.topPercent)}% 지점</span>
              </div>
              
              {/* 차트 영역 */}
              <div className="chart-svg-container" style={{ margin: '8px 0' }}>
                <DistributionChart result={result} width={310} height={135} compact />
              </div>

              {/* 리포트 타이핑 효과 텍스트 */}
              <p className="report-text typed-text-area">
                {typedText}
                {typedText.length < fullText.length && <span className="typing-cursor">|</span>}
              </p>
            </div>

            {/* 3열 수치 박스 */}
            <div className="stats-triple-row animate-fade-up">
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
          </>
        )}

        {/* 이상형 조건별 상세 브레이크다운 카드 */}
        {step >= 2 && result.extraInfo?.breakdownItems && (
          <div className="card-box breakdown-card-box animate-fade-up" style={{ marginTop: 12 }}>
            <div className="report-card-header">
              <span className="report-badge">🔍 이상형 조건별 희소성 분석</span>
            </div>
            <div className="breakdown-list">
              {result.extraInfo.breakdownItems.map((item, idx) => (
                <div key={idx} className={`breakdown-row-item ${item.isRare ? 'rare-highlight' : ''}`}>
                  <div className="item-title">
                    <span>{item.label}</span>
                    {item.isRare && <span className="rare-pill">🔥 희귀 조건</span>}
                  </div>
                  <div className="item-prob-text">{item.probText}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. 최하단 팩폭 문구 & 브랜딩 푸터 */}
        {step >= 2 && (
          <div className="result-footer-section animate-fade-up">
            <h3 className="verdict-title">{verdict(result)}</h3>
            <div className="footer-viral-text">
              너는 상위 몇 %야? · <span className="brand-link">평균인간에서 확인</span>
            </div>
          </div>
        )}
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
