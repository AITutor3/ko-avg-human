import type { AgeBucket, Gender } from '../../stats'
import type { DatingCountInput } from '../../types/input'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: DatingCountInput
  onChange: (next: DatingCountInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function DatingCountForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
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

      {/* 2. 연애 횟수 및 기간 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 연애 경험치</div>

        {/* 누적 연애 횟수 */}
        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              총 누적 연애 횟수: <b className="highlight-val">{formState.count}회</b>
            </span>
            <span className="sub-field-hint">스쳐 지나간 인연 포함</span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={formState.count}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, count: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>0회 (모태솔로)</span>
            <span>3회 (평균)</span>
            <span>7회</span>
            <span>20회+</span>
          </div>
        </div>

        {/* 최장 연애 기간 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">가장 길게 만났던 최장 연애 기간</span>
          <div className="chip-buttons-group grid-2">
            {[
              { val: 'under_6m', label: '6개월 미만 (단기)' },
              { val: '6m_1y', label: '6개월 ~ 1년' },
              { val: '1y_3y', label: '1년 ~ 3년 (진국)' },
              { val: '3y_plus', label: '3년 이상 (장기연애)' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.longestDuration === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, longestDuration: item.val as any })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 연애력 팩폭 결과 확인하기
        </button>
      </div>
    </div>
  )
}
