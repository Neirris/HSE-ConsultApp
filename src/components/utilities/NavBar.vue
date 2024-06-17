<template>
    <div class="navbar">
        <img src="@/assets/icons/Notification.png" alt="Notifications" class="navbar__notification-icon"
            @click="toggleDropdown">
        <NotificationDropdown v-if="showDropdown" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import NotificationDropdown from '@/views/notification/NotificationDropdown.vue'

const showDropdown = ref(false)

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
}
</script>

<style scoped>
.navbar {
    width: 100%;
    height: 57px;
    background-color: #009688;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 30px;
    border-bottom: 1px solid #ccc;
}

.navbar__notification-icon {
    width: 30px;
    height: 30px;
    cursor: pointer;
    margin-right: 20px;
    filter: brightness(0) invert(1);
}
</style>