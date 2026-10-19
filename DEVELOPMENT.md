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

`node tests/city-behavior.cjs`로 교차 경로 양보, 사이렌 생명주기·음소거, 화면 크기별 통화 프레이밍, 건물 가림·복원을 검사합니다. 실제 음향·3D 화면은 브라우저에서도 확인합니다.

`node tests/roaming-stunts.cjs`는 불규칙 도로 선택·경로 확장 연속성·경로 길이 제한·정면 조우 판단·냉가스 점프와 착지를 검사합니다.

`node tests/traffic-safety.cjs`는 11대 차량을 5분간 동시에 움직이며 매 프레임 차체 겹침·공원 경계·정차/재출발·출동 경로·지속 주행을 검사합니다. `TRAFFIC_SEED` 환경 변수로 다른 불규칙 경로를 검사할 수 있습니다.

`node tests/priority-clearance.cjs`는 고객·출동 차량의 정지 상태 출발, 같은 차로·교차 방향의 일반 차량 후진, 로드스터의 대기 시간 중 우선 회피·후방 점프·착지, 충돌 및 도착 여부를 8개 상황으로 검사합니다. 이미 점프 중인 로드스터가 두 우선 차량에 대해 후방 회피로 바꾸는 2개 상황과, 두 차량이 같은 가장자리를 점유했을 때 반대편으로 양보하고 다시 출발하는 상황도 검사합니다.
