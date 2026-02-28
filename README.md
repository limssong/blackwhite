# 흑과백 (Black & White)

**더 지니어스** 데스매치로 소개된 1:1 숫자 타일 대결 게임입니다.

- **1인용**: 사람 vs 컴퓨터
- **2인용**: 같은 페이지에 접속한 상대와 실시간 대전 (Firebase 필요)

- **플레이**: [GitHub Pages에서 실행](https://limssong.github.io/blackwhite/)
- **기술 스택**: React, Next.js, [shadcn/ui](https://ui.shadcn.com/), Tailwind CSS, TypeScript, Firebase (2인용)

---

## 룰 요약

- 두 플레이어는 **0~8까지 9장의 숫자 타일**을 받습니다.
- **흑색 타일**: 0, 2, 4, 6, 8  
  **백색 타일**: 1, 3, 5, 7
- **1라운드 선**은 가위바위보 승자. 2라운드부터는 **전 라운드 승자가 선**, 무승부면 **직전 선이 다시 선**.
- 선이 한 장을 **뒷면으로 제시**한 뒤, 후가 한 장을 제시합니다.
- **숫자가 더 큰 쪽이 승리**. 상대가 낸 숫자는 끝까지 **비공개**이며, 남은 타일을 흑/백 정보로만 유추해야 합니다.
- **9번 대결** 후 승점이 높은 쪽이 승리. **동점이면 연장전**(새 9장 타일)을 진행합니다.

---

## 로컬에서 실행 (pnpm)

이 프로젝트는 **pnpm**으로 설치 및 실행합니다.

### 요구 사항

- Node.js 18+
- [pnpm](https://pnpm.io/) 설치

```bash
# pnpm이 없다면
npm install -g pnpm
```

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 빌드 결과물로 로컬 실행
pnpm start
```

### 린트

```bash
pnpm lint
```

---

## 사람 vs 사람 (2인 대전)

2인용 모드를 사용하려면 **Firebase** 프로젝트가 필요합니다.

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. **Firestore Database** 생성 (테스트 모드로 시작 가능)
3. **설정 → 일반 → 앱**에서 웹 앱 추가 후 나온 설정값 복사
4. 프로젝트 루트에 `.env.local` 생성 후 아래 변수 채우기 (`.env.example` 참고)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

5. **사람 vs 사람** 선택 시 로비에 접속되며, **현재 접속 중인 사용자 목록(IP)**이 표시됩니다.  
   (IP는 [ipify](https://www.ipify.org/) API로 조회됩니다.)
6. **Firestore 보안 규칙** 설정 (아래 참고).

---

## Firestore 보안 규칙 설정

`lobby`, `games`는 **앱이 사용하는 컬렉션 이름**이라, 앱에서 로비/게임을 한 번이라도 사용하기 전에는 Firebase 콘솔 **데이터** 탭에 안 보입니다. 규칙만 먼저 설정하면 됩니다.

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 선택
2. 왼쪽 메뉴에서 **Firestore Database** 클릭
3. 상단에서 **규칙** 탭 클릭 (데이터 탭이 아님)
4. 기존 내용을 지우고 **아래 회색 박스 안의 글만** 복사해서 붙여넣기 (줄 번호나 ``` 기호는 복사하지 마세요). 그다음 **게시** 클릭.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /lobby/{userId} {
      allow read, write: if true;
    }
    match /games/{gameId} {
      allow read, write: if true;
    }
  }
}
```

- 이 규칙은 **개발/테스트용**으로, 누구나 `lobby`, `games`를 읽고 쓸 수 있습니다.
- 나중에 인증(로그인)을 붙이면 `if request.auth != null` 등으로 제한할 수 있습니다.

프로젝트 루트의 `firestore.rules` 파일에도 같은 내용이 있습니다.

---

## GitHub Pages 배포

- 저장소 **Settings → Pages**에서  
  **Source**: `GitHub Actions`  
  **Build and deployment**: `Deploy from a branch`가 아니라 **GitHub Actions** 워크플로로 배포되도록 설정되어 있습니다.
- `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 실행되어 `pnpm install` → `pnpm build` 후 `out` 디렉터리를 GitHub Pages에 배포합니다.
- 배포 URL: `https://<username>.github.io/blackwhite/`

---

## 프로젝트 구조

```
blackwhite/
├── .github/workflows/deploy.yml   # GitHub Pages 배포 (pnpm 사용)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # 흑과백 게임 메인 페이지
│   │   └── globals.css
│   └── lib/
│       ├── utils.ts              # 타일 유틸 (흑/백 판별 등)
│       ├── firebase.ts           # Firebase 초기화
│       ├── useLobby.ts           # 2인용 로비 (접속자 목록)
│       └── pvpGame.ts           # 2인용 매칭/게임 상태
├── next.config.mjs               # static export, basePath for GitHub Pages
├── package.json                  # packageManager: "pnpm@9.15.0"
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 라이선스

MIT
