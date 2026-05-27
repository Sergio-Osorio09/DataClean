#!/usr/bin/env bash
set -e

echo "============================================"
echo " DataClean Pro — Iniciando aplicacion..."
echo "============================================"
echo ""

# Verificar Python
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] python3 no encontrado. Instala Python 3.9+"
    exit 1
fi

# Instalar dependencias
echo "[1/2] Instalando dependencias..."
pip3 install -r requirements.txt --quiet

# Iniciar servidor
echo "[2/2] Iniciando servidor en http://127.0.0.1:8000"
echo "      El navegador se abrira automaticamente."
echo ""
echo "      Presiona Ctrl+C para detener el servidor."
echo ""
python3 main.py
