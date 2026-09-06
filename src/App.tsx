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
import { headline, intuitiveLine, label, resultTitle, subline, verdict } from './copy'
import DistributionChart from './DistributionChart'

type Stage = 'landing' | 'input' | 'analyzing' | 'chart' | 'card' | 'spread'

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
        <Analyzing result={result} onDone={() => setStage('chart')} />
      )}
      {stage === 'chart' && result && (
        <ChartScreen result={result} onNext={() => setStage('card')} />
      )}
      {stage === 'card' && result && (
        <CardScreen result={result} onNext={() => setStage('spread')} />
      )}
      {stage === 'spread' && (
        <Spread
          onRestart={() => {
            setAge(null)
            setGender(null)
            setStage('landing')
          }}
        />
      )}
    </div>
  )
}

function Landing({ onPick }: { onPick: (t: Topic) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== idx) setIdx(i)
  }

  function go(i: number) {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="screen landing">
      <div className="brand">나 어디쯤</div>
      <p className="lead" style={{ marginTop: 8 }}>
        궁금한 걸 골라보세요. 옆으로 넘기면 주제가 바뀌어요.
      </p>

      <div className="slider" ref={trackRef} onScroll={onScroll}>
        {TOPICS.map((t) => (
          <article className="slide" key={t.id}>
            <div className="slide-card" style={{ ['--accent' as string]: t.accent } as React.CSSProperties}>
              <div className="slide-emoji">{t.emoji}</div>
              <div className="slide-kicker">{t.navTitle}</div>
              <h1 className="slide-q">{t.question}</h1>
              <p className="slide-teaser">{t.teaser}</p>
              <div className="spacer" />
              <button className="btn" onClick={() => onPick(t)}>
                이 주제로 시작
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="dots">
        {TOPICS.map((t, i) => (
          <button
            key={t.id}
            className={`dot${i === idx ? ' on' : ''}`}
            aria-label={`${t.navTitle}로 이동`}
            onClick={() => go(i)}
          />
        ))}
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
  return (
    <div className="screen">
      <button className="link-back" onClick={onBack}>
        ← 주제 다시 고르기
      </button>
      <div className="brand" style={{ marginTop: 6 }}>
        {topic.emoji} {topic.navTitle}
      </div>
      <h1 style={{ fontSize: 21, marginTop: 14 }}>{topic.question}</h1>

      <div className="field">
        <label>나이대</label>
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
        <label>성별</label>
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
        결과 보기
      </button>
    </div>
  )
}

const STEPS = [
  '비슷한 조건의 사람들과 비교 중…',
  '분포곡선 위에서 내 위치를 찾는 중…',
  '상위 몇 %인지 계산 중…',
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
      <div style={{ fontWeight: 800 }}>{result.model.label} 기준으로 분석 중</div>
      <div className="step">{STEPS[i]}</div>
    </div>
  )
}

function ChartScreen({ result, onNext }: { result: Result; onNext: () => void }) {
  const lab = label(result)
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

      <div className="label-pill">
        <span>{lab.emoji}</span>
        {lab.name}
      </div>

      <div className="spacer" />
      <button className="btn" onClick={onNext}>
        공유 카드 만들기
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
  const lab = label(result)
  return (
    <div className="card" ref={innerRef} style={{ ['--accent' as string]: result.topic.accent } as React.CSSProperties}>
      <div className="c-brand">나 어디쯤 · {result.topic.navTitle}</div>
      <div className="c-head">{headline(result)}</div>
      <div className="c-sub">
        {subline(result)} · {intuitiveLine(result)}
      </div>
      <div style={{ marginTop: 16 }}>
        <DistributionChart result={result} width={270} height={120} compact />
      </div>
      <div className="c-label">
        {lab.emoji} {lab.name}
      </div>
      <div className="c-cta">너는 상위 몇 %야? · 나 어디쯤에서 확인</div>
    </div>
  )
}

function CardScreen({ result, onNext }: { result: Result; onNext: () => void }) {
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
        await navigator.share({ files: [file], text: '나 이거 해봤는데 은근 충격. 너는?' })
      } else {
        downloadBlob(blob)
        setMsg('이미지를 저장했어요. 스토리·피드에 올려보세요!')
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
          {busy ? '만드는 중…' : '카드 공유하기'}
        </button>
        <button className="btn ghost" disabled={busy} onClick={onSave}>
          이미지 저장
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

function Spread({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="screen">
      <div className="brand">더 해보기</div>
      <div className="spacer" />
      <h1 style={{ fontSize: 22 }}>{'친구는 어디쯤일까?\n같이 해보면 은근 충격적임'}</h1>
      <p className="lead">이 링크를 그대로 보내면 친구도 10초 만에 자기 위치를 확인할 수 있어요.</p>
      <div className="stack" style={{ marginTop: 24 }}>
        <button
          className="btn"
          onClick={async () => {
            try {
              await navigator.share({
                title: '나 어디쯤',
                text: '너는 상위 몇 %야? 나 이거 해봤는데 은근 충격',
                url: location.href,
              })
            } catch {
              await navigator.clipboard?.writeText(location.href)
            }
          }}
        >
          친구에게 링크 보내기
        </button>
        <button className="btn ghost" onClick={onRestart}>
          다른 주제도 해보기
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
