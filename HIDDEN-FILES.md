# ملفات مخفية: أنشئها يدويًا على GitHub

هذه الملفات تبدأ بنقطة فيخفيها الجهاز، لذلك وضعتها هنا كنص. على GitHub: Add file ← Create new file، واكتب الاسم في الخانة العلوية (بالشرطات المائلة كاملة)، والصق المحتوى، ثم Commit.

## 1) `.gitignore`
```
node_modules
dist
.env
.env.*
!.env.example
android/app/build
*.log
.DS_Store
*.keystore
*.jks
```

## 2) `.github/workflows/build-apk.yml`  (لبناء الـ APK)
```yaml
name: Build Android APK

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Install
        run: npm install

      - name: Typecheck (لا يوقف البناء)
        run: npm run typecheck
        continue-on-error: true

      - name: Build web
        run: npx vite build
        env:
          VITE_API_BASE_URL: ${{ vars.API_BASE_URL }}

      - name: Add Android project
        run: npx cap add android

      - name: Sync
        run: npx cap sync android

      - name: Build debug APK
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug

      - uses: actions/upload-artifact@v4
        with:
          name: masr-finance-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

## 3) `.github/workflows/ci.yml`  (فحص تلقائي، اختياري)
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## 4) `.env.example`
في هذه النسخة اسمه `env.example` وهو موجود بين الملفات. انسخه إلى `.env` على جهازك فقط ولا ترفع `.env`.
