<template>
    <div class="profile-container">
        <div class="profile-content">
            <div v-if="userExists" class="profile-upper">
                <div class="profile-upper-left"></div>
                <div class="profile-upper-right">
                    <img :src="`data:image/png;base64,${profileImage}`" alt="Profile" class="profile-image"
                        @click="triggerFileInput" />
                    <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" />
                    <div class="profile-info">
                        <template v-if="!isEditing">
                            <h1>{{ fullName }}</h1>
                            <p><strong>Email:</strong> {{ email }}</p>
                            <p><strong>Группа:</strong> {{ section }}</p>
                            <pre class="description"><strong>Описание:</strong> {{ description }}</pre>
                        </template>
                        <template v-else>
                            <div class="edit-profile">
                                <label>ФИО:</label>
                                <input v-model="fullName" type="text" />
                                <label>Email:</label>
                                <input v-model="email" type="email" maxlength="50" />
                                <label>Группа:</label>
                                <select v-model="section">
                                    <option v-for="sect in sections" :key="sect.name" :value="sect.name">{{ sect.name }}
                                    </option>
                                </select>
                                <label>Описание:</label>
                                <textarea v-model="description" maxlength="1000"></textarea>
                            </div>
                        </template>
                        <button @click="handleWriteMessage" v-if="!isOwnProfile"><strong>Написать</strong></button>
                        <button @click="toggleEditProfile" :disabled="isLoading" v-else><strong>{{ isEditing ?
                            'Сохранить' : 'Редактировать'
                                }}</strong></button>
                    </div>
                </div>
            </div>
            <div v-else class="user-not-found">
                <h1>Данного пользователя не существует!</h1>
            </div>
            <div class="profile-lower">
                <div class="calendar-container">
                    <FullCalendar v-if="isTeacher" :options="calendarOptions" />
                </div>
            </div>
        </div>
    </div>
    <EventView v-if="showEventView" @close="handleCloseEventView" :event="selectedEvent" :registrations="registrations"
        :is-teacher="isTeacher" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import EventView from '@/views/event/EventView.vue';

const route = useRoute();
const router = useRouter();
const userId = route.params.id;

const profileImage = ref('');
const newProfileImage = ref(null);
const fullName = ref('');
const email = ref('');
const section = ref('');
const description = ref('');
const userExists = ref(true);
const isEditing = ref(false);
const isOwnProfile = ref(false);
const sections = ref([]);
const isLoading = ref(false);
const isTeacher = ref(false);
const isStudent = ref(false);
const events = ref([]);
const showEventView = ref(false);
const selectedEvent = ref(null);
const registrations = ref(0);

const fetchUserProfile = async () => {
    try {
        const response = await axios.get(`http://localhost:3000/users/id/${userId}`, { withCredentials: true });
        if (response.status === 200) {
            profileImage.value = response.data.profileImage;
            fullName.value = response.data.fullName;
            email.value = response.data.email;
            section.value = response.data.section;
            description.value = response.data.description;
            isOwnProfile.value = response.data.isOwnProfile;
            isTeacher.value = response.data.accountType === 'teacher';
            isStudent.value = response.data.accountType === 'student';
            if (isTeacher.value) {
                fetchTeacherEvents();
            }
        } else {
            userExists.value = false;
        }
    } catch (error) {
        console.error('Не удалось загрузить данные профиля:', error);
        userExists.value = false;
    }
};

const fetchSections = async () => {
    try {
        const response = await axios.get('http://localhost:3000/sections', { withCredentials: true });
        sections.value = response.data;
    } catch (error) {
        console.error('Не удалось загрузить данные секций:', error);
    }
};

const fetchTeacherEvents = async () => {
    try {
        const response = await axios.get(`http://localhost:3000/events?teacherId=${userId}`, { withCredentials: true });
        events.value = response.data;
        calendarOptions.value.events = [...events.value];
    } catch (error) {
        console.error('Не удалось загрузить события учителя:', error);
    }
};

const handleWriteMessage = async () => {
    try {
        const response = await axios.post('http://localhost:3000/chats/start', { userId }, { withCredentials: true });
        if (response.status === 200) {
            router.push(`/chats/sid=${response.data.sessionId}`);
        }
    } catch (error) {
        console.error('Не удалось создать или найти сессию чата:', error);
    }
};

const triggerFileInput = () => {
    if (isEditing.value) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = handleFileChange;
        fileInput.click();
    }
};

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            newProfileImage.value = e.target.result.split(',')[1];
            profileImage.value = newProfileImage.value;
        };
        reader.readAsDataURL(file);
    }
};

const toggleEditProfile = () => {
    if (isEditing.value) {
        saveProfileChanges();
    } else {
        isEditing.value = !isEditing.value;
    }
};

const saveProfileChanges = async () => {
    if (!fullName.value || !email.value || !section.value || !description.value) {
        alert('Все поля должны быть заполнены');
        return;
    }

    isLoading.value = true;

    try {
        await axios.put(`http://localhost:3000/users/id/${userId}`, {
            fullName: fullName.value,
            email: email.value,
            section: section.value,
            description: description.value,
            profileImage: newProfileImage.value
        }, { withCredentials: true });
        alert('Профиль успешно обновлен');
        isEditing.value = false;
        fetchUserProfile();
    } catch (error) {
        console.error('Не удалось обновить профиль:', error);
        alert(error.response?.data?.error || 'Не удалось обновить профиль');
    } finally {
        isLoading.value = false;
    }
};

const handleDateClick = () => {
    // Обработка клика по дате
};

const handleEventClick = async (info) => {
    try {
        const response = await axios.get(`http://localhost:3000/events/${info.event.id}`, { withCredentials: true });
        selectedEvent.value = response.data;
        const registrationResponse = await axios.get(`http://localhost:3000/events/${info.event.id}/registrations`, { withCredentials: true });
        registrations.value = registrationResponse.data.length;
        showEventView.value = true;
    } catch (error) {
        console.error('Error fetching event details:', error);
    }
};

const handleEventMouseEnter = (mouseEnterInfo) => {
    mouseEnterInfo.el.style.backgroundColor = '#e5e5e5';
};

const handleEventMouseLeave = (mouseLeaveInfo) => {
    mouseLeaveInfo.el.style.backgroundColor = mouseLeaveInfo.event.backgroundColor;
};

const handleCloseEventView = () => {
    showEventView.value = false;
    selectedEvent.value = null;
};

const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locales: [ruLocale],
    locale: 'ru',
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    eventMouseEnter: handleEventMouseEnter,
    eventMouseLeave: handleEventMouseLeave,
    events: events.value,
    height: 'auto',
    contentHeight: 'auto',
    aspectRatio: 1.5,
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    eventDisplay: 'block'
});

onMounted(() => {
    fetchUserProfile();
    fetchSections();
});
</script>

<style scoped>
.profile-container {
    display: flex;
    height: 98vh;
    background-color: #f0f0f0;
    overflow: auto;
}

.profile-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 50px;
}

.profile-upper,
.profile-lower {
    display: flex;
    align-items: center;
    justify-content: center;
}

.profile-upper {
    flex: 1;
    background-color: white;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
}

.profile-upper-left {
    flex: 1;
}

.profile-upper-right {
    flex: 3;
    display: flex;
    align-items: flex-start;
}

.profile-image {
    width: 350px;
    height: 350px;
    margin-right: 20px;
    border-radius: 50%;
    margin-top: 20px;
}

.profile-info {
    display: flex;
    flex-direction: column;
    font-size: 18px;
    width: 100%;
}

.profile-info h1 {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
}

.profile-info p {
    margin: 5px 0;
}

.profile-info pre.description {
    margin: 5px 0;
    white-space: pre-wrap;
    min-width: 800px;
    max-height: 200px;
    overflow-y: auto;
}

.profile-info strong {
    font-weight: bold;
}

.profile-info button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    width: 250px;
}

.profile-info button:hover {
    background-color: #0056b3;
}

.user-not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    font-size: 32px;
    font-weight: bold;
    color: #ff0000;
}

.edit-profile {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
}

.edit-profile label {
    font-weight: bold;
    margin-top: 10px;
}

.edit-profile input,
.edit-profile select,
.edit-profile textarea {
    padding: 10px;
    margin-top: 5px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.edit-profile textarea {
    resize: vertical;
    min-width: 800px;
    min-height: 50px;
    max-height: 200px;
}

.profile-lower {
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    margin-top: 10px;
    display: flex;
    justify-content: center;
}

.calendar-container {
    width: 80%;
    display: flex;
    justify-content: center;
}
</style>