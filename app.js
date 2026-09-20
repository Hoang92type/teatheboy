/* ============================================================
   COFFEE THE BOY - SLIDER + TRỢ LÝ AI (CHẠY OFFLINE TRÊN GITHUB)
============================================================ */

/* ============================================================
   PHẦN 1 - SLIDER
============================================================ */
let nextBtn = document.querySelector('.next');
let prevBtn = document.querySelector('.prev');
let slider = document.querySelector('.slider');

if (slider) {
    let sliderList = slider.querySelector('.list');
    let thumbnail = slider.querySelector('.thumbnail');
    let thumbnailItems = thumbnail ? thumbnail.querySelectorAll('.item') : [];

    if (thumbnail && thumbnailItems.length > 0) {
        thumbnail.appendChild(thumbnailItems[0]);
    }

    if (nextBtn) {
        nextBtn.onclick = function () {
            moveSlider('next');
        };
    }

    if (prevBtn) {
        prevBtn.onclick = function () {
            moveSlider('prev');
        };
    }

    function moveSlider(direction) {
        if (!sliderList || !thumbnail) return;

        let sliderItems = sliderList.querySelectorAll('.item');
        let thumbnailItems = thumbnail.querySelectorAll('.item');

        if (direction === 'next') {
            if (sliderItems.length > 0 && thumbnailItems.length > 0) {
                sliderList.appendChild(sliderItems[0]);
                thumbnail.appendChild(thumbnailItems[0]);
                slider.classList.add('next');
            }
        } else {
            if (sliderItems.length > 0 && thumbnailItems.length > 0) {
                sliderList.prepend(sliderItems[sliderItems.length - 1]);
                thumbnail.prepend(thumbnailItems[thumbnailItems.length - 1]);
                slider.classList.add('prev');
            }
        }

        slider.addEventListener(
            'animationend',
            function () {
                slider.classList.remove(direction);
            },
            { once: true }
        );
    }
}

/* ============================================================
   PHẦN 2 - TRỢ LÝ AI KỊCH BẢN THÔNG MINH (KHÔNG CẦN BACKEND)
============================================================ */
const openChatbot = document.getElementById('openChatbot');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotWindow = document.getElementById('chatbotWindow');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const chatBox = document.getElementById('chatBox');

// ------------------------------------------------------------
// BỘ BẢN ĐỒ TỪ KHÓA & CÂU TRẢ LỜI CỦA QUÁN COFFEE THE BOY
// ------------------------------------------------------------
const chatbotBrain = [
    {
        keywords: ['địa chỉ', 'đâu', 'ở đâu', 'dia chi', 'chi duong', 'chỉ đường', 'vị trí', 'vi tri'],
        reply: "Quán Coffee The Boy nằm tại địa chỉ: 301 Ngô Chí Quốc, Phường Bình Chiểu, Thành phố Thủ Đức bạn nhé! Rất hân hạnh được đón tiếp bạn."
    },
    {
        keywords: ['sđt', 'số điện thoại', 'so dien thoai', 'hotline', 'liên hệ', 'lien he', 'zalo', 'fone', 'phone'],
        reply: "Bạn có thể liên hệ trực tiếp đặt hàng hoặc đặt bàn qua Hotline/Zalo của quán: 033 606 1917."
    },
    {
        keywords: ['menu', 'thực đơn', 'thuc don', 'uống', 'nước', 'giá', 'gia ca', 'món', 'mon an', 'ca phe', 'cà phê'],
        reply: "Quán có thực đơn đa dạng bao gồm: Cà phê phin truyền thống, Cà phê máy thơm nồng, Trà trái cây thanh mát và các dòng Đá xay giải nhiệt. Bạn cần mình tư vấn món nào cụ thể không ạ?"
    },
    {
        keywords: ['mở cửa', 'mo cua', 'mấy giờ', 'may gio', 'đóng cửa', 'dong cua', 'thời gian', 'thoi gian'],
        reply: "Coffee The Boy mở cửa đón khách từ 06:30 sáng đến 22:30 đêm tất cả các ngày trong tuần, kể cả ngày lễ ạ!"
    },
    {
        keywords: ['chào', 'hello', 'hi', 'xin chào', 'xin chao', 'bạn ơi', 'ban oi'],
        reply: "Xin chào! Mình là Trợ lý tự động của Coffee The Boy. Mình có thể giúp gì cho bạn hôm nay?"
    },
    {
        keywords: ['đặt hàng', 'dat hang', 'mua', 'ship', 'giao hàng', 'giao hang'],
        reply: "Để đặt ship nước nhanh nhất, bạn vui lòng gọi trực tiếp hotline 033 606 1917 để nhân viên của quán chuẩn bị và giao tận nơi ngay nhé!"
    }
];

// Câu trả lời mặc định nếu khách nhập từ khóa lạ không có trong danh sách
const defaultReply = "Cảm ơn bạn đã nhắn tin cho Coffee The Boy! Câu hỏi này hơi khó một chút, bạn vui lòng gọi trực tiếp hotline 033 606 1917 hoặc inbox Zalo để nhân viên hỗ trợ bạn kỹ hơn nhé!";

if (openChatbot && closeChatbot && chatbotWindow && sendButton && messageInput && chatBox) {

    openChatbot.addEventListener('click', function () {
        chatbotWindow.classList.add('show');
        messageInput.focus();
    });

    closeChatbot.addEventListener('click', function () {
        chatbotWindow.classList.remove('show');
        window.speechSynthesis.cancel();
    });

    messageInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    // GIỌNG ĐỌC TIẾNG VIỆT
    function speakText(text) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#\-_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    function addUserMessage(text) {
        const message = document.createElement('div');
        message.className = 'chat-message user';
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        message.appendChild(content);
        chatBox.appendChild(message);
        scrollChat();
    }

    function addBotMessage(text) {
        const message = document.createElement('div');
        message.className = 'chat-message bot';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;

        const speakBtn = document.createElement('button');
        speakBtn.innerHTML = '🔊';
        speakBtn.style.cssText = "background:none; border:none; cursor:pointer; font-size:14px; margin-left:5px; align-self:center; padding:0;";
        speakBtn.title = "Nghe trợ lý đọc";
        speakBtn.addEventListener('click', () => speakText(text));

        message.appendChild(content);
        message.appendChild(speakBtn);
        chatBox.appendChild(message);
        scrollChat();

        speakText(text); // Tự động đọc
    }

    function scrollChat() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // XỬ LÝ QUÉT TỪ KHÓA THÔNG MINH TRỰC TIẾP TRÊN TRÌNH DUYỆT
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        addUserMessage(text);
        messageInput.value = '';

        // Hiển thị trạng thái "Đang suy nghĩ..." ngắn (giả lập)
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chat-message bot';
        loadingMessage.id = 'loadingMessage';
        loadingMessage.innerHTML = '<div class="message-content">Đang trả lời...</div>';
        chatBox.appendChild(loadingMessage);
        scrollChat();

        setTimeout(() => {
            const loader = document.getElementById('loadingMessage');
            if (loader) loader.remove();

            // Chuyển tin nhắn của khách thành chữ thường để so khớp chính xác hơn
            const lowerText = text.toLowerCase();
            let matchedReply = null;

            // Vòng lặp quét tìm từ khóa
            for (let item of chatbotBrain) {
                let hasKeyword = item.keywords.some(keyword => lowerText.includes(keyword));
                if (hasKeyword) {
                    matchedReply = item.reply;
                    break;
                }
            }

            // Trả lời kết quả
            if (matchedReply) {
                addBotMessage(matchedReply);
            } else {
                addBotMessage(defaultReply);
            }
        }, 600); // Trả lời sau 0.6 giây tạo cảm giác tự nhiên
    }
}
