@echo off
echo ============================================
echo  DataClean Pro — Iniciando aplicacion...
echo ============================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Instala Python 3.9+ desde python.org
    pause
    exit /b 1
)

:: Instalar dependencias
echo [1/2] Instalando dependencias...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Fallo al instalar dependencias.
    pause
    exit /b 1
)

:: Iniciar servidor
echo [2/2] Iniciando servidor en http://127.0.0.1:8000
echo       El navegador se abrira automaticamente.
echo.
echo       Presiona Ctrl+C para detener el servidor.
echo.
python main.py

pause
