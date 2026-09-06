import type { Result } from './stats'
import { label } from './copy'

interface Props {
  result: Result
  onShare?: () => void
  onSave?: () => void
  busy?: boolean
}

export default function TypeResultCard({ result, onShare, onSave, busy }: Props) {
  const lab = label(result)
  const card = lab.card ?? {
    badgeTitle: lab.name,
    subTitle: '나만의 독특한 유형',
    bubbleLeft: '남들과 비교해도',
    bubbleRight: '나다운 게 제일 좋아!',
    characterEmoji: `${lab.emoji}🐻`,
  }

  return (
    <div className="type-card-container">
      {card.subTitle && (
        <div className="type-card-subtitle">
          {card.subTitle.split(' ').map((word, idx) => (
            <span key={idx} className={idx % 2 === 1 ? 'highlight' : ''}>
              {word}{' '}
            </span>
          ))}
        </div>
      )}

      <div className="type-card-title-box">
        <span className="bracket left">⌜</span>
        <h2 className="type-card-title">{card.badgeTitle}</h2>
        <span className="bracket right">⌟</span>
      </div>

      <div className="type-card-visual">
        <div className="speech-bubble left-bubble">
          <p>{card.bubbleLeft}</p>
          <div className="tail left-tail" />
        </div>

        <div className="character-avatar-wrap">
          <div className="aura-bg" />
          <div className="character-avatar">
            <span className="char-emoji">{card.characterEmoji}</span>
          </div>
        </div>

        <div className="speech-bubble right-bubble">
          <p>{card.bubbleRight}</p>
          <div className="tail right-tail" />
        </div>
      </div>

      <div className="type-card-footer">
        <div className="top-badge">
          상위 {Math.round(result.topPercent)}% · {lab.name}
        </div>
      </div>

      {/* 상징 버튼 그룹 (공유하기 & 이미지 저장하기) */}
      {(onShare || onSave) && (
        <div className="type-card-actions">
          {onShare && (
            <button className="icon-action-btn share-btn" title="공유하기" disabled={busy} onClick={onShare}>
              <span className="icon">🚀</span>
              <span className="label">{busy ? '생성 중…' : '공유하기'}</span>
            </button>
          )}
          {onSave && (
            <button className="icon-action-btn save-btn" title="이미지 저장하기" disabled={busy} onClick={onSave}>
              <span className="icon">💾</span>
              <span className="label">저장하기</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
