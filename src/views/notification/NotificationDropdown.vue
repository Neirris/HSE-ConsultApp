<template>
    <div class="notification-dropdown">
        <div class="notification-header">
            У вас {{ notifications.length }} уведомлений
        </div>
        <div class="notification-list">
            <div v-for="notification in notifications" :key="notification.id" class="notification-item"
                @click="handleClick(notification)">
                <img :src="getIcon(notification)" class="notification-icon" />
                <div class="notification-content">
                    {{ notification.message }}
                    <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
                </div>
            </div>
            <div class="view-all" @click="viewAllNotifications">
                Просмотреть все уведомления
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import { useToast, POSITION } from 'vue-toastification'

const notifications = ref([])
const router = useRouter()
const toast = useToast()

const fetchNotifications = async () => {
    try {
        const response = await axios.get('http://localhost:3000/notifications', { withCredentials: true })
        notifications.value = response.data.filter(notification => !notification.isRead).slice(0, 5)
    } catch (error) {
        console.error('Ошибка при получении уведомлений:', error)
    }
}

const handleClick = async (notification) => {
    try {
        await axios.post('http://localhost:3000/notifications/read', { notificationId: notification.id }, { withCredentials: true })

        if (notification.message.includes('отправил вам сообщение')) {
            const sessionId = notification.link.split('sid=')[1];
            router.push(`/chats/sid=${sessionId}`)
        } else {
            router.push(notification.link)
        }
        notifications.value = notifications.value.filter(n => n.id !== notification.id)
    } catch (error) {
        console.error('Ошибка при отметке уведомления как прочитанного:', error)
    }
}

const viewAllNotifications = () => {
    router.push('/notifications')
}

const formatTime = (timestamp) => {
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

const getIcon = (notification) => {
    if (notification.message.includes('отправил вам сообщение')) {
        return '/src/assets/icons/Chat.png'
    } else {
        return '/src/assets/icons/Calendar.png'
    }
}

onMounted(() => {
    fetchNotifications()

    const socket = io('http://localhost:3000')
    socket.on('notification', (data) => {
        toast.info(data.message, {
            timeout: 10000,
            position: POSITION.TOP_RIGHT
        })
        fetchNotifications()
    })
})
</script>

<style scoped>
.notification-dropdown {
    position: absolute;
    top: 57px;
    right: 30px;
    width: 300px;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    overflow: hidden;
    z-index: 10;
}

.notification-header {
    background-color: #99d5cf;
    padding: 10px;
    font-weight: bold;
    text-align: center;
}

.notification-list {
    max-height: 200px;
    overflow-y: auto;
}

.notification-item {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    border-bottom: 1px solid #eee;
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

.notification-time {
    font-size: 12px;
    color: gray;
    text-align: right;
}

.view-all {
    padding: 10px;
    background-color: #eeeeee;
    text-align: center;
    cursor: pointer;
    color: #1ca094;
}

.view-all:hover {
    text-decoration: underline;
}
</style>