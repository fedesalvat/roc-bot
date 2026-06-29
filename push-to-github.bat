@echo off
echo ========================================
echo  ROC BOT — Subiendo codigo a GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Inicializando git...
git init

echo.
echo Agregando archivos...
git add .

echo.
echo Haciendo commit...
git commit -m "ROC Bot - bot de Instagram para @carreraroc"

echo.
echo Configurando rama main...
git branch -M main

echo.
echo Conectando con GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/fedesalvat/roc-bot.git

echo.
echo Subiendo codigo...
git push -u origin main

echo.
echo ========================================
echo  LISTO! Codigo subido a GitHub.
echo  https://github.com/fedesalvat/roc-bot
echo ========================================
echo.
pause
