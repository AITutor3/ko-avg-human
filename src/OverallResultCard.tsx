import React from 'react'
import type { OverallUniqueness } from './stats'

interface Props {
  overall: OverallUniqueness
  onReset: () => void
}

export const OverallResultCard: React.FC<Props> = ({ overall, onReset }) => {
  const handleShare = async () => {
    const text = `[평균인간] 나는 대한민국 평균에서 ${overall.deviationIndex}% 떨어져 있는 인간! 🦄\n칭호: ${overall.characterTitle}\n나의 평범 이탈 지수 측정해보세요!`
    if (navigator.share) {
      try {
        await navigator.share({
          title: '평균인간 - 내 평범 이탈 지수',
          text,
          url: window.location.href,
        })
        return
      } catch (err) {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(text + '\n' + window.location.href)
    alert('결과 문구와 링크가 클립보드에 복사되었습니다!')
  }

  return (
    <div className="overall-result-card">
      <div className="overall-badge">
        <span className="badge-tag">종합 분석 카드</span>
        <h2 className="overall-title">{overall.characterTitle}</h2>
      </div>

      <div className="overall-score-box">
        <span className="score-label">대한민국 평균과의 거리</span>
        <div className="score-value">
          <span className="number">{overall.deviationIndex}%</span>
          <span className="sub">이탈 지수</span>
        </div>
      </div>

      <p className="overall-summary">{overall.subDescription}</p>

      {overall.tags.length > 0 && (
        <div className="overall-tags">
          {overall.tags.map((tag, idx) => (
            <span key={idx} className="tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="disclaimer-note">
        ※ 정확한 통계지표처럼 오해되지 않도록 설계된 오락성/재미용 자체 평균과의 거리 지수입니다.
      </div>

      <div className="overall-actions">
        <button className="btn-primary" onClick={handleShare}>
          🚀 친구 단톡방에 공유하기
        </button>
        <button className="btn-secondary" onClick={onReset}>
          🔄 다시 측정하기
        </button>
      </div>
    </div>
  )
}

