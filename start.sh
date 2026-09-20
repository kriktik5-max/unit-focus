#!/bin/bash
# Запуск Юнит-Фокус: образ + backend + frontend

PROJECT_DIR="/Volumes/Юнит-Фокус/unitcalc"
IMAGE_PATH="/Volumes/ED138 Pro/Юнит-Фокус.sparsebundle"
MOUNT_POINT="/Volumes/Юнит-Фокус"

# 1. Подключаем образ, если не подключён
if [ ! -d "$MOUNT_POINT" ]; then
  echo "🔌 Подключаю образ Юнит-Фокус..."
  hdiutil attach "$IMAGE_PATH" > /dev/null
  sleep 2
fi

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Не нашёл проект в $PROJECT_DIR"
  echo "Проверь, подключён ли внешний диск ED138 Pro"
  exit 1
fi

# 2. Запускаем backend в отдельном окне Terminal
echo "🐍 Запускаю backend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/backend' && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000\""

# 3. Запускаем frontend
echo "⚛️  Запускаю frontend..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/frontend' && npm run dev\""

sleep 3
echo ""
echo "✅ Готово!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   Документация API: http://localhost:8000/docs"
echo ""
echo "Через 20-30 секунд открой Safari на http://localhost:3000"
