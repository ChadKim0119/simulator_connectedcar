# 로컬 수정 환경

## 실행

macOS Finder에서 `start.command`를 더블 클릭하거나, 이 폴더의 터미널에서 실행합니다.

```sh
./start.command
```

브라우저에서 http://localhost:8000 을 엽니다. `index.html` 수정 후 새로고침하면 반영됩니다. 종료는 터미널에서 `Ctrl+C`입니다. 포트가 사용 중이면 `PORT=8001 ./start.command`로 실행합니다.

서버 없이 `index.html`을 브라우저로 직접 열어도 실행할 수 있습니다.

## 프로젝트 구조

- `index.html`: HTML, CSS, JavaScript 및 시나리오 전체
- `README.md`: 시연 흐름, 기능, 단축키
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: 아이콘

Node.js, npm 패키지, API 키, 별도 빌드는 필요하지 않습니다. Python 3로 로컬 서버를 실행합니다. Three.js r128은 외부 CDN에서 로드하므로 브라우저의 인터넷 연결이 필요합니다.

## Git 작업

원격 저장소: https://github.com/ChadKim0119/simulator_connectedcar.git

변경 내용을 확인하고 작업 브랜치에서 커밋합니다.

```sh
git status
git diff
```

## 환경 구성 검증

- 원본 파일 5개, 트리 및 최신 커밋의 Git SHA 일치 확인
- `git fsck --full` 통과
- 인라인 JavaScript 문법 및 실행 스크립트 구문 검사 통과
- 에이전트 실행 환경에서 로컬 포트 열기가 차단되어 서버 응답 및 브라우저 동작 검증은 수행하지 못했습니다. Mac의 일반 터미널에서 위 실행 명령을 사용하세요.

## 도시 동작 검사

`node tests/city-behavior.cjs`로 사이렌 생명주기·음소거, 화면 크기별 통화 프레이밍, 건물 가림·복원을 검사합니다. 실제 음향·3D 화면은 브라우저에서도 확인합니다.

`node tests/roaming-stunts.cjs`는 불규칙 도로 선택·경로 확장 연속성·경로 길이 제한과 공원 캐치볼·축구 애니메이션을 검사합니다.

`node tests/npc-traffic.cjs`는 NPC 6대(사이버트럭·로드스터·프리우스)와 함께 8분 자유 주행(중간 정차·재출발 포함), 긴급출동·견인 5개 경로, 정비 예약 3개 딜러 경로, 실제 시연 순서(자유 주행 중 아무 때나 경고 → 갓길 정차 → 출동 → 견인 / 정비 예약) 8회를 돌리며 매 프레임 ① 차체 겹침 ② 내 차·출동/견인 차량이 한 번이라도 막히는지 ③ NPC가 옆으로 미끄러지는지 ④ NPC 교착을 검사합니다. `TRAFFIC_SEED` 환경 변수로 다른 무작위 경로를 검사합니다.


`node tests/ecare-notifications.cjs`는 긴급·정비 경고의 VEP(TSP) → VDP → 앱·HU 전송 순서와 콜센터 웹·DMS 직접 연계, 초기화 시 고객 전송 중단을 검사합니다.
