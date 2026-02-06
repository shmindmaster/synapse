@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Synapse Quick Start
echo ========================================
echo.

set MODE=%1
if "%MODE%"=="" set MODE=interactive

if "%MODE%"=="interactive" (
    echo Select deployment mode:
    echo   1^) Full Local ^(Ollama^) - 100%% offline, no API keys
    echo   2^) Docker + Cloud AI - Database in Docker, OpenAI for AI
    echo   3^) Bare-metal Dev - Native backend/frontend, Docker DB only
    echo.
    set /p choice="Enter choice [1-3]: "
    if "!choice!"=="1" set MODE=--local
    if "!choice!"=="2" set MODE=--cloud
    if "!choice!"=="3" set MODE=--dev
)

if "%MODE%"=="--local" goto local_mode
if "%MODE%"=="--cloud" goto cloud_mode
if "%MODE%"=="--dev" goto dev_mode

echo Invalid mode: %MODE%
echo Usage: quick-start.bat [--local^|--cloud^|--dev]
exit /b 1

:local_mode
set COMPOSE_FILE=docker-compose.local.yml
echo Mode: Full Local ^(Ollama^)
echo   - Database: Docker PostgreSQL
echo   - AI: Ollama ^(models download automatically^)
echo   - Frontend: Docker
goto check_docker

:cloud_mode
set COMPOSE_FILE=docker-compose.yml
echo Mode: Docker + Cloud AI
echo   - Database: Docker PostgreSQL
echo   - AI: OpenAI/Azure ^(requires API key^)
echo   - Frontend: Docker
goto check_docker

:dev_mode
set COMPOSE_FILE=docker-compose.yml
echo Mode: Bare-metal Dev
echo   - Database: Docker PostgreSQL only
echo   - Backend: Run with 'pnpm dev' after DB starts
echo   - Frontend: Run with 'pnpm dev' after DB starts
goto check_docker

:check_docker
echo.
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker not found. Install: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)
echo Docker found

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env > nul
    echo Created .env
) else (
    echo .env exists
)
echo.

if "%MODE%"=="--dev" goto start_dev

echo Starting Synapse with Docker Compose...
echo File: %COMPOSE_FILE%
echo.

docker compose -f %COMPOSE_FILE% up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to start Docker Compose
    echo Make sure Docker Desktop is running
    pause
    exit /b 1
)

echo.
if "%MODE%"=="--local" (
    echo Waiting for services ^(first run: ~5-10 min for model downloads^)...
) else (
    echo Waiting for services ^(30-60 seconds^)...
)
echo.

set RETRY=0
:wait_backend
if %RETRY% GEQ 60 (
    echo Backend timeout. Check logs:
    echo   docker compose -f %COMPOSE_FILE% logs backend
    pause
    exit /b 1
)
timeout /t 2 /nobreak > nul
curl -s -f http://localhost:8000/api/health > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a RETRY+=1
    goto wait_backend
)
echo Backend ready

set RETRY=0
:wait_frontend
if %RETRY% GEQ 30 goto show_success
timeout /t 2 /nobreak > nul
curl -s http://localhost:3000 > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a RETRY+=1
    goto wait_frontend
)
echo Frontend ready

:show_success
echo.
echo ========================================
echo   Synapse is running!
echo ========================================
echo.
echo Open: http://localhost:3000
echo.
echo Login:
echo   Email: demo@synapse.local
echo   Password: DemoPassword123!
echo.
if "%MODE%"=="--local" (
    echo Local mode tips:
    echo   - First query may be slow ^(model loading^)
    echo   - Models stored in Docker volume
    echo   - Change models: Edit .env and restart
    echo.
)
echo Stop: docker compose -f %COMPOSE_FILE% down
echo Logs: docker compose -f %COMPOSE_FILE% logs -f
echo.
pause
exit /b 0

:start_dev
echo Starting PostgreSQL only...
docker compose up postgres -d
echo.
echo Waiting for PostgreSQL...
timeout /t 5 /nobreak > nul
echo.
echo PostgreSQL ready!
echo.
echo Next steps:
echo   1. cd src\api ^&^& pnpm install ^&^& pnpm dev
echo   2. cd src\web ^&^& pnpm install ^&^& pnpm dev
echo   3. Open http://localhost:5173
echo.
pause
exit /b 0
