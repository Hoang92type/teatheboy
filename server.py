import os
import re
import asyncio
import json
import ssl
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS  # Bắt buộc cài để link GitHub Pages gọi được vào API này
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

BASE = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)

# ----------------------------------------------------
# BẢO MẬT & KẾT NỐI: CORS HOÀN CHỈNH
# ----------------------------------------------------
CORS(app)  # Cho phép tất cả các nguồn (bao gồm GitHub Pages của bạn) gọi API

# ----------------------------------------------------
# KHỞI TẠO CƠ SỞ DỮ LIỆU FIREBASE FIRESTORE
# ----------------------------------------------------
try:
    cred = credentials.Certificate("firebase-key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Firestore: Kết nối thành công!")
except Exception as e:
    print(f"Lỗi cấu hình Firebase (Hãy kiểm tra file firebase-key.json): {e}")
    db = None

# CẤU HÌNH AI STUDIO (GEMINI) CỦA BẠN KHÔNG ĐỔI
MODEL = "gemini-3.5-flash-lite"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

SYSTEM_PROMPT = """Bạn là Trợ lý Việt, thân thiện và hữu ích, đại diện cho quán Coffee The Boy.
Luôn trả lời bằng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.
Trả lời tự nhiên, rõ ràng và phù hợp với câu hỏi về quán cà phê, thực đơn hoặc trò chuyện chung."""

history = []
MAX_MESSAGES = 24

TTS_VOICES = {
    "female": "vi-VN-HoaiMyNeural",
    "male": "vi-VN-NamMinhNeural",
    "auto": "vi-VN-HoaiMyNeural",
}


def ask_gemini(text):
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        return "Chưa có GEMINI_API_KEY. Hãy thiết lập Gemini API key trong Render Env."

    history.append({"role": "user", "parts": [{"text": text}]})
    del history[:-MAX_MESSAGES]

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": history,
        "generationConfig": {"maxOutputTokens": 700},
    }

    req = Request(
        API_URL + "?key=" + key,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "TroLyViet/1.0"},
    )

    try:
        try:
            import certifi
            ctx = ssl.create_default_context(cafile=certifi.where())
        except Exception:
            ctx = ssl.create_default_context()

        with urlopen(req, timeout=90, context=ctx) as r:
            data = json.loads(r.read().decode("utf-8"))

        candidates = data.get("candidates", [])
        if not candidates:
            return "Gemini không trả về câu trả lời."

        parts = candidates[0].get("content", {}).get("parts", [])
        answer = "\n".join(
            p.get("text", "") for p in parts if p.get("text")
        ).strip()

        if not answer:
            return "Gemini không trả về nội dung văn bản."

        history.append({"role": "model", "parts": [{"text": answer}]})
        del history[:-MAX_MESSAGES]
        return answer

    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        if e.code in (400, 403):
            return "Gemini API key không hợp lệ hoặc project chưa được cấp quyền."
        if e.code == 429:
            return "Gemini đang vượt giới hạn Free Tier. Hãy chờ quota reset rồi thử lại."
        return f"Gemini API lỗi HTTP {e.code}: {body[:400]}"
    except URLError as e:
        return f"Không kết nối được Gemini API: {e.reason}"
    except Exception as e:
        return f"Lỗi kết nối Gemini: {e}"


async def synthesize_tts(text, voice):
    try:
        import edge_tts
    except ImportError:
        raise RuntimeError("Chưa cài edge-tts. Hãy chạy pip install -r requirements.txt.")

    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`([^`]+)`", r"\1", clean)
    clean = re.sub(r"\*\*(.*?)\*\*", r"\1", clean)
    clean = re.sub(r"\*(.*?)\*", r"\1", clean)
    clean = re.sub(r"#{1,6}\s*", "", clean)
    clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", clean)
    clean = re.sub(r"\s+", " ", clean).strip()

    if not clean:
        raise RuntimeError("Không có nội dung để đọc.")

    clean = clean[:5000]
    selected = TTS_VOICES.get(voice, TTS_VOICES["auto"])
    communicate = edge_tts.Communicate(clean, selected, rate="-5%", pitch="+0Hz")

    chunks = []
    async for item in communicate.stream():
        if item["type"] == "audio":
            chunks.append(item["data"])
    return b"".join(chunks)


def make_tts(text, voice):
    return asyncio.run(synthesize_tts(text, voice))


@app.get("/")
def index():
    return send_from_directory(BASE, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE, filename)


@app.get("/status")
def status():
    return jsonify({
        "api": bool(os.environ.get("GEMINI_API_KEY")),
        "model": MODEL,
    })


@app.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    if not text:
        return jsonify({"reply": "Bạn hãy nhập câu hỏi."})
    return jsonify({"reply": ask_gemini(text)})


@app.post("/tts")
def tts():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", ""))
    voice = str(data.get("voice", "auto"))

    try:
        audio_data = make_tts(text, voice)
        return Response(
            audio_data,
            mimetype="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------------------------------
# 🌟 ĐƯỜNG DẪN API MỚI: LƯU THÔNG TIN KHÁCH HÀNG VÀO FIREBASE
# ----------------------------------------------------
@app.post("/api/customers")
def add_customer():
    if not db:
        return jsonify({"error": "Chưa kết nối được với Firebase Firestore Database"}), 500

    try:
        data = request.get_json(silent=True) or {}
        name = data.get('name')
        phone = data.get('phone')
        address = data.get('address')
        
        if not name or not phone:
            return jsonify({"error": "Tên khách hàng và Số điện thoại là bắt buộc!"}), 400

        # Gộp dữ liệu cùng ngày tháng tự động định dạng chuẩn
        customer_info = {
            "name": str(name).strip(),
            "phone": str(phone).strip(),
            "address": str(address).strip() if address else "",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Thêm trực tiếp dữ liệu vào bảng 'customers' trên Firebase của bạn
        doc_ref = db.collection('customers').add(customer_info)
        
        return jsonify({
            "success": True,
            "message": "Lưu thông tin khách hàng thành công!", 
            "id": doc_ref[1].id
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Lỗi không thể lưu: {str(e)}"}), 500


# ----------------------------------------------------
# SỬA ĐỔI QUAN TRỌNG: LẮNG NGHE PORT TỰ ĐỘNG CỦA RENDER
# ----------------------------------------------------
if __name__ == "__main__":
    # Ép Flask phải chạy qua cổng linh hoạt từ Render cấp phát thay vì cổng cứng 8765
    port = int(os.environ.get("PORT", 8765))
    app.run(host="0.0.0.0", port=port, debug=False)
