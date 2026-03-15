# ResearchBot v1 배포 후 점검 — 이슈 리포트 & 개선 TODO

**Date**: 2026-03-15
**Deployed URLs**:
- Frontend: https://research-bot-azure.vercel.app
- Backend: https://researchbot-production-113e.up.railway.app

---

## Issue Summary

| # | Issue | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | Project 생성/삭제/관리 UI 없음 | **Critical** | Frontend | Open |
| 2 | Project selector에 ID만 표시 (이름 안 보임) | **High** | Frontend | Open |
| 3 | Database 페이지 project 전환 불가 | **High** | Frontend | Open |
| 4 | Filter 버튼 클릭 시 앱 크래시 | **Critical** | Frontend | Open |
| 5 | Filter 기능 미구현 (static mockup) | **High** | Frontend | Open |
| 6 | Settings 페이지 404 | **Medium** | Frontend | Open |
| 7 | Database 페이지 project_id 하드코드 (=1) | **High** | Frontend | Open |
| 8 | Threshold 설정 UI 동작 미확인 | **Medium** | Frontend | Open |
| 9 | Keyword 관리 페이지 없음 | **Medium** | Frontend | Open |
| 10 | 프로젝트 간 논문 복사 UI 동작 미확인 | **Low** | Frontend | Open |

---

## Detailed Analysis

### Issue 1: Project 관리 UI 없음 (Critical)

**현상**: 프로젝트 생성/삭제/이름변경 기능이 프론트엔드에 없음. API는 전부 구현되어 있음 (`POST/PUT/DELETE /api/projects`).

**영향**: 사용자가 새 리뷰 프로젝트를 만들 수 없음. 현재는 API 직접 호출로만 가능.

**필요한 UI**:
- 프로젝트 생성 다이얼로그 (이름 + 설명 입력)
- 프로젝트 삭제 확인 다이얼로그
- 프로젝트 이름 수정 기능

### Issue 2: Project selector에 ID만 표시 (High)

**현상**: 홈페이지 Active Project 드롭다운에 "1", "2", "3" 같은 숫자만 표시됨.

**원인**: `web/src/app/page.tsx:67-69` — `SelectItem`에서 `p.name`을 표시하지만, 서버 응답의 project 목록이 제대로 렌더링되지 않는 것으로 보임. 또는 combobox 컴포넌트가 value만 보여주는 문제.

**수정**: SelectItem의 표시값을 `{p.id} - {p.name}` 또는 `{p.name}`으로 확인.

### Issue 3: Database 페이지 project 전환 불가 (High)

**현상**: `/papers` 페이지에서 어떤 프로젝트의 논문을 보는지 선택할 수 없음.

**원인**: `web/src/app/papers/page.tsx:26` — `const [projectId] = useState<number>(1);` 하드코드.

**수정**:
- 글로벌 프로젝트 선택 상태 (Context 또는 URL parameter)
- 또는 Database 페이지에도 프로젝트 드롭다운 추가

### Issue 4: Filter 버튼 클릭 시 앱 크래시 (Critical)

**현상**: Database 페이지에서 Filter 버튼 클릭 → "Application error: a client-side exception has occurred"

**원인**: `web/src/components/filter-panel.tsx` — DropdownMenu 컴포넌트 렌더링 오류. `DropdownMenuCheckboxItem`에 `checked` prop이 상태 없이 정적으로 설정되어 있어 React hydration 오류 또는 uncontrolled → controlled 전환 문제 발생 가능.

**수정**: FilterPanel을 상태 기반으로 재구현하거나, 최소한 크래시하지 않도록 수정.

### Issue 5: Filter 기능 미구현 (High)

**현상**: FilterPanel은 static mockup — `onFilterChange`가 빈 함수 `() => {}`로 전달됨. 실제 API 쿼리 파라미터와 연결되지 않음.

**원인**: `web/src/app/papers/page.tsx:85` — `<FilterPanel onFilterChange={() => {}} />`

**수정**:
- Filter 상태를 관리하고 API 호출 시 query params로 전달
- Backend 지원 필터: `is_included`, `keyword`, `year_min`, `year_max`, `score_min`, `score_max`, `q` (텍스트 검색)

### Issue 6: Settings 페이지 404 (Medium)

**현상**: 사이드바에 Settings 링크가 있지만 `/settings` 라우트 없음 → 404.

**수정**:
- Settings 페이지 생성 (`web/src/app/settings/page.tsx`)
- 또는 사이드바에서 Settings 링크 제거 (기능 없으면)
- Settings 후보 기능: auto-select threshold 기본값, 기본 검색 모드, API 키 상태 표시

### Issue 7: Database project_id 하드코드 (High)

**현상**: `papers/page.tsx`에서 `projectId = 1` 고정.

**수정**: Issue 3과 같이 해결 — 글로벌 프로젝트 상태 또는 URL 파라미터.

### Issue 8: Threshold 설정 UI 동작 미확인 (Medium)

**현상**: Database 페이지 상단 "Threshold" 버튼이 있지만 동작 미확인.

**수정**: Threshold 슬라이더 → auto-select API 연결 확인.

### Issue 9: Keyword 관리 페이지 없음 (Medium)

**현상**: API에 키워드 CRUD (`GET/POST/PUT/DELETE /api/keywords`)가 있지만 전용 관리 UI 없음.

**수정**: Keywords 페이지 추가 또는 Settings 페이지 내에 키워드 관리 섹션.

### Issue 10: 프로젝트 간 논문 복사 UI 동작 미확인 (Low)

**현상**: Paper detail에 "Copy to Project" 버튼이 있지만 실제 동작 확인 필요.

---

## Improvement TODO — Antigravity 수정 사항

### P0 — Critical (앱 크래시 / 핵심 기능 부재)

- [ ] P0-1. **Filter 크래시 수정**: `FilterPanel` 컴포넌트의 DropdownMenuCheckboxItem 렌더링 오류 해결. 최소한 크래시하지 않도록.
- [ ] P0-2. **프로젝트 생성 UI**: 홈페이지 또는 사이드바에 "New Project" 버튼 + 생성 다이얼로그 (이름, 설명 입력 → `POST /api/projects`).
- [ ] P0-3. **프로젝트 삭제 UI**: 프로젝트 관리에서 삭제 기능 + 확인 다이얼로그 (`DELETE /api/projects/{id}`).

### P1 — High (핵심 UX 문제)

- [ ] P1-1. **프로젝트 선택 글로벌 상태**: 선택한 프로젝트를 앱 전체에서 공유 (React Context 또는 URL). 홈, Database, Export 모든 페이지에서 같은 프로젝트 사용.
- [ ] P1-2. **프로젝트 selector에 이름 표시**: combobox/select에서 프로젝트 ID가 아닌 이름이 보이도록 수정.
- [ ] P1-3. **Database 페이지 project_id 동적화**: `useState(1)` 하드코드 → 글로벌 프로젝트 상태에서 읽도록.
- [ ] P1-4. **Filter 기능 구현**: FilterPanel의 체크박스 상태 관리 → API query params (`is_included`, `year_min/max`, `keyword`, `q`) 연결.

### P2 — Medium (기능 누락)

- [ ] P2-1. **Settings 페이지**: `/settings` 라우트 생성. 최소: 현재 프로젝트 정보, API 키 연결 상태 표시. 선택: auto-select 기본 threshold 설정.
- [ ] P2-2. **Keyword 관리 UI**: 키워드 목록 조회 + 생성 + variant 편집 + 삭제. Settings 내 또는 별도 페이지.
- [ ] P2-3. **Threshold 동작 확인**: auto-select threshold 슬라이더 → `POST /api/projects/{id}/auto-select` 연결 검증.

### P3 — Low (개선)

- [ ] P3-1. **Copy to Project 동작 검증**: Paper detail의 복사 기능이 실제 API 호출하는지 확인.
- [ ] P3-2. **프로젝트 이름 변경**: 프로젝트 설정에서 이름/설명 수정 (`PUT /api/projects/{id}`).
- [ ] P3-3. **빈 상태 UX**: 프로젝트 0개일 때 "Create your first project" 안내 화면.

---

## Backend API Status (참고)

모든 API는 정상 동작 확인됨. 프론트엔드만 수정하면 됨.

| Endpoint Group | API Status | Frontend Status |
|---------------|------------|----------------|
| Projects CRUD | ✅ 전부 동작 | ❌ 생성/삭제 UI 없음 |
| Search | ✅ 동작 | ⚠ 프로젝트 선택 문제 |
| Papers list/detail | ✅ 동작 | ⚠ project_id 하드코드, Filter 크래시 |
| Include/Exclude | ✅ 동작 | ✅ 동작 |
| Keywords CRUD | ✅ 동작 | ❌ 관리 UI 없음 |
| Export CSV/Zotero | ✅ 동작 | ⚠ 미확인 |
| Auto-select | ✅ 동작 | ⚠ 미확인 |
| Gemini extraction | ✅ 동작 | ✅ 동작 |
| Refetch | ✅ 동작 | ⚠ 미확인 |
| Paper copy | ✅ 동작 | ⚠ 미확인 |
