import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  computeResult,
  fmtDuration,
  type AgeBucket,
  type Gender,
  type Result,
} from './stats'
import { headline, intuitiveLine, label, subline, verdict } from './copy'
import DistributionChart from './DistributionChart'

type Stage = 'landing' | 'input' | 'analyzing' | 'chart' | 'card' | 'spread'

export default function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [age, setAge] = useState<AgeBucket | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [hours, setHours] = useState(4)

  const result = useMemo<Result | null>(
    () => (age && gender ? computeResult(age, gender, hours) : null),
    [age, gender, hours],
  )

  return (
    <>
      {stage === 'landing' && <Landing onStart={() => setStage('input')} />}
      {stage === 'input' && (
        <InputScreen
          age={age}
          gender={gender}
          hours={hours}
          setAge={setAge}
          setGender={setGender}
          setHours={setHours}
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
            setStage('input')
          }}
        />
      )}
    </>
  )
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen">
      <div className="brand">나 어디쯤</div>
      <div className="spacer" />
      <h1>{'나는 한국인 평균보다\n스마트폰을 많이 볼까?'}</h1>
      <p className="lead">
        나이·성별·하루 사용시간만 입력하면 비슷한 사람들 사이에서 내 위치를 분포곡선으로 보여줘요. 10초면 끝나요.
      </p>
      <div className="spacer" />
      <button className="btn" onClick={onStart}>
        내 위치 확인하기
      </button>
    </div>
  )
}

function InputScreen({
  age,
  gender,
  hours,
  setAge,
  setGender,
  setHours,
  onNext,
}: {
  age: AgeBucket | null
  gender: Gender | null
  hours: number
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  setHours: (h: number) => void
  onNext: () => void
}) {
  return (
    <div className="screen">
      <div className="brand">1 / 3 · 입력</div>
      <h1 style={{ fontSize: 22, marginTop: 18 }}>{'나에 대해\n조금만 알려주세요'}</h1>

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
        <label>하루 평균 스마트폰 사용시간</label>
        <div className="slider-row">
          <span className="slider-val">{hours.toFixed(1)}</span>
          <span className="slider-unit">시간 / 일</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={12}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
        />
        <p className="intuitive">
          폰 설정 &gt; 스크린타임(iOS) / 디지털 웰빙(안드로이드)에서 확인할 수 있어요
        </p>
      </div>

      <div className="spacer" />
      <button className="btn" disabled={!age || !gender} onClick={onNext}>
        결과 보기
      </button>
    </div>
  )
}

const STEPS = [
  '비슷한 조건의 사용자들과 비교 중…',
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
  const lab = label(result.topPercent)
  return (
    <div className="screen">
      <div className="brand">2 / 3 · 내 위치</div>
      <h2 className="result-title" style={{ marginTop: 14 }}>
        {result.diffMin >= 15
          ? '평균보다 스마트폰을\n더 많이 봅니다'
          : result.diffMin <= -15
            ? '평균보다 스마트폰을\n덜 봅니다'
            : '거의 평균에\n가깝습니다'}
      </h2>
      <div className="result-sub">{subline(result)}</div>

      <div className="card-wrap" style={{ marginTop: 24 }}>
        <DistributionChart result={result} width={330} height={180} />
      </div>

      <div className="stats">
        <div className="stat">
          <b>{fmtDuration(result.model.medianMin)}</b>
          <span>또래 평균</span>
        </div>
        <div className="stat">
          <b>{fmtDuration(result.userMin)}</b>
          <span>나</span>
        </div>
        <div className="stat">
          <b>
            {result.diffMin >= 0 ? '+' : '−'}
            {fmtDuration(result.diffMin)}
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
  const lab = label(result.topPercent)
  return (
    <div className="card" ref={innerRef}>
      <div className="c-brand">나 어디쯤</div>
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
        await navigator.share({ files: [file], text: '나는 또래보다 폰을 이만큼 본대. 너는?' })
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
      <div className="brand">3 / 3 · 공유 카드</div>
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
      <h1 style={{ fontSize: 23 }}>{'친구는 어디쯤일까?\n같이 해보면 은근 충격적임'}</h1>
      <p className="lead">이 링크를 그대로 보내면 친구도 10초 만에 자기 위치를 확인할 수 있어요.</p>
      <div className="stack" style={{ marginTop: 24 }}>
        <button
          className="btn"
          onClick={async () => {
            try {
              await navigator.share({
                title: '나 어디쯤',
                text: '너는 폰 상위 몇 %야? 나 이거 해봤는데 은근 충격',
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
          다른 조건으로 다시 해보기
        </button>
      </div>
      <div className="spacer" />
      <p className="mini-hint">곧 추가될 주제 · 수면시간 · 출퇴근 · 독서량</p>
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
