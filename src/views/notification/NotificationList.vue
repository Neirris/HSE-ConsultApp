<template>
    <div class="notification-view">
        <div class="notification-header">
            Все уведомления
        </div>
        <div class="notification-list">
            <div v-for="notification in notifications" :key="notification.id" class="notification-item"
                @click="handleClick(notification)">
                <img :src="getIcon(notification)" class="notification-icon" />
                <div class="notification-content">
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time" :title="formatFullTimestamp(notification.timestamp)">
                        {{ formatTimestamp(notification.timestamp) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const notifications = ref([])
const router = useRouter()

const fetchNotifications = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/notifications`, { withCredentials: true })
        notifications.value = response.data
    } catch (error) {
        console.error('Ошибка при получении уведомлений:', error)
    }
}

const handleClick = async (notification) => {
    try {
        await axios.post(`${API_BASE_URL}/notifications/read`, { notificationId: notification.id }, { withCredentials: true })

        if (notification.message.includes('отправил вам сообщение')) {
            router.push(notification.link)
        } else {
            router.push(notification.link)
        }
    } catch (error) {
        console.error('Ошибка при отметке уведомления как прочитанного:', error)
    }
}

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 60000)

    if (diff < 60) {
        return `${diff} мин. назад`
    } else if (diff < 1440) {
        const hours = Math.floor(diff / 60)
        return `${hours} ч. назад`
    } else {
        return date.toLocaleDateString()
    }
}

const formatFullTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getIcon = (notification) => {
    if (notification.message.includes('отправил вам сообщение')) {
        return new URL('@/assets/icons/Chat.png', import.meta.url).href
    } else {
        return new URL('@/assets/icons/Calendar.png', import.meta.url).href
    }
}

onMounted(() => {
    fetchNotifications()
})
</script>

<style scoped>
.notification-view {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.notification-header {
    background-color: #99d5cf;
    padding: 10px;
    font-weight: bold;
    text-align: center;
    border-radius: 5px 5px 0 0;
}

.notification-list {
    max-height: 400px;
    overflow-y: auto;
    margin-top: 10px;
}

.notification-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.3s;
    cursor: pointer;
}

.notification-item:hover {
    background-color: #f0f0f0;
}

.notification-icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
}

.notification-content {
    flex: 1;
}

.notification-message {
    margin-bottom: 5px;
}

.notification-time {
    font-size: 12px;
    color: gray;
    text-align: right;
}
</style>