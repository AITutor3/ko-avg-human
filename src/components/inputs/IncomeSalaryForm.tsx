import type { AgeBucket, Gender } from '../../stats'
import { fmtSalary } from '../../stats'
import type { IncomeSalaryInput } from '../../types/input'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: IncomeSalaryInput
  onChange: (next: IncomeSalaryInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function IncomeSalaryForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  // 세후 월 예상 실수령액 간이 계산
  const monthlyNetEstimate = Math.round((formState.totalSalary * 0.82) / 12)

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

      {/* 2. 영끌 연봉 입력 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 영끌 연봉 (세전)</div>

        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              세전 영끌 연간 소득: <b className="highlight-val">{fmtSalary(formState.totalSalary)}</b>
            </span>
            <span className="sub-field-hint">기본급 + 인센티브 + 상여금 영끌</span>
          </div>

          <div className="salary-real-monthly-badge">
            <span>월 예상 실수령액</span>
            <b className="val">약 {monthlyNetEstimate.toLocaleString()}만원</b>
          </div>

          <div className="slider-container" style={{ margin: '14px 0 8px 0' }}>
            <input
              type="range"
              min={1500}
              max={20000}
              step={100}
              value={formState.totalSalary}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, totalSalary: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>1,500만</span>
            <span>4,500만</span>
            <span>8,000만</span>
            <span>2억원+</span>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 연봉 위치 팩폭 결과 확인하기
        </button>
      </div>
    </div>
  )
}
