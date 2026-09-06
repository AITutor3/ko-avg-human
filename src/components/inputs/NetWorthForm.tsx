import { useState, useEffect } from 'react'
import type { AgeBucket, Gender } from '../../stats'
import { fmtAsset } from '../../stats'
import type { NetWorthInput } from '../../types/input'

interface Props {
  age: AgeBucket | null
  gender: Gender | null
  formState: NetWorthInput
  onChange: (next: NetWorthInput) => void
  setAge: (a: AgeBucket) => void
  setGender: (g: Gender) => void
  onNext: () => void
}

export default function NetWorthForm({
  age,
  gender,
  formState,
  onChange,
  setAge,
  setGender,
  onNext,
}: Props) {
  const [useDetailMode, setUseDetailMode] = useState(false)

  // 상세 입력 시 실시간 순자산 계산
  useEffect(() => {
    if (useDetailMode) {
      const net = Math.max(0, formState.financialAssets + formState.realEstate - formState.debts)
      onChange({ ...formState, netWorth: net })
    }
  }, [formState.financialAssets, formState.realEstate, formState.debts, useDetailMode])

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

      {/* 2. 자산 입력 방식 토글 및 금액 입력 */}
      <div className="form-card-section" style={{ marginTop: 16 }}>
        <div className="section-label-badge">Step 2. 순자산 입력</div>

        <div className="mode-toggle-row" style={{ marginBottom: 16 }}>
          <button
            className={`mode-btn ${!useDetailMode ? 'active' : ''}`}
            onClick={() => setUseDetailMode(false)}
          >
            간편 순자산 입력
          </button>
          <button
            className={`mode-btn ${useDetailMode ? 'active' : ''}`}
            onClick={() => setUseDetailMode(true)}
          >
            자산·부채 세부 계산기
          </button>
        </div>

        {!useDetailMode ? (
          /* 간편 슬라이더 모드 */
          <div className="sub-field-group">
            <div className="field-title-flex">
              <span className="sub-field-title">
                순자산 (총자산 − 대출/부채): <b className="highlight-val">{fmtAsset(formState.netWorth)}</b>
              </span>
            </div>
            <div className="slider-container" style={{ margin: '10px 0' }}>
              <input
                type="range"
                min={0}
                max={100000}
                step={500}
                value={formState.netWorth}
                className="custom-range-slider"
                onChange={(e) => onChange({ ...formState, netWorth: Number(e.target.value) })}
              />
            </div>
            <div className="range-ticks-row">
              <span>0원</span>
              <span>1억원</span>
              <span>3억원</span>
              <span>10억원+</span>
            </div>
          </div>
        ) : (
          /* 세부 계산 모드 */
          <div className="detail-calc-box">
            {/* 금융자산 */}
            <div className="sub-field-group">
              <div className="field-title-flex">
                <span className="sub-field-title">
                  ① 금융자산 (예적금·주식·코인): <b>{fmtAsset(formState.financialAssets)}</b>
                </span>
              </div>
              <div className="slider-container" style={{ margin: '6px 0' }}>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={200}
                  value={formState.financialAssets}
                  className="custom-range-slider"
                  onChange={(e) => onChange({ ...formState, financialAssets: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* 부동산/보증금 */}
            <div className="sub-field-group" style={{ marginTop: 14 }}>
              <div className="field-title-flex">
                <span className="sub-field-title">
                  ② 부동산 / 전세보증금: <b>{fmtAsset(formState.realEstate)}</b>
                </span>
              </div>
              <div className="slider-container" style={{ margin: '6px 0' }}>
                <input
                  type="range"
                  min={0}
                  max={80000}
                  step={500}
                  value={formState.realEstate}
                  className="custom-range-slider"
                  onChange={(e) => onChange({ ...formState, realEstate: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* 대출/부채 */}
            <div className="sub-field-group" style={{ marginTop: 14 }}>
              <div className="field-title-flex">
                <span className="sub-field-title" style={{ color: '#ef4444' }}>
                  ③ 대출 및 부채 (−): <b>{fmtAsset(formState.debts)}</b>
                </span>
              </div>
              <div className="slider-container" style={{ margin: '6px 0' }}>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={200}
                  value={formState.debts}
                  className="custom-range-slider"
                  onChange={(e) => onChange({ ...formState, debts: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* 자동 계산 합계 */}
            <div className="calculated-total-summary">
              <span>최종 실질 순자산 (① + ② − ③)</span>
              <b className="total-val">{fmtAsset(formState.netWorth)}</b>
            </div>
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="input-submit-wrap">
        <button className="btn-primary-blue" disabled={!age || !gender} onClick={onNext}>
          🔥 내 순자산 팩폭 결과 확인하기
        </button>
      </div>
    </div>
  )
}
