<template>
    <div :class="['sidebar', { expanded: isSidebarExpanded }]" @mouseenter="expandSidebar"
        @mouseleave="collapseSidebar">
        <div class="sidebar__profile" v-if="profileImage && userName" @click="toggleProfileMenu">
            <img :src="`data:image/png;base64,${profileImage}`" alt="Profile" class="sidebar__profile-icon" />
            <span class="sidebar__menu-text">{{ firstName }}</span>
        </div>
        <div v-if="isProfileMenuVisible && isSidebarExpanded" class="profile-menu">
            <button @click="goToProfile">Профиль</button>
            <button @click="logout">Выход</button>
        </div>
        <div v-for="item in menuItems" :key="item.text"
            :class="['sidebar__menu-item-container', { 'sidebar__menu-item-container--current': isActive(item), 'sidebar__menu-item-container--expanded': item.isExpanded }]"
            @mouseenter="expandItem(item)" @mouseleave="collapseItem(item)">
            <button class="sidebar__menu-item" :style="menuItemStyle(item)" @click="handleMenuClick(item)">
                <template v-if="item.icon">
                    <img v-if="isImageIcon(item.icon)" :src="item.icon" alt="Menu Icon" class="sidebar__menu-icon"
                        :class="{ 'inverted-icon': accountType !== 'admin' }" />
                    <span v-else class="sidebar__menu-icon admin-icon">{{ item.icon }}</span>
                </template>
                <span class="sidebar__menu-text">{{ item.text }}</span>
                <img v-if="item.subMenu" :src="MiniTriangle" class="sidebar__mini-triangle"
                    :class="{ 'sidebar__mini-triangle-rotated': item.isExpanded }" />
            </button>
            <div v-if="item.isExpanded && item.subMenu" class="sidebar__sub-menu">
                <button v-for="subItem in item.subMenu" :key="subItem.text" class="sidebar__sub-menu-item"
                    @click="handleSubMenuClick(subItem)">
                    <span v-if="subItem.icon" class="sidebar__menu-icon">{{ subItem.icon }}</span>
                    <span class="sidebar__menu-text">{{ subItem.text }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import homeIcon from '@/assets/icons/Home.png';
import calendarIcon from '@/assets/icons/Calendar.png';
import teachersIcon from '@/assets/icons/Person.png';
import chatsIcon from '@/assets/icons/Chat.png';
import manageIcon from '@/assets/icons/Settings.png';
import studentsIcon from '@/assets/icons/Person.png';
import MiniTriangle from '@/assets/icons/MiniTriangle.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const route = useRoute();
const profileImage = ref('');
const userName = ref('');
const accountType = ref('');
const userId = ref('');
const shouldShowSidebar = ref(false);
const isSidebarExpanded = ref(false);
const isProfileMenuVisible = ref(false);
const menuItems = ref([]);

const fetchProfileData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/profile-data`, { withCredentials: true });
        profileImage.value = response.data.profileImage;
        userName.value = response.data.fullName;
        accountType.value = response.data.accountType;
        userId.value = response.data.userId;
        shouldShowSidebar.value = accountType.value === 'student' || accountType.value === 'teacher' || accountType.value === 'admin';
    } catch (error) {
        console.error('Не удалось загрузить данные профиля:', error);
        shouldShowSidebar.value = false;
    }
};

const getFirstName = (fullName) => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
        return nameParts[0];
    } else if (nameParts.length > 1) {
        return nameParts[1];
    }
    return '';
};

const firstName = computed(() => getFirstName(userName.value));

onMounted(() => {
    fetchProfileData().then(() => {
        if (accountType.value === 'student') {
            menuItems.value = [
                { text: 'Главная', icon: homeIcon, route: '/student' },
                { text: 'Календарь', icon: calendarIcon, route: '/student/calendar' },
                { text: 'Преподаватели', icon: teachersIcon, route: '/users/list' },
                { text: 'Чаты', icon: chatsIcon, route: '/chats' }
            ];
        } else if (accountType.value === 'teacher') {
            menuItems.value = [
                { text: 'Главная', icon: homeIcon, route: '/teacher' },
                { text: 'Календарь', icon: calendarIcon, route: '/teacher/calendar' },
                { text: 'Управление', icon: manageIcon, route: '/teacher/manage' },
                { text: 'Студенты', icon: studentsIcon, route: '/users/list' },
                { text: 'Чаты', icon: chatsIcon, route: '/chats' }
            ];
        } else if (accountType.value === 'admin') {
            menuItems.value = [
                { text: 'Пользователи', icon: 'US', route: '/admin/users' },
                { text: 'Профили', icon: 'PR', route: '/admin/profiles' },
                { text: 'Группы', icon: 'SE', route: '/admin/sections' },
                { text: 'Консультации', icon: 'CO', route: '/admin/consultations' },
                { text: 'Записи', icon: 'CR', route: '/admin/consultationRegistrations' },
                { text: 'Чат-сессии', icon: 'CS', route: '/admin/chatSessions' },
                { text: 'Чат-сообщения', icon: 'CM', route: '/admin/chatMessages' },
                { text: 'Уведомления', icon: 'NO', route: '/admin/notifications' }
            ];
        }
    });
});

const expandSidebar = () => {
    isSidebarExpanded.value = true;
};

const collapseSidebar = () => {
    isSidebarExpanded.value = false;
    isProfileMenuVisible.value = false; // Скрыть меню профиля при сворачивании сайдбара
    menuItems.value.forEach(item => item.isExpanded = false);
};

const expandItem = (item) => {
    item.isExpanded = true;
};

const collapseItem = (item) => {
    item.isExpanded = false;
};

const menuItemStyle = (item) => ({ backgroundColor: item.isExpanded ? '#0d1214' : '' });

const handleMenuClick = (item) => {
    if (item.route) {
        router.push(item.route);
    } else if (item.subMenu) {
        toggleSubMenu(item);
    }
};

const handleSubMenuClick = (subItem) => {
    if (subItem.url) {
        window.open(subItem.url, '_blank');
    }
};

const toggleSubMenu = (item) => {
    item.isExpanded = !item.isExpanded;
};

const isActive = (item) => {
    return item.route === route.path;
};

const toggleProfileMenu = () => {
    isProfileMenuVisible.value = !isProfileMenuVisible.value;
};

const goToProfile = () => {
    router.push(`/users/id/${userId.value}`);
};

const logout = async () => {
    try {
        await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        router.push('/auth');
    } catch (error) {
        console.error('Ошибка при выходе из аккаунта:', error);
    }
};

const isImageIcon = (icon) => {
    return icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.jpeg') || icon.endsWith('.svg');
};
</script>

<style scoped>
/* === SIDE BAR === */
.sidebar {
    width: 55px;
    height: 100vh;
    background-color: #222d32;
    transition: width 0.3s;
    position: fixed;
    left: 0;
    top: 0;
    overflow: hidden;
    border-right: 3px solid gray;
    z-index: 2;
}

.sidebar.expanded {
    width: 190px;
}

.sidebar__profile {
    display: flex;
    align-items: center;
    padding: 10px;
    font-size: 18px;
    font-weight: bold;
    color: #ffffe4;
    border-bottom: 2px solid dimgray;
    background-color: #11625d;
    cursor: pointer;
}

.sidebar__profile-icon {
    min-width: 35px;
    min-height: 35px;
    width: 35px;
    height: 35px;
    margin-right: 10px;
    border-radius: 50%;
}

.profile-menu {
    position: absolute;
    top: 60px;
    left: 10px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 3;
}

.profile-menu button {
    display: block;
    width: 166px;
    padding: 10px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
}

.profile-menu button:hover {
    background-color: #f0f0f0;
}

.sidebar__menu-item-container {
    position: relative;
}

.sidebar__menu-item-container--current::before,
.sidebar__menu-item-container--expanded::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    background-color: #009688;
}

.sidebar__menu-item {
    display: flex;
    align-items: center;
    padding: 5px;
    color: #ffffe4;
    margin: 5px;
    transition: background-color 0.3s;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    user-select: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
}

.sidebar__menu-item--expanded {
    background-color: #0d1214;
}

.sidebar__menu-item:hover,
.sidebar__sub-menu-item:hover {
    background-color: #5b6192;
}

.sidebar__sub-menu {
    background-color: inherit;
}

.sidebar__sub-menu-item {
    display: flex;
    align-items: center;
    padding: 5px;
    color: #ffffe4;
    margin: 5px;
    transition: background-color 0.3s;
    background: none;
    border: none;
    width: 95%;
    text-align: left;
    user-select: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
}

.sidebar__menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    margin-right: 10px;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
}

.admin-icon {
    background-color: #009688;
    color: #fff;
    border-radius: 50%;
    font-size: 14px;
    font-weight: bold;
    flex-shrink: 0;
}

.inverted-icon {
    filter: invert(100%);
}

.sidebar__mini-triangle {
    right: 0;
    transition: transform 0.3s;
}

.sidebar__mini-triangle-rotated {
    transform: rotate(180deg);
}

.sidebar__menu-text {
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.3s;
    opacity: 0;
}

.sidebar__menu-item--expanded .sidebar__menu-text,
.sidebar.expanded .sidebar__menu-text {
    opacity: 1;
}
</style>