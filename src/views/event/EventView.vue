<template>
    <div class="modal-overlay" @click="handleOverlayClick">
        <div class="content-container" @click.stop>
            <div class="modal">
                <div class="modal-header">
                    <h2>Событие</h2>
                    <p v-if="teacherName && !isOwnEvent" class="teacher-name">{{ teacherName }}</p>
                </div>
                <div class="modal-body">
                    <div class="modal-body-content">
                        <label for="event-title">Название:</label>
                        <input id="event-title" v-model="localEvent.title" type="text" readonly />
                        <label for="event-slots">Количество мест:</label>
                        <input id="event-slots" v-model="localEvent.slots" type="number" readonly />
                        <label for="event-description">Описание:</label>
                        <textarea id="event-description" v-model="localEvent.description" readonly></textarea>
                        <label for="event-start">Начало:</label>
                        <input id="event-start" v-model="localEvent.start" type="datetime-local" readonly />
                        <label for="event-end">Конец:</label>
                        <input id="event-end" v-model="localEvent.end" type="datetime-local" readonly />
                    </div>
                </div>
                <div class="modal-footer-bottom">
                    <button class="btn-close" @click="$emit('close')">Закрыть</button>
                    <button v-if="isTeacher && currentUserAccountType == 'student'" class="btn-register"
                        @click="handleRegistration">
                        {{ isRegistered ? 'Отписаться' : (availableSlots > 0 ? 'Записаться' : 'Мест нет') }}
                    </button>
                </div>
            </div>
            <div class="registrations-container">
                <div class="registrations-header">
                    <h3>Записавшиеся</h3>
                </div>
                <ol class="registrations-list">
                    <li v-for="student in registrations" :key="student.id" @click="goToUserProfile(student.id)"
                        class="registration-item">
                        <span>{{ student.fullName }}</span>
                        <span> ({{ student.email }})</span>
                    </li>
                </ol>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps(['event', 'isTeacher']);
const emit = defineEmits(['close']);

const localEvent = ref({ ...props.event });
const registrations = ref([]);
const isRegistered = ref(false);
const availableSlots = ref(props.event.slots);
const currentUserId = ref(null);
const currentUserAccountType = ref(null);
const teacherName = ref('');
const isOwnEvent = ref(false);

const fetchRegistrations = async (eventId) => {
    try {
        const response = await axios.get(`http://localhost:3000/events/${eventId}/registrations`, { withCredentials: true });
        registrations.value = response.data;
        isRegistered.value = registrations.value.some(student => student.id === currentUserId.value);
        availableSlots.value = props.event.slots - registrations.value.length;
    } catch (error) {
        console.error('Error fetching registrations:', error);
    }
};

const fetchCurrentUserId = async () => {
    try {
        const response = await axios.get('http://localhost:3000/profile-data', { withCredentials: true });
        currentUserId.value = response.data.userId;
        currentUserAccountType.value = response.data.accountType;
        fetchRegistrations(localEvent.value.id);
        isOwnEvent.value = currentUserId.value === localEvent.value.teacherId;
    } catch (error) {
        console.error('Error fetching current user ID:', error);
    }
};

const fetchTeacherName = async (teacherId) => {
    try {
        const response = await axios.get(`http://localhost:3000/users/id/${teacherId}`, { withCredentials: true });
        teacherName.value = response.data.fullName;
    } catch (error) {
        console.error('Error fetching teacher name:', error);
    }
};

watch(
    () => props.event,
    (newVal) => {
        localEvent.value = { ...newVal };
        if (currentUserId.value) {
            fetchRegistrations(newVal.id);
        }
        fetchTeacherName(newVal.teacherId);
    },
    { immediate: true }
);

const handleOverlayClick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        emit('close');
    }
};

const goToUserProfile = (userId) => {
    window.open(`http://localhost:5173/users/id/${userId}`, '_blank');
};

const handleRegistration = async () => {
    try {
        if (isRegistered.value) {
            // Отписаться
            await axios.delete(`http://localhost:3000/events/${localEvent.value.id}/registrations/${currentUserId.value}`, { withCredentials: true });
            isRegistered.value = false;
            availableSlots.value++;
        } else {
            // Записаться
            if (availableSlots.value > 0) {
                await axios.post(`http://localhost:3000/events/${localEvent.value.id}/registrations`, { studentId: currentUserId.value }, { withCredentials: true });
                isRegistered.value = true;
                availableSlots.value--;
            }
        }
        fetchRegistrations(localEvent.value.id);
    } catch (error) {
        console.error('Error handling registration:', error);
    }
};

onMounted(() => {
    fetchCurrentUserId();
    fetchTeacherName(localEvent.value.teacherId);
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.content-container {
    display: flex;
    align-items: flex-start;
}

.modal {
    background: white;
    padding: 2px;
    border-radius: 5px;
    width: 500px;
    max-width: 100%;
}

.modal-header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #009688;
    padding: 10px;
    color: white;
    border-radius: 5px 5px 0 0;
}

.teacher-name {
    font-size: 24px;
    font-weight: bold;
    color: #b0b0b0;
    margin-top: 0;
}

.modal-body {
    margin-top: 0;
    background-color: #d1ecf1;
    padding: 10px;
    border-radius: 0 0 5px 5px;
}

.modal-body-content {
    display: flex;
    flex-direction: column;
}

.modal-body label {
    margin-top: 10px;
}

.modal-body input,
.modal-body textarea {
    margin-top: 5px;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: none;
}

.modal-body input,
.modal-body textarea {
    background-color: #f0f0f0;
}

.modal-body input[readonly],
.modal-body textarea[readonly] {
    cursor: pointer;
}

.modal-footer-bottom {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.btn-close {
    background-color: red;
    color: white;
    padding: 10px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    width: 100%;
}

.btn-register {
    background-color: green;
    color: white;
    padding: 10px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    width: 100%;
    margin-left: 10px;
}

.registrations-container {
    background: white;
    padding: 0;
    margin-left: 20px;
    border-radius: 5px;
    max-height: 600px;
    overflow-y: auto;
    width: 400px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
}

.registrations-header {
    background-color: #5181b8;
    color: white;
    font-size: 18px;
    text-align: center;
    padding: 10px;
    border-radius: 5px 5px 0 0;
}

.registrations-list {
    flex-grow: 1;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    height: 395px;
}

.registration-item {
    cursor: pointer;
    padding: 10px;
    border-bottom: 1px solid #ccc;
    transition: background-color 0.3s;
}

.registration-item:hover {
    background-color: #f0f0f0;
}
</style>