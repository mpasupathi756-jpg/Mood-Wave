@echo off
echo.
echo ====================================================================
echo  MoodWave - Starting Java Backend (Port 5000)
echo  Architecture: MVC + DAO + Jakarta Servlets + Supabase
echo ====================================================================
echo.
cd /d "%~dp0"
mvn -f backend/pom.xml exec:java -Dexec.mainClass=com.moodwave.ServerApp
pause

