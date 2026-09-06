// Google Analytics (GA4) 트래킹 유틸리티
// 환경 변수 VITE_GA_MEASUREMENT_ID가 설정되어 있으면 사용하고, 기본값으로 플레이스홀더를 제공합니다.

export const GA_TRACKING_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// 페이지뷰 트래킹 (스태이지/화면 전환 시 호출)
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// 커스텀 이벤트 트래킹 (버튼 클릭, 테스트 선택, 공유 등)
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}
