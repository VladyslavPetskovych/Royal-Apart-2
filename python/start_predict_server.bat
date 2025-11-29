@echo off
echo Starting Flask prediction server...
cd /d "%~dp0"
python predict_server.py
pause

