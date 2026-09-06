import type { AgeBucket, Gender } from '../../stats'
import type { SpendingStyleInput } from '../../types/input'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: SpendingStyleInput
  onChange: (next: SpendingStyleInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function SpendingStyleForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  // 소득 대비 소비 비율
  const spendRatio =
    formState.monthlyIncome > 0
      ? Math.round((formState.monthlySpending / formState.monthlyIncome) * 100)
      : 50

  const monthlySavings = Math.max(0, formState.monthlyIncome - formState.monthlySpending)

  return (
    <div className="custom-input-form">
      {/* 1. 기본 인적사항 */}
      <div className="form-card-section">
        <div className="section-label-badge">Step 1. 기본 정보</div>

        <div className="sub-field-group">
          <span className="sub-field-title">성별</span>
          <div className="chip-buttons-group">
            <button
              className={`select-chip-btn ${gender === 'female' ? 'active' : ''}`}
              onClick={() => {
                setGender('female')
                onChange({ ...formState, myGender: 'female' })
              }}
            >
              여성 👩
            </button>
            <button
              className={`select-chip-btn ${gender === 'male' ? 'active' : ''}`}
              onClick={() => {
                setGender('male')
                onChange({ ...formState, myGender: 'male' })
              }}
            >
              남성 👨
            </button>
          </div>
        </div>

        <div className="sub-field-group" style={{ marginTop: 14 }}>
          <span className="sub-field-title">나이대</span>
          <div className="chip-buttons-group grid-3">
            {(['10s', '20s', '30s', '40s', '50s', '60+'] as AgeBucket[]).map((a) => (
              <button
                key={a}
                className={`select-chip-btn ${age === a ? 'active' : ''}`}
                onClick={() => {
                  setAge(a)
                  onChange({ ...formState, myAge: a })
                }}
              >
                {a === '60+' ? '60대+' : `${a.replace('s', '대')}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 소득 및 소비 지출 입력 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 월 수입 & 소비 지출</div>

        {/* 세후 월 소득 */}
        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              세후 월 수입: <b className="highlight-val">{formState.monthlyIncome.toLocaleString()}만원</b>
            </span>
            <span className="sub-field-hint">실수령액</span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={100}
              max={1500}
              step={10}
              value={formState.monthlyIncome}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, monthlyIncome: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>100만</span>
            <span>300만</span>
            <span>600만</span>
            <span>1,500만+</span>
          </div>
        </div>

        {/* 월 총 지출 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <div className="field-title-flex">
            <span className="sub-field-title">
              한 달 총 지출: <b className="highlight-val" style={{ color: '#f72585' }}>{formState.monthlySpending.toLocaleString()}만원</b>
            </span>
            <span className="sub-field-hint">생활비 + 쇼핑 + 배달 + 취미</span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={30}
              max={1000}
              step={10}
              value={formState.monthlySpending}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, monthlySpending: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>30만</span>
            <span>150만</span>
            <span>400만</span>
            <span>1,000만+</span>
          </div>
        </div>

        {/* 소비 비율 및 잉여 저축액 분석 카드 */}
        <div className="spending-metric-banner" style={{ marginTop: 16 }}>
          <div className="metric-col">
            <span className="lbl">소득 대비 소비율</span>
            <b className={`val ${spendRatio > 80 ? 'danger' : ''}`}>{spendRatio}%</b>
          </div>
          <div className="metric-divider-v" />
          <div className="metric-col">
            <span className="lbl">월 잉여 저축 가능액</span>
            <b className="val">약 {monthlySavings.toLocaleString()}만원</b>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 소비 성향 팩폭 결과 확인하기
        </button>
      </div>
    </div>
  )
}
