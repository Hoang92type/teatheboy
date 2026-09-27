const BACKEND_URL = "https://teatheboy.onrender.com";
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
   PHẦN 2 - TRỢ LÝ AI CHAT LIVE (KẾT NỐI GEMINI QUA RENDER)
============================================================ */
const openChatbot = document.getElementById('openChatbot');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotWindow = document.getElementById('chatbotWindow');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const chatBox = document.getElementById('chatBox');

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

        speakText(text); // Tự động đọc câu trả lời
    }

    function scrollChat() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // GỌI API RENDER ĐỂ TRÒ CHUYỆN VỚI GEMINI AI
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        addUserMessage(text);
        messageInput.value = '';

        // Hiển thị trạng thái "Đang trả lời..."
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chat-message bot';
        loadingMessage.id = 'loadingMessage';
        loadingMessage.innerHTML = '<div class="message-content">Đang trả lời...</div>';
        chatBox.appendChild(loadingMessage);
        scrollChat();

        try {
            // Gửi dữ liệu JSON tới đường dẫn /chat trên Render của bạn
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            const result = await response.json();
            
            // Xóa dòng trạng thái chờ
            const loader = document.getElementById('loadingMessage');
            if (loader) loader.remove();

            if (response.ok && result.reply) {
                addBotMessage(result.reply);
            } else {
                addBotMessage("Xin lỗi bạn, kết nối với bộ não AI gặp sự cố nhỏ. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Lỗi Chat API:", error);
            const loader = document.getElementById('loadingMessage');
            if (loader) loader.remove();
            addBotMessage("Không thể kết nối đến máy chủ Trợ lý AI lúc này.");
        }
    }
}

/* ============================================================
   🌟 PHẦN 3 - LƯU THÔNG TIN KHÁCH HÀNG / ĐẶT HÀNG VÀO FIREBASE
============================================================ */
// Đoạn này sẽ lắng nghe Form nhập thông tin khách hàng trên trang HTML
document.addEventListener('DOMContentLoaded', function() {
    const customerForm = document.getElementById('customerForm');
    
    if (customerForm) {
        customerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Ngăn việc tải lại trang web

            // Lấy dữ liệu từ các ô Input trên HTML của bạn
            const nameInput = document.getElementById('customerName');
            const phoneInput = document.getElementById('customerPhone');
            const addressInput = document.getElementById('customerAddress');
            const statusMsg = document.getElementById('orderStatusMessage');

            if (!nameInput || !phoneInput) return;

            const customerData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput ? addressInput.value.trim() : ""
            };

            if (statusMsg) {
                statusMsg.style.color = "orange";
                statusMsg.innerText = "Đang gửi dữ liệu đăng ký...";
            }

            try {
                // Gửi dữ liệu khách hàng tới đường dẫn /api/customers trên Render để lưu vào Firebase
                const response = await fetch(`${BACKEND_URL}/api/customers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(customerData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    if (statusMsg) {
                        statusMsg.style.color = "green";
                        statusMsg.innerText = "🎉 " + result.message;
                    }
                    customerForm.reset(); // Xóa sạch form nhập sau khi hoàn thành
                } else {
                    if (statusMsg) {
                        statusMsg.style.color = "red";
                        statusMsg.innerText = "Lỗi: " + (result.error || "Không thể lưu dữ liệu");
                    }
                }
            } catch (error) {
                console.error("Lỗi gửi dữ liệu khách hàng:", error);
                if (statusMsg) {
                    statusMsg.style.color = "red";
                    statusMsg.innerText = "Lỗi hệ thống: Không thể kết nối tới server dữ liệu!";
                }
            }
        });
    }
});
