<template>
    <div class="user-list-container">
        <div class="user-list-content">
            <div class="user-list-upper">
                <h1 class="user-list-title">{{ listTitle }}</h1>
                <div class="search-container">
                    <input v-model="searchQuery" type="text" placeholder="Поиск по фамилии, имени, отчеству или email">
                    <button @click="searchUsers">Поиск</button>
                </div>
                <div class="users-list">
                    <div v-for="user in users" :key="user.id" class="user-item" @click="goToUserProfile(user.id)">
                        <img :src="`data:image/png;base64,${user.profileImage}`" alt="Profile" class="user-avatar">
                        <div class="user-info">
                            <p class="user-name">{{ user.fullName }}</p>
                            <p class="user-email">{{ user.email }}</p>
                        </div>
                        <div class="user-type" :class="user.accountType === 'student' ? 'student' : 'teacher'">
                            {{ user.accountType === 'student' ? 'Студент' : 'Преподаватель' }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="user-list-lower">
                <div v-if="users.length === 0" class="no-results">Нет результатов</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const users = ref([]);
const accountType = ref('');
const listTitle = ref('');

const fetchUsers = async () => {
    try {
        const response = await axios.get('http://localhost:3000/users/list', {
            params: { searchQuery: searchQuery.value },
            withCredentials: true
        });
        users.value = response.data;
    } catch (error) {
        console.error('Не удалось загрузить данные пользователей:', error);
    }
};

const searchUsers = () => {
    fetchUsers();
};

const fetchAccountType = async () => {
    try {
        const response = await axios.get('http://localhost:3000/profile-data', { withCredentials: true });
        accountType.value = response.data.accountType;
        listTitle.value = accountType.value === 'student' ? 'Список преподавателей' : 'Список студентов';
    } catch (error) {
        console.error('Не удалось получить тип аккаунта:', error);
    }
};

const goToUserProfile = (userId) => {
    router.push(`/users/id/${userId}`);
};

onMounted(() => {
    fetchAccountType().then(() => {
        fetchUsers();
    });
});
</script>

<style scoped>
.user-list-container {
    display: flex;
    height: 98vh;
    background-color: #f0f0f0;
    /* Серый фон */
}

.user-list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 50px;
}

.user-list-upper {
    background-color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    max-height: 80vh;
    overflow-y: auto;
}

.user-list-title {
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

.user-list-lower {
    flex: 1;
    padding: 20px;
    display: flex;
    justify-content: center;
}

.users-list {
    display: flex;
    flex-direction: column;
    width: 1000px;
    border: 1px solid #ccc;
}

.user-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}

.user-item:last-child {
    border-bottom: 1px solid #ccc;
}

.user-item:hover {
    background-color: #f0f0f0;
}

.user-avatar {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    margin-right: 20px;
}

.user-info {
    flex: 1;
}

.user-name {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 5px;
}

.user-email {
    font-size: 22px;
    margin-bottom: 5px;
}

.user-type {
    font-size: 18px;
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 10px;
    color: white;
}

.user-type.student {
    background-color: #007bff;
}

.user-type.teacher {
    background-color: #28a745;
}

.no-results {
    font-size: 24px;
    text-align: center;
    color: #777;
}
</style>