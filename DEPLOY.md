# Vercel 배포 가이드

이 프로젝트는 Next.js 앱이라 Vercel에 별도 설정 없이 올릴 수 있습니다.
환경 변수나 데이터베이스가 필요 없고, 페이지 전체가 정적으로 미리 생성됩니다.

배포 방법은 두 가지입니다.

| 방법 | 장점 | 추천 상황 |
| --- | --- | --- |
| 1. GitHub 연동 | `git push`만 하면 자동 배포, PR마다 미리보기 주소 생성 | 대부분의 경우 (권장) |
| 2. Vercel CLI | GitHub 없이 터미널에서 바로 배포 | 빠르게 한 번 올려볼 때 |

---

## 방법 1. GitHub 연동 (권장)

코드는 이미 GitHub 저장소 [`jung-co/neww-timer`](https://github.com/jung-co/neww-timer)에 올라가 있습니다.

### 1) Vercel 가입 및 로그인

1. [vercel.com](https://vercel.com)에 접속합니다.
2. **Sign Up** → **Continue with GitHub**를 선택해 GitHub 계정으로 가입합니다.

### 2) 프로젝트 가져오기

1. 대시보드에서 **Add New…** → **Project**를 누릅니다.
2. **Import Git Repository** 목록에서 `neww-timer`를 찾아 **Import**를 누릅니다.
   - 목록에 저장소가 안 보이면 **Adjust GitHub App Permissions**를 눌러 Vercel이 해당 저장소에 접근할 수 있도록 허용합니다.

### 3) 설정 확인 후 배포

설정 화면에서 아래처럼 자동으로 잡혀 있는지만 확인하고, 바꿀 것은 없습니다.

| 항목 | 값 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `next build` (기본값) |
| Output Directory | 기본값 |
| Install Command | `npm install` (기본값) |
| Environment Variables | 없음 |

**Deploy**를 누르면 1분 안팎으로 빌드가 끝나고 `https://neww-timer-xxxx.vercel.app` 같은 주소가 생깁니다.

### 4) 이후 수정사항 반영

`main` 브랜치에 push하면 자동으로 다시 배포됩니다.
이 저장소는 원격 이름이 `origin`이 아니라 `neww-timer`이므로 아래처럼 push합니다.

```bash
git add .
git commit -m "변경 내용"
git push neww-timer main
```

- `main` 브랜치 push → **프로덕션** 배포 (실제 주소에 반영)
- 다른 브랜치 push 또는 Pull Request → **프리뷰(미리보기)** 배포 (별도 주소 생성, 실제 주소에는 영향 없음)

---

## 방법 2. Vercel CLI

### 1) CLI 설치 및 로그인

```bash
npm install -g vercel
vercel login
```

`vercel login`을 실행하면 로그인 방법을 고르라고 나옵니다. GitHub를 선택하면 브라우저가 열리고, 승인하면 터미널로 돌아옵니다.

### 2) 미리보기 배포

프로젝트 폴더에서 실행합니다.

```bash
cd /Users/jung-yoon/timer
vercel
```

처음 실행하면 몇 가지를 묻습니다. 보통 기본값(Enter)으로 넘어가면 됩니다.

```
? Set up and deploy "~/timer"? → Y
? Which scope do you want to deploy to? → 내 계정 선택
? Link to existing project? → N (처음이면)
? What's your project's name? → neww-timer
? In which directory is your code located? → ./
? Want to modify these settings? → N
```

완료되면 미리보기 주소가 출력됩니다.

### 3) 프로덕션 배포

```bash
vercel --prod
```

> CLI로 처음 연결하면 폴더에 `.vercel/` 디렉터리가 생깁니다. 계정·프로젝트 연결 정보라서 git에 올라가지 않도록 `.gitignore`에 이미 넣어 두었습니다.

---

## 배포 전 로컬 확인

배포에서 빌드가 실패하는 일을 줄이려면, push 전에 로컬에서 먼저 빌드해 보세요.

```bash
npm run typecheck   # 타입 오류 확인
npm run build       # 프로덕션 빌드
npm run start       # http://localhost:3000 에서 빌드 결과 확인
```

---

## 커스텀 도메인 연결 (선택)

1. Vercel 대시보드에서 프로젝트 → **Settings** → **Domains**로 이동합니다.
2. 가지고 있는 도메인(예: `timer.example.com`)을 입력하고 **Add**를 누릅니다.
3. 화면에 나오는 DNS 레코드를 도메인 구입처(가비아, Cloudflare 등)의 DNS 설정에 추가합니다.
   - 서브도메인(`timer.example.com`): `CNAME` → `cname.vercel-dns.com`
   - 루트 도메인(`example.com`): `A` → Vercel이 안내하는 IP
4. DNS가 반영되면(몇 분에서 최대 48시간) HTTPS 인증서까지 자동으로 발급됩니다.

---

## 자주 겪는 문제

| 증상 | 원인과 해결 |
| --- | --- |
| Import 목록에 저장소가 없음 | GitHub에서 Vercel 앱 권한이 해당 저장소에 없습니다. **Adjust GitHub App Permissions**에서 저장소를 추가하세요. |
| 빌드 실패 `Node.js version` 관련 오류 | Next.js 16은 Node.js 20.9 이상이 필요합니다. 프로젝트 **Settings** → **Build and Deployment** → **Node.js Version**을 20.x 이상으로 설정하세요. |
| 빌드 실패 (타입 오류) | 로컬에서 `npm run build`로 같은 오류가 나는지 확인하고 고친 뒤 다시 push하세요. |
| push했는데 배포가 안 됨 | 다른 브랜치에 push했다면 프리뷰로만 배포됩니다. 대시보드 **Deployments** 탭에서 상태를 확인하세요. |
| 휴대폰에서 소리가 안 남 | 브라우저 정책상 사용자가 시작 버튼을 눌러야 소리가 켜집니다. 무음 모드도 확인하세요. |
| 화면 꺼짐 방지가 안 됨 | Screen Wake Lock은 HTTPS에서만 동작합니다. Vercel 주소는 HTTPS라 정상 동작하며, 일부 구형 브라우저는 지원하지 않습니다. |
