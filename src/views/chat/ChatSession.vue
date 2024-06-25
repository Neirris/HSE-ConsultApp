<template>
    <div class="chat-session-container">
        <div class="chat-session-content">
            <div v-if="chatExists">
                <div class="chat-session-upper">
                    <img src="@/assets/icons/Chat.png" alt="Chat Icon" class="chat-icon">
                    <h1 class="chat-title">Чат с {{ chatPartnerName }}</h1>
                </div>
                <div class="chat-session-lower">
                    <div class="chat-box">
                        <div class="chat-messages">
                            <div v-for="message in messages" :key="message.id" class="chat-message"
                                :class="{ 'own-message': message.senderId === currentUserId }">
                                <div
                                    :class="{ 'message-container': true, 'own-message-container': message.senderId === currentUserId, 'partner-message-container': message.senderId !== currentUserId }">
                                    <img :src="message.senderProfileImage ? `data:image/png;base64,${message.senderProfileImage}` : '/path/to/default/avatar.png'"
                                        alt="Avatar" class="message-avatar">
                                    <div class="message-box">
                                        <div class="message-header"
                                            :class="{ 'own-header': message.senderId === currentUserId, 'partner-header': message.senderId !== currentUserId }">
                                            <span class="message-sender">{{ message.senderName }}</span>
                                            <span class="message-time" :title="message.timestamp">{{
                                                formatTime(message.timestamp) }}</span>
                                        </div>
                                        <div class="message-content">{{ message.message }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Введите сообщение...">
                            <button @click="sendMessage">Отправить</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="chat-not-found">
                <h1>Данного чата не существует!</h1>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const route = useRoute();
const sessionId = route.params.id;
const messages = ref([]);
const newMessage = ref('');
const currentUserId = ref(null);
const chatPartnerName = ref('');
const chatExists = ref(true);

const fetchMessages = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chats/messages/${sessionId}`, { withCredentials: true });
        messages.value = response.data;
    } catch (error) {
        console.error('Не удалось загрузить сообщения:', error);
        chatExists.value = false;
    }
};

const fetchCurrentUserId = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/profile-data`, { withCredentials: true });
        currentUserId.value = response.data.userId;
    } catch (error) {
        console.error('Не удалось получить данные текущего пользователя:', error);
    }
};

const fetchChatPartnerName = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chats/partner/${sessionId}`, { withCredentials: true });
        chatPartnerName.value = response.data.fullName;
    } catch (error) {
        console.error('Не удалось получить имя собеседника:', error);
        chatExists.value = false;
    }
};

const sendMessage = async () => {
    if (newMessage.value.trim() === '') return;

    const message = {
        sessionId,
        content: newMessage.value,
        senderId: currentUserId.value
    };

    try {
        await axios.post(`${API_BASE_URL}/chats/messages`, message, { withCredentials: true });
        newMessage.value = '';
        await fetchMessages();
    } catch (error) {
        console.error('Не удалось отправить сообщение:', error);
    }
};

const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

onMounted(async () => {
    await fetchCurrentUserId();
    await fetchChatPartnerName();
    await fetchMessages();
});
</script>

<style scoped>
.chat-session-container {
    display: flex;
    height: 98vh;
}

.chat-session-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 50px;
}

.chat-session-upper {
    background-color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-icon {
    width: 35px;
    height: 35px;
    margin-right: 10px;
}

.chat-title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
}

.chat-session-lower {
    background-color: #f0f0f0;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-box {
    width: 100%;
    max-width: 1000px;
    height: 650px;
    background-color: white;
    display: flex;
    flex-direction: column;
    padding: 20px;
    margin: 0 auto;
    margin-top: 50px;
    margin-bottom: 70px;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
}

.chat-message {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10px;
    max-width: 50%;
    width: auto;
}

.own-message {
    margin-left: auto;
    margin-right: 0;
    justify-content: flex-end;
    text-align: right;
}

.message-container {
    display: flex;
    align-items: flex-start;
}

.own-message-container {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    margin-right: 10px;
}

.own-message-container .message-avatar {
    margin-left: 10px;
    margin-right: 0;
}

.message-box {
    background-color: #e2f0fb;
    border-radius: 15px;
    padding: 10px;
    position: relative;
    max-width: 100%;
    word-wrap: break-word;
}

.own-message .message-box {
    background-color: #d1ecf1;
}

.message-header {
    display: flex;
    margin-bottom: 5px;
}

.own-header {
    justify-content: flex-end;
}

.partner-header {
    justify-content: flex-start;
}

.message-sender {
    font-weight: bold;
}

.message-time {
    font-size: 12px;
    cursor: pointer;
    margin-left: 10px;
}

.message-content {
    word-wrap: break-word;
}

.chat-input {
    display: flex;
    padding: 10px;
    border-top: 1px solid #ccc;
}

.chat-input input {
    flex: 1;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px 0 0 5px;
}

.chat-input button {
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border-radius: 0 5px 5px 0;
}

.chat-input button:hover {
    background-color: #0056b3;
}

.chat-not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    font-size: 32px;
    font-weight: bold;
    color: #ff0000;
}
</style>