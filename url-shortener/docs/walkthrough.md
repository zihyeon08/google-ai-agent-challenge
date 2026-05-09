# TDD 사이클 및 테스트 수행 결과 (Walkthrough)

이 문서는 URL Shortener 프로젝트가 어떻게 TDD(Test-Driven Development) 방법론에 따라 설계되고 구현되었는지, 그리고 그 테스트 결과가 어떠한지 증명하는 포트폴리오 성격의 문서입니다.

## 1. 아키텍처 및 TDD 접근 방식
프로젝트는 프레임워크와 비즈니스 로직의 결합도를 낮추기 위해 **계층형 아키텍처(Layered Architecture)**로 설계되었습니다.
TDD 사이클(Red -> Green -> Refactor)을 빠르고 독립적으로 수행하기 위해, 실제 데이터베이스를 연결하는 대신 `InMemoryUrlRepository`를 사용하여 데이터 계층을 완벽히 Mocking 했습니다.

## 2. TDD 사이클 수행 과정

### Phase 1: URL 단축 기능 (Shorten URL)
* **[RED]**: 먼저 `UrlService.test.ts`에 유효한 URL 입력 시 Short Key 반환, 잘못된 URL 입력 시 예외 발생, 동일 URL 중복 요청 시 기존 키 반환(멱등성)을 검증하는 실패하는 테스트 코드를 작성했습니다.
* **[GREEN]**: 테스트 통과를 목표로 `nanoid` 패키지를 활용한 생성 로직과 `URL` 내장 객체를 이용한 검증 로직을 `UrlService`에 구현했습니다.
* **[REFACTOR]**: 코드를 가다듬고 정규표현식 대신 Node.js 내장 객체 검증으로 성능 및 안정성을 높였습니다.

### Phase 2: 조회 및 만료(TTL) 처리 로직
* **[RED]**: 원본 URL을 성공적으로 조회했을 때 `accessCount`가 1 증가하는지, 존재하지 않는 키일 때 404 예외를 던지는지 테스트했습니다. 특히 24시간 TTL 만료를 테스트하기 위해 `jest.useFakeTimers()`를 통해 가상의 시간(24시간 + 1초)을 흐르게 하여 `ExpiredException` 발생 여부를 검증했습니다.
* **[GREEN]**: Repository의 데이터를 조회하고 `Date.now() - createdAt`이 24시간을 초과하는지 검증하는 로직을 추가하여 모든 테스트를 성공시켰습니다.

## 3. 테스트 실행 결과 증명

터미널에서 `npm run test`를 실행하여 도출된 단위 테스트 실행 결과입니다.

```text
PASS src/services/UrlService.test.ts
  UrlService
    shortenUrl
      ✓ should generate a short key for a new valid URL (1 ms)
      ✓ should throw InvalidUrlException for an invalid URL (2 ms)
      ✓ should return the existing short key if the URL was already shortened (1 ms)
    getOriginalUrl
      ✓ should return the original URL and increment access count
      ✓ should throw NotFoundException for non-existent short key
      ✓ should throw ExpiredException for a short key older than 24 hours (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.372 s
Ran all test suites matching src/services/UrlService.test.ts.
```
모든 비즈니스 로직(URL 단축, 예외 처리, 중복 확인, TTL 검증, 조회 수 증가)이 100% 성공적으로 검증되었습니다.

## 4. E2E 및 통합 기능 테스트 (Manual Verification)

단위 테스트를 통과한 코드를 바탕으로 API Controller와 Tailwind CSS 기반의 UI를 연동하였으며, 수동 테스트 결과 아래 사항들이 정상 동작함을 확인했습니다.

1. **URL 유효성 검사 UI**: 형식이 맞지 않는 URL을 입력하고 폼을 제출하면, 즉각적으로 `Invalid URL format` 에러 텍스트가 표시됩니다.
2. **Short ID 발급 및 API 통신**: `https://github.com` 등 정상 URL을 입력하면 로딩 스피너 동작 후, 하단에 `http://localhost:3000/ab1cd2ef` 형태의 단축 URL 컴포넌트가 노출됩니다.
3. **클립보드 복사**: Copy 버튼 클릭 시 성공적으로 클립보드에 복사되며, 버튼 텍스트가 2초간 `Copied!`로 변경됩니다.
4. **리다이렉트 (301)**: 브라우저 주소창에 생성된 단축 URL을 입력하면 서버 사이드(`app/[shortId]/route.ts`)에서 즉시 원본 링크로 301 리다이렉트 시킵니다.
