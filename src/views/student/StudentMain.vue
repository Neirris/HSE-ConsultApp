<template>
    <div></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();

const fetchProfileData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/profile-data`, { withCredentials: true });
        const userId = response.data.userId;
        router.push(`/users/id/${userId}`);
    } catch (error) {
        console.error('Не удалось загрузить данные профиля:', error);
    }
};

onMounted(() => {
    fetchProfileData();
});
</script>