@echo off
REM Clear Next.js and Node caches before starting dev server
REM This helps prevent memory bloat on restarts

echo Clearing caches...
if exist .next rmdir /s /q .next
if exist .sanity rmdir /s /q .sanity
if exist dist rmdir /s /q dist

echo Done. Starting dev server...
cmd /k npm run dev
