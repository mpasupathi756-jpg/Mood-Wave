@echo off
echo.
echo ====================================================================
echo  MoodWave - Full Stack Startup
echo  Backend: http://localhost:5000
echo  Frontend: http://localhost:3001
echo ====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Starting Java Backend in background...
start "MoodWave Backend" cmd /c "mvn -f backend/pom.xml exec:java -Dexec.mainClass=com.moodwave.ServerApp"

echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak >nul

echo [2/2] Starting React Frontend...
start "MoodWave Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ====================================================================
echo  Both servers are starting!
echo  Backend:  http://localhost:5000/api/health
echo  Frontend: http://localhost:3001
echo  
echo  Demo Login: admin@moodwave.com / Admin@123
echo ====================================================================
echo.
pause

