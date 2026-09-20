#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3.10 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if [ -z "$GEMINI_API_KEY" ]; then
  echo ""
  echo "Chưa có GEMINI_API_KEY."
  echo 'Thiết lập bằng: export GEMINI_API_KEY="API_KEY_CUA_BAN"'
  echo ""
fi

python server.py
