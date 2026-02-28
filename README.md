# 흑과백 (Black & White)

**더 지니어스** 데스매치로 소개된 1:1 숫자 타일 대결 게임입니다.  
접속한 유저와 컴퓨터가 대결하는 형태로 플레이할 수 있습니다.

- **플레이**: [GitHub Pages에서 실행](https://limssong.github.io/blackwhite/)
- **기술 스택**: React, Next.js, [shadcn/ui](https://ui.shadcn.com/), Tailwind CSS, TypeScript

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
│       └── utils.ts              # 타일 유틸 (흑/백 판별 등)
├── next.config.mjs               # static export, basePath for GitHub Pages
├── package.json                  # packageManager: "pnpm@9.15.0"
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 라이선스

MIT
