# URL Shortener 구현 계획서 (Implementation Plan)

## 1. 개발 환경 및 기술 스택

* **Framework:** Next.js (App Router 기반)
* **Styling:** Tailwind CSS
* **Testing Tool:** Jest (비즈니스 로직 및 API 테스트), React Testing Library (UI 컴포넌트 테스트)
* **Language:** TypeScript

## 2. 시스템 아키텍처 설계 (비즈니스 로직 분리)

TDD를 원활하게 진행하고 외부 의존성을 낮추기 위해 계층형 아키텍처(Layered Architecture)를 채택합니다.

* **Presentation Layer (UI):** `app/page.tsx` (Tailwind CSS를 활용한 URL 입력/결과 출력 화면)
* **Controller Layer (API):** Next.js Route Handlers (`app/api/shorten/route.ts`, `app/[shortId]/route.ts`)
* **Service Layer (Business Logic):** `src/services/UrlService.ts` (프레임워크나 DB에 종속되지 않는 순수 비즈니스 로직)
* **Repository Layer (Data Access):** `src/repositories/UrlRepository.ts` (DB 접근 인터페이스)

## 3. 외부 의존성(DB) Mocking 전략

* 실제 데이터베이스(MySQL, Redis 등) 연결 전, TDD 사이클을 돌리기 위해 `UrlRepository` 인터페이스를 정의합니다.
* 테스트 환경에서는 이 인터페이스를 구현한 `InMemoryUrlRepository` (JS `Map` 객체 활용)를 사용하여 DB를 완벽하게 Mocking합니다.
* 데이터 모델 (Entity):
```typescript
type UrlRecord = {
  id: string;            // Short Key
  originalUrl: string;   // 원본 긴 URL
  createdAt: number;     // 생성 시간 (TTL 검증용)
  accessCount: number;   // 접근 횟수
};

```



## 4. 기능별 TDD 구현 스텝 (Red -> Green -> Refactor)

### Step 1: URL 축약 기능

* **[Red] 테스트 목표:** 긴 URL을 `UrlService.shortenUrl()` 메서드에 입력하면 6~8자리의 영문/숫자 조합 문자열(Short Key)을 반환해야 한다.
* **구현 로직:** `nanoid` 라이브러리 활용 또는 해시 생성 후 Base62 인코딩 처리.
* **[Refactor] 고려사항:** URL 유효성 검증(정규식) 로직을 분리.

### Step 2: 멱등성 (Idempotency) 보장

* **[Red] 테스트 목표:** 이미 등록된 긴 URL을 다시 입력할 경우, 새로운 키를 생성하지 않고 기존의 Short Key를 반환해야 한다.
* **구현 로직:** 생성 전 Repository의 `findByOriginalUrl()`을 호출하여 존재 여부 확인 로직 추가.

### Step 3: 리다이렉트 (원본 URL 반환)

* **[Red] 테스트 목표:** Short Key를 `UrlService.getOriginalUrl()`에 입력하면 매핑된 원본 URL을 반환해야 한다.
* **구현 로직:** Repository의 `findById()`를 호출하여 원본 URL 반환. Next.js의 동적 라우팅(`app/[shortId]/route.ts`)에서 `NextResponse.redirect()`와 연동.

### Step 4: TTL (24시간) 만료 처리

* **[Red] 테스트 목표:** URL 생성 후 24시간이 지난 시점에 접근을 시도하면 예외(ExpiredUrlError)가 발생해야 한다.
* **구현 로직:** Jest의 Mock Timers (`jest.useFakeTimers()`)를 사용하여 시간을 24시간 후로 조작한 뒤 테스트 진행. 조회 시점의 현재 시간과 `createdAt`을 비교하는 로직 추가.

### Step 5: 접근 횟수 (Count) 증가

* **[Red] 테스트 목표:** Short URL로 성공적으로 원본 URL을 조회할 때마다 해당 레코드의 `accessCount`가 1씩 증가해야 한다.
* **구현 로직:** `getOriginalUrl()` 서비스 메서드 내에서 Repository의 `incrementAccessCount()` 호출 로직 추가.

## 5. 엣지 케이스 (Edge Case) 기반 테스트 설계

테스트 코드에 다음 예외 상황들을 명시적으로 포함합니다.

1. **잘못된 URL 형식:** `http://` 또는 `https://`로 시작하지 않거나 도메인 형식이 아닌 문자열 입력 시 `InvalidUrlException` 발생.
2. **존재하지 않는 Short Key:** DB에 없는 식별자로 접근 시 `NotFoundException` (HTTP 404) 처리.
3. **만료된 Short Key 접근:** TTL이 지난 키로 접근 시 `ExpiredException` (HTTP 410 Gone) 처리 및 카운트 증가 방지.
4. **동시성 이슈(가정):** 동일한 URL 단축 요청이 동시에 여러 번 들어올 때의 멱등성 보장 검증.

## 6. UI 구현 계획 (Tailwind CSS)

Next.js 환경에 맞춰 직관적이고 심플한 단일 페이지 UI를 구성합니다.

* **Layout:** 화면 중앙 정렬 (Flexbox/Grid 활용, `h-screen flex items-center justify-center`).
* **Input Area:** 넓은 텍스트 입력창과 뚜렷한 색상의 '축약하기' 버튼 (`focus:ring`, `hover` 액션 추가).
* **Result Area:** 단축 성공 시 클립보드 복사 아이콘 버튼 제공. 에러 발생 시 입력창 하단에 붉은색(`text-red-500`) 텍스트로 에러 메시지 표시.

```

```