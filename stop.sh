#!/bin/bash
# Остановка Юнит-Фокус

echo "🛑 Останавливаю серверы..."

# Убиваем процессы
pkill -f "uvicorn app.main:app" 2>/dev/null && echo "   backend остановлен" || echo "   backend не был запущен"
pkill -f "next dev" 2>/dev/null && echo "   frontend остановлен" || echo "   frontend не был запущен"
pkill -f "next-server" 2>/dev/null

echo ""
echo "✅ Готово. Чтобы запустить снова — введи: uc-start"
