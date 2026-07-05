@echo off
for /f "tokens=1* delims==" %%a in ('type .env.local ^| findstr /v "^#"') do (
    set "%%a=%%b"
)
npx tsx test-e2e.ts
