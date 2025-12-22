@echo off
setlocal enabledelayedexpansion

TITLE ACR Commerce Suite - Gerador de Licencas

echo ============================================================
echo           ACR COMMERCE SUITE - GERADOR DE LICENCAS
echo ============================================================
echo.

set /p NAME="Digite o NOME do Cliente: "
set /p EMAIL="Digite o EMAIL do Cliente: "
echo.
echo Escolha o TIPO de Licenca:
echo [1] Standard (Padrao)
echo [2] Premium
echo [3] Enterprise
echo [4] Trial (30 dias)
set /p TYPE_CHOICE="Opcao: "

if "%TYPE_CHOICE%"=="1" set LIC_TYPE=standard
if "%TYPE_CHOICE%"=="2" set LIC_TYPE=premium
if "%TYPE_CHOICE%"=="3" set LIC_TYPE=enterprise
if "%TYPE_CHOICE%"=="4" set LIC_TYPE=trial

set /p DAYS="Validade em DIAS (ex: 365) [0 para vitalicia]: "
set /p ACTIVATIONS="Maximo de ATIVACOES (padrao 1): "

if "%ACTIVATIONS%"=="" set ACTIVATIONS=1

echo.
echo --- PROCESSANDO... ---
echo.

npx tsx scripts/generate-license.ts --name="%NAME%" --email="%EMAIL%" --type=%LIC_TYPE% --days=%DAYS% --activations=%ACTIVATIONS% --platform=direto

echo.
echo ============================================================
echo Geração concluída! Copie a chave acima.
echo ============================================================
pause
