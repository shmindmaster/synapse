@echo off
echo.
echo ========================================
echo   Synapse Quick Start
echo ========================================
echo.
echo Starting Synapse with Docker Compose...
echo.

docker compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   ERROR: Failed to start Docker Compose
    echo ========================================
    echo.
    echo Make sure Docker Desktop is running
    echo.
    pause
    exit /b 1
)

echo.
echo Waiting for services to start (30-60 seconds)...
echo.

:wait_backend
timeout /t 2 /nobreak > nul
curl -s http://localhost:8000/api/health > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    goto wait_backend
)

echo.
echo ========================================
echo   ! Synapse is running!
echo ========================================
echo.
echo Open your browser: http://localhost:3000
echo.
echo Login credentials:
echo   Email: demomaster@pendoah.ai
echo   Password: Pendoah1225
echo.
echo ----------------------------------------
echo Useful commands:
echo ----------------------------------------
echo   Stop:       docker compose down
echo   View logs:  docker compose logs -f backend
echo   Restart:    docker compose restart
echo ----------------------------------------
echo.
pause
