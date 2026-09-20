#!/bin/bash
# Запуск Юнит-Фокус: backend + frontend

PROJECT_DIR="$HOME/unitcalc"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Не нашёл проект в $PROJECT_DIR"
  exit 1
fi

echo "🐍 Запускаю backend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/backend' && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000\""

echo "⚛️  Запускаю frontend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/frontend' && npm run dev\""

sleep 3
echo ""
echo "✅ Готово!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   Docs:     http://localhost:8000/docs"
echo ""
