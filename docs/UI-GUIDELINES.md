# ResearchBot UI/UX Design Guidelines (for Claude)

당신은 ResearchBot의 프론트엔드 개발 시 다음의 엄격한 UI/UX 디자인 가이드라인을 반드시 준수하여 코드를 작성해야 합니다.
기능 구현은 당신의 몫이지만, 브라우저에 렌더링되는 시각적 결과물은 아래의 "프리미엄하고 현대적인" Antigravity 디자인 감각을 유지해야 합니다.

## 1. 기술 스택 및 파운데이션
- **Framework**: Next.js (App Router), React Server/Client Components 분리 철저
- **Styling**: Tailwind CSS, `shadcn/ui` 컴포넌트 우선 사용
- **Icons**: `lucide-react` (보통 `w-4 h-4` 사이즈 사용)
- **Typography**: `next/font/google`의 `Geist` (기본) 및 `Geist_Mono` (코드/숫자) 적용
- **Theme**: `next-themes`를 통한 Dark/Light 모드 완벽 지원. 하드코딩된 색상(예: `bg-white`, `text-black`) 사용을 금지하고, 반드시 Tailwind 환경 변수(`bg-background`, `text-foreground`, `text-muted-foreground`)를 사용합니다.

## 2. 레이아웃 & 스페이싱 (Layout & Spacing)
- **여백 (White Space)**: 콘텐츠가 숨을 쉴 수 있도록 넓은 여백을 사용합니다. 컨테이너 내부 패딩은 최소 `p-6`에서 `p-8`을 기본으로 합니다.
- **읽기 편한 너비**: 중앙 정렬된 메인 콘텐츠 영역은 가독성을 위해 `max-w-5xl` 또는 `max-w-3xl` 등으로 제한합니다. (`mx-auto` 사용)
- **그리드 시스템**: 정보가 많은 카드 목록은 `grid gap-6 md:grid-cols-2 lg:grid-cols-3` 형태의 반응형 그리드를 적극 활용합니다.

## 3. 핵심 시각 디자인 요소 (Visual Elements)
- **헤더 & 네비게이션**: 상단 고정 헤더는 Glassmorphism 효과를 줍니다.
  - 클래스 예시: `sticky top-0 z-10 bg-background/95 backdrop-blur border-b`
- **카드 (Cards)**: 정보를 담는 컨테이너는 모서리가 둥글고(`rounded-xl`), 미세한 테두리(`border`)와 그림자(`shadow-sm`)를 가집니다.
  - 마우스 호버 시 살짝 떠오르는 느낌의 인터랙션을 추가합니다: `hover:shadow-md transition-shadow`
- **타이포그래피 계층**: 제목은 자간을 좁히고 두껍게 처리하여 세련됨을 줍니다.
  - `text-2xl font-bold tracking-tight`
- **시맨틱 컬러 배지 (Score/Status)**: 점수나 상태를 나타낼 때는 배경 투명도를 낮춘 파스텔톤 컬러 배지를 커스텀하여 사용합니다.
  - ✅ 높음/성공: `bg-green-500/10 text-green-700`
  - ⚠️ 중간/보류: `bg-yellow-500/10 text-yellow-700`
  - ❌ 낮음/실패: `bg-red-500/10 text-red-700`

## 4. 마이크로 인터랙션 (Micro-interactions)
- **버튼 (Buttons)**: 텍스트만 있는 버튼은 피하고, 좌측에 의미를 나타내는 Lucide 아이콘을 함께 배치합니다. (`gap-2` 사용)
  - `disabled` 상태일 때는 툴팁이나 `opacity-50` 처리를 확실히 하고 커서 스타일을 변경합니다. (`disabled:pointer-events-none disabled:opacity-50`)
- **로딩 상태 (Loading States)**: 페이지나 컴포넌트 로딩 시 텍스트 대신 `lucide-react`의 `Loader2 className="animate-spin"` 아이콘이나 `shadcn/ui`의 `Skeleton` 컴포넌트를 사용해 레이아웃 시프트를 방지합니다.

## 5. 데이터 표시
- **초록 및 긴 텍스트**: `line-clamp-2` 또는 `line-clamp-3`를 사용하여 카드의 높이가 균일하게 유지되도록 합니다.
- **구분선**: 연관성 없는 데이터 블록 사이에는 `Separator` (`border-t` 또는 `border-b`) 컴포넌트를 사용하여 시각적으로 분리합니다.

> **Claude 진행 가이드:** 코드 구현 전 이 가이드라인을 상기하고, "단순히 동작하는" UI가 아니라 "사용자가 보고 감탄할 수 있는" 컴포넌트를 만들어 주세요. 임시방편의 inline-style은 피하고 체계적인 Tailwind 유틸리티 조합을 사용하세요.
