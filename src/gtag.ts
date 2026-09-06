export const GA_TRACKING_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID ||
  import.meta.env.GA_MEASUREMENT_ID ||
  'G-5335J9HMVZ'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// GA4 스크립트 동적 로드 함수 (환경 변수 ID가 존재할 때 로드)
export const initGA = () => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return
  if (document.getElementById('ga-gtag-script')) return

  const script = document.createElement('script')
  script.id = 'ga-gtag-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer?.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_TRACKING_ID, { send_page_view: true })
}

// 페이지뷰 트래킹 (스태이지/화면 전환 시 호출)
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
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
