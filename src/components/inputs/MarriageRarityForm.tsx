import { useMemo } from 'react'
import type { AgeBucket, Gender } from '../../stats'
import { fmtAsset, fmtSalary } from '../../stats'
import type { MarriageRarityInput } from '../../types/input'
import { computeMarriageRarityStat } from '../../calculators/marriageRarityCalc'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: MarriageRarityInput
  onChange: (next: MarriageRarityInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function MarriageRarityForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  const isMale = gender === 'male'

  const statsPreview = useMemo(() => {
    return computeMarriageRarityStat({
      ...formState,
      myAge: age,
      myGender: gender ?? 'male',
    })
  }, [formState, age, gender])

  return (
    <div className="custom-input-form">
      {/* 1. 기본 인적사항 */}
      <div className="form-card-section">
        <div className="section-label-badge">Step 1. 기본 인적사항</div>

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

        {/* 내 신장 (키) */}
        <div className="sub-field-group" style={{ marginTop: 16 }}>
          <div className="field-title-flex">
            <span className="sub-field-title">
              내 키 (신장): <b className="highlight-val">{formState.myHeight}cm</b>
            </span>
            <span className="sub-field-hint">
              {isMale ? '2024 검진 30대 남성 평균 174.6cm' : '2024 검진 30대 여성 평균 161.9cm'}
            </span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={isMale ? 160 : 148}
              max={isMale ? 193 : 178}
              step={1}
              value={formState.myHeight}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, myHeight: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>{isMale ? '160cm' : '148cm'}</span>
            <span>{isMale ? '174cm' : '161.5cm'}</span>
            <span>{isMale ? '180cm+' : '168cm+'}</span>
            <span>{isMale ? '193cm' : '178cm'}</span>
          </div>
        </div>
      </div>

      {/* 2. 경제력 및 직장 스펙 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 경제력 및 배경 스펙</div>

        {/* 세전 영끌 연봉 */}
        <div className="sub-field-group">
          <div className="field-title-flex">
            <span className="sub-field-title">
              세전 영끌 연봉: <b className="highlight-val">{fmtSalary(formState.mySalary)}</b>
            </span>
            <span className="sub-field-hint">기본급 + 성과급 + 상여금</span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={2000}
              max={15000}
              step={100}
              value={formState.mySalary}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, mySalary: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>2,000만</span>
            <span>4,500만</span>
            <span>7,500만</span>
            <span>1억 5천+</span>
          </div>
        </div>

        {/* 보유 순자산 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <div className="field-title-flex">
            <span className="sub-field-title">
              보유 순자산: <b className="highlight-val">{fmtAsset(formState.myNetWorth)}</b>
            </span>
            <span className="sub-field-hint">빚 제외 실질 자산</span>
          </div>
          <div className="slider-container" style={{ margin: '8px 0' }}>
            <input
              type="range"
              min={0}
              max={50000}
              step={200}
              value={formState.myNetWorth}
              className="custom-range-slider"
              onChange={(e) => onChange({ ...formState, myNetWorth: Number(e.target.value) })}
            />
          </div>
          <div className="range-ticks-row">
            <span>0원</span>
            <span>5,000만</span>
            <span>1억 5천</span>
            <span>5억원+</span>
          </div>
        </div>

        {/* 주거 상태 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">현재 주거 형태</span>
          <div className="chip-buttons-group grid-2">
            {[
              { val: 'owned', label: '자가 (내 집 마련) 🏠' },
              { val: 'jeonse', label: '전세 거주 🏢' },
              { val: 'monthly', label: '월세 거주 🔑' },
              { val: 'parents', label: '부모님 동거 👨‍👩‍👧' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.myHousing === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, myHousing: item.val as any })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 직장 분류 */}
        <div className="sub-field-group" style={{ marginTop: 18 }}>
          <span className="sub-field-title">현재 직장 / 직업 구분</span>
          <div className="chip-buttons-group grid-2">
            {[
              { val: 'top_tier', label: '대기업 · 전문직 · 금융 💼' },
              { val: 'stable', label: '공기업 · 공무원 · 교직 🏛️' },
              { val: 'general', label: '중견 · 중소기업 직장인 🏢' },
              { val: 'freelancer', label: '프리랜서 · 사업 · 기타 💻' },
            ].map((item) => (
              <button
                key={item.val}
                className={`select-chip-btn ${formState.myJob === item.val ? 'active' : ''}`}
                onClick={() => onChange({ ...formState, myJob: item.val as any })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 실시간 결혼 경쟁력 지수 프리뷰 */}
      <div className="live-preview-box">
        <div className="live-preview-header">
          <span>👑 실시간 결혼 시장 희소 경쟁력</span>
          <span className="live-tag">LIVE</span>
        </div>
        <div className="live-preview-content">
          <div className="prob-highlight">
            대한민국 결혼 시장 <b className="rarity-num">상위 {Math.round(statsPreview.topPercent)}%</b> 육각형 스펙
          </div>
          <p className="prob-desc">
            {statsPreview.topPercent <= 10
              ? '👑 압도적 상위 10% 육각형 인재! 어디서나 탐내는 매력적인 조건이에요'
              : statsPreview.topPercent <= 30
              ? '💎 평균 이상의 든든한 밸런스! 실속 있는 인기 스펙이에요'
              : '🌿 현실적이고 조화로운 안정형 프로필이에요'}
          </p>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 결혼시장 희소성 팩폭 결과 보기
        </button>
      </div>
    </div>
  )
}
