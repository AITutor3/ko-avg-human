import { useMemo } from 'react'
import type { AgeBucket, Gender } from '../../stats'
import type { IdealMatchInput } from '../../types/input'
import { computeIdealMatchStat } from '../../calculators/idealMatchCalc'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: IdealMatchInput
  onChange: (next: IdealMatchInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function IdealMatchForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  const targetIsMale =
    formState.targetGender === 'male' || (formState.targetGender === 'none' && gender === 'female')

  const statsPreview = useMemo(() => {
    return computeIdealMatchStat({
      ...formState,
      myAge: age,
      myGender: gender ?? 'female',
    })
  }, [formState, age, gender])

  return (
    <div className="custom-input-form">
      {/* 1. 기본 내 정보 (나이, 성별) */}
      <div className="form-card-section">
        <div className="section-label-badge">Step 1. 내 기본 정보</div>
        
        <div className="sub-field-group">
          <span className="sub-field-title">내 성별</span>
          <div className="chip-buttons-group">
            <button
              className={`select-chip-btn ${gender === 'female' ? 'active' : ''}`}
              onClick={() => {
                setGender('female')
                onChange({ ...formState, myGender: 'female', targetGender: 'male' })
              }}
            >
              여성 👩
            </button>
            <button
              className={`select-chip-btn ${gender === 'male' ? 'active' : ''}`}
              onClick={() => {
                setGender('male')
                onChange({ ...formState, myGender: 'male', targetGender: 'female' })
              }}
            >
              남성 👨
            </button>
          </div>
        </div>

        <div className="sub-field-group" style={{ marginTop: 14 }}>
          <span className="sub-field-title">내 나이대</span>
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

      {/* 2. 원하는 상대방 조건 입력 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 원하는 이상형 조건</div>

        {/* 희망 신장 (키) */}
        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              희망 상대 키: <b className="highlight-val">{formState.targetHeightMin}cm 이상</b>
            </span>
            <span className="sub-field-hint">
              {targetIsMale ? '(대한민국 2030 남성 평균 174cm)' : '(대한민국 2030 여성 평균 161.5cm)'}
            </span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={targetIsMale ? 165 : 150}
              max={targetIsMale ? 190 : 175}
              step={1}
              value={formState.targetHeightMin}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, targetHeightMin: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>{targetIsMale ? '165cm' : '150cm'}</span>
            <span>{targetIsMale ? '174cm (평균)' : '161cm (평균)'}</span>
            <span>{targetIsMale ? '180cm+' : '168cm+'}</span>
            <span>{targetIsMale ? '190cm' : '175cm'}</span>
          </div>
        </div>

        {/* 희망 최소 연봉 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">희망 최소 연봉 조건</span>
          <div className="chip-buttons-group grid-3">
            {[
              { val: 0, label: '상관없음' },
              { val: 3500, label: '3,500만+' },
              { val: 5000, label: '5,000만+' },
              { val: 6500, label: '6,500만+' },
              { val: 8000, label: '8,000만+' },
              { val: 10000, label: '1억 이상' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.targetIncomeMin === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, targetIncomeMin: item.val })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 희망 직장 / 직업군 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">희망 직장 / 직업군</span>
          <div className="chip-buttons-group grid-2">
            {[
              { val: 'any', label: '직업 무관 / 상관없음' },
              { val: 'general', label: '안정적인 직장인' },
              { val: 'stable', label: '공기업 · 공무원 · 교사' },
              { val: 'top_tier', label: '대기업 · 전문직 · 금융권' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.targetJob === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, targetJob: item.val as any })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 체형 / 스타일 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">희망 체형 / 스타일</span>
          <div className="chip-buttons-group grid-2">
            {[
              { val: 'any', label: '체형 무관' },
              { val: 'standard', label: '보통 / 표준 체형' },
              { val: 'slim', label: '슬림 / 날씬한 편' },
              { val: 'muscular', label: targetIsMale ? '근육형 / 탄탄한 체형' : '글래머 / 탄탄한 체형' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.targetBody === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, targetBody: item.val as any })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 비흡연 여부 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">흡연 여부 조건</span>
          <div className="chip-buttons-group grid-2">
            <button
              className={`select-chip-btn ${!formState.targetNonSmoker ? 'active' : ''}`}
              onClick={() => onChange({ ...formState, targetNonSmoker: false })}
            >
              상관없음 💨
            </button>
            <button
              className={`select-chip-btn ${formState.targetNonSmoker ? 'active' : ''}`}
              onClick={() => onChange({ ...formState, targetNonSmoker: true })}
            >
              비흡연자 필수 🚭
            </button>
          </div>
        </div>
      </div>

      {/* 3. 실시간 통계 프리뷰 카드 */}
      <div className="live-preview-box">
        <div className="live-preview-header">
          <span>✨ 실시간 조건 결합 희소성 예측</span>
          <span className="live-tag">LIVE</span>
        </div>
        <div className="live-preview-content">
          <div className="prob-highlight">
            대한민국 이성 중 <b className="rarity-num">상위 {statsPreview.topPercent.toFixed(1)}%</b> 수준
          </div>
          <p className="prob-desc">
            {statsPreview.topPercent <= 3
              ? '🦄 전설의 유니콘급 조건! 대한민국에 극소수만 존재해요'
              : statsPreview.topPercent <= 15
              ? '👑 눈이 꽤 높은 편! 확실히 매력적인 상위권 조건이에요'
              : '🌸 현실에서 충분히 만날 수 있는 균형 있는 이상형이에요'}
          </p>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 이상형 희소성 팩폭 결과 보기
        </button>
      </div>
    </div>
  )
}
