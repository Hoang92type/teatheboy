<<<<<<< HEAD
# Animated Imaged Slider HTML CSS & JavaScript 
## Animated Carousel Design

<img src="./image/Image Slider using HTML CSS and JavaScript.png"># amtralienhoa
# teatheboy
=======
# Coffee The Boy + Trợ lý Việt

Project này kết hợp website Coffee The Boy với backend Python:
- Website slider 4 ảnh.
- Trợ lý AI Gemini.
- TTS tiếng Việt bằng Edge TTS.
- Chạy bằng Flask trên MacBook Python 3.10.8.

## 1. Cấu trúc

```text
coffee_the_boy/
├── server.py
├── index.html
├── style.css
├── app.js
├── requirements.txt
├── run.command
└── image/
    ├── cà1.jpg
    ├── cà2.jpg
    ├── cà3.jpg
    └── cà4.jpg
```

## 2. Đặt ảnh

Copy 4 ảnh cũ của bạn vào thư mục `image/` và đặt tên:
- cà1.jpg
- cà2.jpg
- cà3.jpg
- cà4.jpg

Nếu bạn đã có ảnh trong project cũ, chỉ cần copy nguyên thư mục `image`.

## 3. Cài trên MacBook Python 3.10.8

Mở Terminal:

```bash
cd ~/Desktop/coffee_the_boy
python3.10 --version
python3.10 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Thiết lập Gemini API key

```bash
export GEMINI_API_KEY="API_KEY_CUA_BAN" 

```

Sau đó:

```bash
python server.py
```

Mở Safari/Chrome:

```text
http://127.0.0.1:8765/
```

## 5. Chạy lần sau

```bash
cd ~/Desktop/coffee_the_boy
source .venv/bin/activate
python server.py
```

Hoặc:

```bash
./run.command
```

Nếu macOS không cho chạy `run.command`:

```bash
chmod +x run.command
./run.command
```

## Lưu ý

Không đưa Gemini API key vào `index.html`, `app.js` hoặc GitHub. API key chỉ được đọc từ biến môi trường `GEMINI_API_KEY` trên máy chạy server.
>>>>>>> Cap nhat du an
