import { useMemo } from 'react'
import type { AgeBucket, Gender } from '../../stats'
import type { PhysicalInput } from '../../calculators/physicalStatsCalc'
import { computePhysicalStats } from '../../calculators/physicalStatsCalc'
import { topicById } from '../../topics'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: PhysicalInput
  onChange: (next: PhysicalInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function PhysicalStatsForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  const isMale = gender === 'male'
  const topic = topicById('physical_condition')

  const statPreview = useMemo(() => {
    return computePhysicalStats(topic, {
      ...formState,
      myAge: age,
      myGender: gender ?? 'male',
    })
  }, [formState, age, gender, topic])

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

      {/* 2. 신장(키) 및 체중(몸무게) 입력 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 키 & 몸무게 입력</div>

        {/* 키 입력 */}
        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              내 키 (신장): <b className="highlight-val">{formState.myHeight.toFixed(1)}cm</b>
            </span>
            <span className="sub-field-hint">
              또래 평균: <b style={{ color: '#2563eb' }}>{statPreview.meanHeight.toFixed(1)}cm</b>
            </span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={isMale ? 150 : 140}
              max={isMale ? 195 : 180}
              step={0.5}
              value={formState.myHeight}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, myHeight: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>{isMale ? '150cm' : '140cm'}</span>
            <span>{isMale ? '170cm' : '158cm'}</span>
            <span>{isMale ? '180cm' : '168cm'}</span>
            <span>{isMale ? '195cm+' : '180cm+'}</span>
          </div>
        </div>

        {/* 몸무게 입력 */}
        <div className="sub-field-group" style={{ marginTop: 20 }}>
          <div className="field-title-flex">
            <span className="sub-field-title">
              내 몸무게 (체중): <b className="highlight-val" style={{ color: '#8b5cf6' }}>{formState.myWeight.toFixed(1)}kg</b>
            </span>
            <span className="sub-field-hint">
              또래 평균: <b style={{ color: '#8b5cf6' }}>{statPreview.meanWeight.toFixed(1)}kg</b>
            </span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={isMale ? 45 : 35}
              max={isMale ? 130 : 110}
              step={0.5}
              value={formState.myWeight}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, myWeight: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>{isMale ? '45kg' : '35kg'}</span>
            <span>{isMale ? '70kg' : '55kg'}</span>
            <span>{isMale ? '90kg' : '75kg'}</span>
            <span>{isMale ? '130kg+' : '110kg+'}</span>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 신체 조건 팩폭 결과 확인하기 (차트 2개)
        </button>
      </div>
    </div>
  )
}
