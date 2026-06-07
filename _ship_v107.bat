@echo off
REM ===========================================================
REM  Ship v.103 - v.107 to GitHub Pages.
REM  The Claude sandbox saved every change to your working copy
REM  but cannot push (no GitHub credentials on its side and a
REM  stale .git/index.lock left by an earlier Windows git run).
REM  Double-click this file to finish the deploy.
REM ===========================================================
cd /d "%~dp0"
echo Clearing stale index.lock if present...
if exist ".git\index.lock" del /f /q ".git\index.lock"
echo.
echo Staging all changes...
git add -A
echo.
echo Committing v.104 - v.107...
git commit -m "v.104-v.107: stateroom polish, silhouette-edge zones, no overlaps, views-first"
echo.
echo Pushing to origin/main...
git push origin main
echo.
echo Done. The site will rebuild on GitHub Pages in ~30 seconds.
pause
