import type { Result } from './stats'
import { label } from './copy'

export default function TypeResultCard({ result }: { result: Result }) {
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
    </div>
  )
}
