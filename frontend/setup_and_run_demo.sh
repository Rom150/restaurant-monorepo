#!/usr/bin/env bash
set -e

ROOT="$(pwd)/restaurant-demo"
BACKEND_REPO="https://github.com/Rom150/restaurant-clean.git"
FRONTEND_REPO="https://github.com/Rom150/restaurant-pro.git"
BACKEND_BRANCH="feature/upload-api"
FRONTEND_BRANCH="feature/import-preview"

echo "Demo root: $ROOT"
mkdir -p "$ROOT"
cd "$ROOT"

mkdir -p logs

# Clone or update backend
if [ -d "restaurant-clean/.git" ]; then
  echo "restaurant-clean exists, fetching..."
  cd restaurant-clean
  git fetch origin
else
  echo "Cloning backend..."
  git clone "$BACKEND_REPO" restaurant-clean
  cd restaurant-clean
fi
# Checkout branch
if git show-ref --verify --quiet refs/heads/"$BACKEND_BRANCH"; then
  git checkout "$BACKEND_BRANCH"
else
  git fetch origin
  git checkout -b "$BACKEND_BRANCH" origin/"$BACKEND_BRANCH" 2>/dev/null || git checkout "$BACKEND_BRANCH" || true
fi

echo "Installing backend deps..."
npm install

# Prepare sqlite prisma schema (non-destructive to original)
if [ -f prisma/schema.prisma ]; then
  cp prisma/schema.prisma prisma/schema.sqlite.prisma
  # Replace provider only once if not already sqlite
  if ! grep -q 'provider = "sqlite"' prisma/schema.sqlite.prisma; then
    sed -E 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.sqlite.prisma > prisma/schema.sqlite.prisma.tmp || true
    mv prisma/schema.sqlite.prisma.tmp prisma/schema.sqlite.prisma || true
  fi
else
  echo "Warning: prisma/schema.prisma not found in backend repo."
fi

# Create .env for dev (sqlite)
cat > .env <<'ENV'
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret"
ENV

echo "Generating prisma client and pushing schema (sqlite)..."
npx prisma generate --schema=prisma/schema.sqlite.prisma
npx prisma db push --schema=prisma/schema.sqlite.prisma

# Seed if seed script exists in package.json scripts
if npm run | grep -q seed; then
  echo "Running seed..."
  npm run seed || echo "Seed script failed or returned non-zero."
else
  echo "No seed script found (skipping)."
fi

# Start backend in background, log to ../logs/backend.log
echo "Starting backend (nohup) - logs -> $ROOT/logs/backend.log"
nohup npm run start:dev > "$ROOT/logs/backend.log" 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT/logs/backend.pid"
echo "Backend started (PID $BACKEND_PID). Waiting 2s for startup..."
sleep 2

# Move back to root and handle frontend
cd "$ROOT"

# Clone or update frontend
if [ -d "restaurant-pro/.git" ]; then
  echo "restaurant-pro exists, fetching..."
  cd restaurant-pro
  git fetch origin
else
  echo "Cloning frontend..."
  git clone "$FRONTEND_REPO" restaurant-pro
  cd restaurant-pro
fi

# Checkout branch
if git show-ref --verify --quiet refs/heads/"$FRONTEND_BRANCH"; then
  git checkout "$FRONTEND_BRANCH"
else
  git fetch origin
  git checkout -b "$FRONTEND_BRANCH" origin/"$FRONTEND_BRANCH" 2>/dev/null || git checkout "$FRONTEND_BRANCH" || true
fi

echo "Installing frontend deps..."
npm install

# Create .env.local to point to backend
cat > .env.local <<'ENV'
REACT_APP_API_URL=http://localhost:3000
ENV

# Start frontend in background, log to ../logs/frontend.log
echo "Starting frontend (nohup) - logs -> $ROOT/logs/frontend.log"
nohup npm start > "$ROOT/logs/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT/logs/frontend.pid"
echo "Frontend started (PID $FRONTEND_PID)."

echo "All services started."
echo "Backend log: $ROOT/logs/backend.log"
echo "Frontend log: $ROOT/logs/frontend.log"
echo
echo "To follow backend logs: tail -f $ROOT/logs/backend.log"
echo "To follow frontend logs: tail -f $ROOT/logs/frontend.log"
echo
echo "To stop services:"
echo "  kill \$(cat $ROOT/logs/backend.pid) || true"
echo "  kill \$(cat $ROOT/logs/frontend.pid) || true"
