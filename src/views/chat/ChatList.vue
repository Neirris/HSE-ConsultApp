<template>
    <div class="chat-list-container">
        <div class="chat-list-content">
            <div class="chat-list-upper">
                <h1 class="chat-list-title">Все чаты</h1>
                <div class="search-container">
                    <input v-model="searchQuery" type="text" placeholder="Поиск по фамилии, имени, отчеству или email">
                    <button @click="searchChats">Поиск</button>
                </div>
                <div class="chats-list">
                    <div v-for="chat in chats" :key="chat.id" class="chat-item" @click="goToChat(chat.id)">
                        <img :src="`data:image/png;base64,${chat.profileImage}`" alt="Profile" class="chat-avatar">
                        <div class="chat-info">
                            <p class="chat-name">{{ chat.fullName }}</p>
                            <p class="chat-email">{{ chat.email }}</p>
                        </div>
                        <div class="chat-messages">
                            {{ chat.messageCount }} сообщений
                        </div>
                        <div class="chat-type" :class="chat.accountType === 'student' ? 'student' : 'teacher'">
                            {{ chat.accountType === 'student' ? 'Студент' : 'Преподаватель' }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="chat-list-lower">
                <div v-if="chats.length === 0" class="no-results">Нет результатов</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const searchQuery = ref('');
const chats = ref([]);
const accountType = ref('');

const fetchChats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chats/list`, {
            params: { searchQuery: searchQuery.value },
            withCredentials: true
        });
        chats.value = response.data;
    } catch (error) {
        console.error('Не удалось загрузить данные чатов:', error);
    }
};

const searchChats = () => {
    fetchChats();
};

const fetchAccountType = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/profile-data`, { withCredentials: true });
        accountType.value = response.data.accountType;
    } catch (error) {
        console.error('Не удалось получить тип аккаунта:', error);
    }
};

const goToChat = (chatId) => {
    router.push(`/chats/sid=${chatId}`);
};

onMounted(() => {
    fetchAccountType().then(() => {
        fetchChats();
    });
});
</script>

<style scoped>
.chat-list-container {
    display: flex;
    height: 98vh;
    background-color: #f0f0f0;
}

.chat-list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 50px;
}

.chat-list-upper {
    background-color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    max-height: 80vh;
    overflow-y: auto;
}

.chat-list-title {
    font-size: 30px;
    font-weight: bold;
}

.search-container {
    display: flex;
    align-items: center;
    width: 1000px;
    margin-bottom: 20px;
}

.search-container input {
    padding: 10px;
    font-size: 18px;
    width: 100%;
    border: 1px solid #ccc;
    border-right: none;
    border-radius: 5px 0 0 5px;
}

.search-container button {
    padding: 11px 20px;
    font-size: 18px;
    border: none;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border-radius: 0 5px 5px 0;
}

.search-container button:hover {
    background-color: #0056b3;
}

.chat-list-lower {
    flex: 1;
    padding: 20px;
    display: flex;
    justify-content: center;
}

.chats-list {
    display: flex;
    flex-direction: column;
    width: 1000px;
    border: 1px solid #ccc;
}

.chat-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}

.chat-item:last-child {
    border-bottom: 1px solid #ccc;
}

.chat-item:hover {
    background-color: #f0f0f0;
}

.chat-avatar {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    margin-right: 20px;
}

.chat-info {
    flex: 1;
}

.chat-name {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 5px;
}

.chat-email {
    font-size: 22px;
    margin-bottom: 5px;
}

.chat-messages {
    font-size: 18px;
    font-weight: bold;
    color: #555;
    margin-right: 20px;
}

.chat-type {
    font-size: 18px;
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 10px;
    color: white;
}

.chat-type.student {
    background-color: #007bff;
}

.chat-type.teacher {
    background-color: #28a745;
}

.no-results {
    font-size: 24px;
    text-align: center;
    color: #777;
}
</style>