@echo off
rem Freedom V4: Sea Shanties - double-click installer for Windows (runs install\windows.ps1 from GitHub).
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Cha0sslay3r/seashanties-pack/main/install/windows.ps1 | iex"
pause
