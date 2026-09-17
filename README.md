# Dumpy 발표자료

[발표자료 페이지 열기](https://kdhunters.github.io/dumpy-presentation/)

PR 승인 후 `main`에 병합하면 자동으로 반영됩니다. 사이트에 적용되기까지 몇 분 걸릴 수 있습니다.

현재 로컬 통합본은 본문 25페이지와 Appendix 5페이지, 총 30페이지입니다. 기존 표지 다음에 GitHub `main`의 2–16페이지를 넣고, 기존 나머지 자료를 17–25페이지로 연결했습니다. Appendix는 26–30페이지이며 전체 쪽번호를 `1 / 30`부터 `30 / 30`까지 연속으로 표시합니다.

- `index.html`, `deck.js`: 전체 순서와 탐색, 기존 발표자료
- `github-slides.html`, `github-slides.css`, `github-slides.js`: 가져온 2–16페이지와 확장 애니메이션
- `appendix-slides.html`, `appendix-slides.css`, `appendix-slides.js`: GitHub에서 가져온 Appendix 5페이지, 스타일과 탐색 동작
- `deck-chrome.css`: 모든 문서의 공통 배경과 Footer. 좌측 팀명·Dumpy, 우측 연속 쪽번호를 같은 위치·글꼴·색상으로 표시하며 우상단 브랜드 표시는 제거했습니다.
- `styles.css`, `part2.css`, `bm-slides.css`: 기존 발표자료 스타일
- `schedule-demo.*`, `source-demo.*`: 일정 및 원문 확인 시연

로컬 서버에서 `index.html`을 열어 확인합니다. 방향키·Space·PageUp/PageDown으로 이동하고, Home/End로 처음·끝으로 이동하며, F로 전체화면을 전환합니다. 단축키 안내는 화면에 표시하지 않습니다.

가져온 코드의 출처와 검증 결과는 [통합 검증 기록](docs/github-import.md)에 정리했습니다.
