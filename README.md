# 나 어디쯤

한국인 평균과 비교해 내 위치를 **분포곡선**으로 보여주고, **공유 카드**로 자랑/충격/공감하게 만드는 모바일 특화 웹앱.

MVP 주제: **스마트폰 하루 사용시간**

## 흐름 (6화면)

랜딩 → 입력(나이·성별·사용시간) → 분석중 연출 → 분포곡선 + 내 위치 → 공유 카드(PNG 저장/Web Share) → 확산(친구 링크·다시하기)

## 개발

```bash
npm install
npm run dev      # http://localhost:5173 (모바일에서 보려면 같은 와이파이 + 표시되는 Network 주소)
npm run build
npm run preview
```

## 구조

- `src/stats.ts` — 로그정규분포 기반 백분위 모델, 그룹별 중앙값 상수
- `src/copy.ts` — 라벨/헤드라인/문구 (판정이 아니라 "위치 표시" 톤)
- `src/DistributionChart.tsx` — SVG 밀도곡선 + 평균선 + 내 위치 핀
- `src/App.tsx` — 6화면 상태머신 + 공유 카드 캡처(html-to-image)

## 주의

통계 수치는 공개 조사 기반의 근사값입니다. 실제 통계청/방통위 데이터로 `MEDIAN_MIN`, `GENDER_ADJUST`, `SIGMA`를 보정하세요.
