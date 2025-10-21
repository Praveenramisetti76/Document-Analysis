@echo off

echo Starting servers...

start "Next.js Dev Server" cmd /c "npm run dev"
start "Genkit Dev Server" cmd /c "npm run genkit:dev"

echo Servers are starting in separate windows.
