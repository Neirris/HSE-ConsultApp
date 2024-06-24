<template>
    <div class="event-manage-container">
        <div class="event-manage-content">
            <div class="event-manage-upper">
                <h1 class="event-manage-title">События и их участники</h1>
                <div class="search-container">
                    <input v-model="searchQuery" type="text" placeholder="Поиск событий и участников...">
                    <button @click="searchEvents">Поиск</button>
                </div>
            </div>
            <div class="event-list-container">
                <div class="event-list">
                    <div class="event-list-header" @click="toggleUpcoming">
                        <h2 class="event-list-title">Предстоящие события</h2>
                        <img :class="{ rotated: showUpcoming }" src="@/assets/icons/ArrowDown.png"
                            class="toggle-arrow white-arrow" alt="Toggle Arrow">
                    </div>
                    <transition name="slide" mode="out-in">
                        <div v-if="showUpcoming" class="event-items">
                            <div v-for="event in filteredUpcomingEvents" :key="event.id" class="event-item">
                                <div class="event-header" @click="toggleEvent(event.id)">
                                    <div class="event-title-container">
                                        <h3 class="event-title">
                                            {{ event.title }}
                                            <span class="event-date">({{ formatDate(event.start) }} - {{
                                                formatTime(event.end) }})</span>
                                        </h3>
                                    </div>
                                    <div class="event-actions">
                                        <img @click.stop="openEditModal(event)" src="@/assets/icons/Edit.png"
                                            class="edit-icon" alt="Edit">
                                        <img :class="{ rotated: event.show }" src="@/assets/icons/ArrowDown.png"
                                            class="toggle-arrow" alt="Toggle Arrow">
                                    </div>
                                </div>
                                <transition name="drop">
                                    <div v-if="event.show" class="event-details">
                                        <p><strong>Описание:</strong> <span class="description">{{ event.description
                                                }}</span></p>
                                        <p><strong>Количество слотов:</strong> {{ event.slots }}</p>
                                        <p><strong>Записалось:</strong> {{ event.registrationsCount }}</p>
                                        <p><strong>Начало:</strong> {{ formatDate(event.start) }}</p>
                                        <p><strong>Конец:</strong> {{ formatDate(event.end) }}</p>
                                        <div class="participants">
                                            <div class="participants-header" @click.stop="toggleParticipants(event.id)">
                                                <h4>Участники</h4>
                                                <img :class="{ rotated: event.showParticipants }"
                                                    src="@/assets/icons/ArrowDown.png" class="toggle-arrow"
                                                    alt="Toggle Arrow">
                                            </div>
                                            <transition name="drop">
                                                <div v-if="event.showParticipants" class="participants-list">
                                                    <ul>
                                                        <li v-for="participant in event.registrations"
                                                            :key="participant.id">
                                                            <span @click="viewProfile(participant.id)"
                                                                class="participant-name">
                                                                {{ participant.fullName }} ({{ participant.email }})
                                                            </span>
                                                            <span @click="removeParticipant(event.id, participant.id)"
                                                                class="remove-participant">&times;</span>
                                                        </li>
                                                        <li v-if="event.registrationsCount < event.slots"
                                                            @click.stop="showStudentSearch(event.id)"
                                                            class="add-participant">
                                                            + Добавить участника
                                                        </li>
                                                        <li v-if="event.showStudentSearch" class="search-student">
                                                            <multiselect v-model="selectedStudent"
                                                                :options="filteredStudents" :searchable="true"
                                                                :close-on-select="true" :show-labels="false"
                                                                placeholder="Поиск студентов..." label="fullName"
                                                                track-by="id">
                                                                <template #option="{ option }">
                                                                    {{ option.fullName }} ({{ option.email }})
                                                                </template>
                                                            </multiselect>
                                                            <button class="add-button"
                                                                @click="addParticipant(event.id, selectedStudent.id)">Добавить</button>
                                                        </li>
                                                    </ul>
                                                    <div v-if="registrationError" class="error-message">{{
                                                        registrationError }}</div>
                                                </div>
                                            </transition>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </div>
                    </transition>
                </div>
                <div class="event-list">
                    <div class="event-list-header" @click="togglePast">
                        <h2 class="event-list-title">Прошедшие события</h2>
                        <img :class="{ rotated: showPast }" src="@/assets/icons/ArrowDown.png"
                            class="toggle-arrow white-arrow" alt="Toggle Arrow">
                    </div>
                    <transition name="slide" mode="out-in">
                        <div v-if="showPast" class="event-items">
                            <div v-for="event in filteredPastEvents" :key="event.id" class="event-item">
                                <div class="event-header" @click="toggleEvent(event.id)">
                                    <div class="event-title-container">
                                        <h3 class="event-title">
                                            {{ event.title }}
                                            <span class="event-date">({{ formatDate(event.start) }} - {{
                                                formatTime(event.end)
                                                }})</span>
                                        </h3>
                                    </div>
                                    <div class="event-actions">
                                        <img @click.stop="openEditModal(event)" src="@/assets/icons/Edit.png"
                                            class="edit-icon" alt="Edit">
                                        <img :class="{ rotated: event.show }" src="@/assets/icons/ArrowDown.png"
                                            class="toggle-arrow" alt="Toggle Arrow">
                                    </div>
                                </div>
                                <transition name="drop">
                                    <div v-if="event.show" class="event-details">
                                        <p><strong>Описание:</strong> <span class="description">{{ event.description
                                                }}</span></p>
                                        <p><strong>Количество слотов:</strong> {{ event.slots }}</p>
                                        <p><strong>Записалось:</strong> {{ event.registrationsCount }}</p>
                                        <p><strong>Начало:</strong> {{ new Date(event.start).toLocaleString() }}</p>
                                        <p><strong>Конец:</strong> {{ new Date(event.end).toLocaleString() }}</p>
                                        <div class="participants">
                                            <div class="participants-header" @click.stop="toggleParticipants(event.id)">
                                                <h4>Участники</h4>
                                                <img :class="{ rotated: event.showParticipants }"
                                                    src="@/assets/icons/ArrowDown.png" class="toggle-arrow"
                                                    alt="Toggle Arrow">
                                            </div>
                                            <transition name="drop">
                                                <div v-if="event.showParticipants" class="participants-list">
                                                    <ul>
                                                        <li v-for="participant in event.registrations"
                                                            :key="participant.id">
                                                            <span @click="viewProfile(participant.id)"
                                                                class="participant-name">
                                                                {{ participant.fullName }} ({{ participant.email }})
                                                            </span>
                                                            <span @click="removeParticipant(event.id, participant.id)"
                                                                class="remove-participant">&times;</span>
                                                        </li>
                                                        <li v-if="event.registrationsCount < event.slots"
                                                            @click.stop="showStudentSearch(event.id)"
                                                            class="add-participant">
                                                            + Добавить участника
                                                        </li>
                                                        <li v-if="event.showStudentSearch" class="search-student">
                                                            <multiselect v-model="selectedStudent"
                                                                :options="filteredStudents" :searchable="true"
                                                                :close-on-select="true" :show-labels="false"
                                                                placeholder="Поиск студентов..." label="fullName"
                                                                track-by="id">
                                                                <template #option="{ option }">
                                                                    {{ option.fullName }} ({{ option.email }})
                                                                </template>
                                                            </multiselect>
                                                            <button class="add-button"
                                                                @click="addParticipant(event.id, selectedStudent.id)">Добавить</button>
                                                        </li>
                                                    </ul>
                                                    <div v-if="registrationError" class="error-message">{{
                                                        registrationError }}</div>
                                                </div>
                                            </transition>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </div>
    <EventModal v-if="showModal" :newEvent="currentEvent" :isEdit="isEdit"
        :registrations="currentEvent.registrationsCount" @close="closeModal" @save="saveEvent" @delete="deleteEvent" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Multiselect from 'vue-multiselect';
import EventModal from './EventModal.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const searchQuery = ref('');
const events = ref([]);
const students = ref([]);
const showUpcoming = ref(false);
const showPast = ref(false);
const studentSearchQuery = ref('');
const registrationError = ref('');
const selectedStudent = ref(null);
const showModal = ref(false);
const currentEvent = ref(null);
const isEdit = ref(false);

const fetchEvents = async () => {
    try {
        const userResponse = await axios.get(`${API_BASE_URL}/profile-data`, { withCredentials: true });
        const currentUserId = userResponse.data.userId;
        const currentUserAccountType = userResponse.data.accountType;

        let response;
        if (currentUserAccountType === 'teacher') {
            response = await axios.get(`${API_BASE_URL}/events?teacherId=${currentUserId}`, { withCredentials: true });
        } else if (currentUserAccountType === 'student') {
            response = await axios.get(`${API_BASE_URL}/events?studentId=${currentUserId}`, { withCredentials: true });
        } else {
            throw new Error('Unsupported user account type');
        }

        const eventData = response.data.map(event => ({
            ...event,
            show: false,
            showParticipants: false,
            showStudentSearch: false,
            registrations: [],
            registrationsCount: 0
        }));

        for (const event of eventData) {
            const registrationsResponse = await axios.get(`${API_BASE_URL}/events/${event.id}/registrations`, { withCredentials: true });
            event.registrations = registrationsResponse.data;
            event.registrationsCount = registrationsResponse.data.length;
        }

        events.value = eventData;
    } catch (error) {
        console.error('Не удалось загрузить данные событий:', error);
    }
};

const fetchStudents = async (eventId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/not-registered/${eventId}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Не удалось загрузить данные студентов:', error);
        return [];
    }
};

const searchEvents = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/events/search`, {
            params: { query: searchQuery.value },
            withCredentials: true
        });
        events.value = response.data.map(event => ({
            ...event,
            show: false,
            showParticipants: false,
            showStudentSearch: false,
            registrations: [],
            registrationsCount: 0
        }));

        for (const event of events.value) {
            const registrationsResponse = await axios.get(`${API_BASE_URL}/events/${event.id}/registrations`, { withCredentials: true });
            event.registrations = registrationsResponse.data;
            event.registrationsCount = registrationsResponse.data.length;
        }
    } catch (error) {
        console.error('Не удалось выполнить поиск событий:', error);
    }
};

const toggleEvent = async (eventId) => {
    const event = events.value.find(event => event.id === eventId);
    if (event) {
        event.show = !event.show;
        if (event.show && event.registrations.length === 0) {
            try {
                const response = await axios.get(`${API_BASE_URL}/events/${eventId}/registrations`, { withCredentials: true });
                event.registrations = response.data;
                event.registrationsCount = response.data.length;
            } catch (error) {
                console.error('Не удалось загрузить данные регистраций:', error);
            }
        }
    }
};

const toggleParticipants = (eventId) => {
    const event = events.value.find(event => event.id === eventId);
    if (event) {
        event.showParticipants = !event.showParticipants;
    }
};

const showStudentSearch = async (eventId) => {
    const event = events.value.find(event => event.id === eventId);
    if (event) {
        event.showStudentSearch = true;
        students.value = await fetchStudents(eventId);
    }
};

const addParticipant = async (eventId, studentId) => {
    const event = events.value.find(event => event.id === eventId);
    if (event) {
        try {
            await axios.post(`${API_BASE_URL}/events/${eventId}/registrations`, { studentId }, { withCredentials: true });
            event.registrations.push(students.value.find(student => student.id === studentId));
            event.registrationsCount += 1;
            event.showStudentSearch = false;
            registrationError.value = '';
        } catch (error) {
            console.error('Не удалось добавить участника:', error);
            if (error.response && error.response.data && error.response.data.error) {
                registrationError.value = error.response.data.error;
            } else {
                registrationError.value = 'Не удалось добавить участника';
            }
        }
    }
};

const removeParticipant = async (eventId, participantId) => {
    const event = events.value.find(event => event.id === eventId);
    if (event) {
        try {
            await axios.delete(`${API_BASE_URL}/events/${eventId}/registrations/${participantId}`, { withCredentials: true });
            event.registrations = event.registrations.filter(participant => participant.id !== participantId);
            event.registrationsCount -= 1;
        } catch (error) {
            console.error('Не удалось удалить участника:', error);
        }
    }
};

const viewProfile = (participantId) => {
    window.open(`${API_BASE_URL}/users/id/${participantId}`, '_blank');
};

const openEditModal = (event) => {
    currentEvent.value = { ...event };
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    currentEvent.value = null;
    isEdit.value = false;
};

const saveEvent = async (event) => {
    try {
        await axios.put(`${API_BASE_URL}/events/${event.id}`, event, { withCredentials: true });
        fetchEvents();
        closeModal();
    } catch (error) {
        console.error('Не удалось сохранить изменения события:', error);
    }
};

const deleteEvent = async (eventId) => {
    try {
        await axios.delete(`${API_BASE_URL}/events/${eventId}`, { withCredentials: true });
        fetchEvents();
        closeModal();
    } catch (error) {
        console.error('Не удалось удалить событие:', error);
    }
};

const toggleUpcoming = () => {
    showUpcoming.value = !showUpcoming.value;
};

const togglePast = () => {
    showPast.value = !showPast.value;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const filteredUpcomingEvents = computed(() => {
    const now = new Date();
    if (searchQuery.value) {
        return events.value.filter(event => (new Date(event.start) >= now || new Date(event.end) >= now) && event.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
    }
    return events.value.filter(event => new Date(event.start) >= now || new Date(event.end) >= now);
});

const filteredPastEvents = computed(() => {
    const now = new Date();
    if (searchQuery.value) {
        return events.value.filter(event => new Date(event.end) < now && new Date(event.start).toDateString() !== now.toDateString() && event.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
    }
    return events.value.filter(event => new Date(event.end) < now && new Date(event.start).toDateString() !== now.toDateString());
});

const filteredStudents = computed(() => {
    if (studentSearchQuery.value) {
        return students.value.filter(student => student.fullName.toLowerCase().includes(studentSearchQuery.value.toLowerCase()));
    }
    return students.value;
});

onMounted(() => {
    fetchEvents();
});
</script>

<style scoped>
.event-manage-container {
    display: flex;
    height: 100vh;
    background-color: #f0f0f0;
    overflow-y: auto;
}

.event-manage-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 50px;
}

.event-manage-upper {
    background-color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.event-manage-title {
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
    width: calc(100% - 120px);
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
    width: 120px;
}

.search-container button:hover {
    background-color: #0056b3;
}

.event-list-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: white;
    width: 1000px;
    margin: 0 auto;
}

.event-list {
    width: 100%;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #e9ecef;
}

.event-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    background-color: #222d32;
    color: white;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}

.event-list-title {
    font-size: 24px;
    font-weight: bold;
}

.toggle-arrow {
    width: 24px;
    height: 24px;
    transition: transform 0.3s;
}

.toggle-arrow.rotated {
    transform: rotate(180deg);
}

.toggle-arrow:hover {
    background-color: #555;
    border-radius: 50%;
}

.white-arrow {
    filter: invert(1);
}

.event-date {
    font-size: 14px;
    color: gray;
}

.event-actions {
    display: flex;
    align-items: center;
}

.edit-icon {
    width: 24px;
    height: 24px;
    margin-right: 5px;
    cursor: pointer;
}

.event-items {
    width: 100%;
    overflow: hidden;
    transition: max-height 0.5s ease;
}

.event-item {
    background-color: #e9ecef;
    padding: 5px 10px;
    border-bottom: 1px solid gray;
    cursor: pointer;
    transition: background-color 0.3s;
}

.event-item:hover {
    background-color: #c0c0c0;
}

.event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.event-title-container {
    flex: 1;
    min-width: 0;
}

.event-title {
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-details {
    padding: 10px;
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.description {
    max-width: 600px;
    word-wrap: break-word;
}

.participants {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    padding-top: 0;
    background-color: #e9ecef;
}

.participants-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.participants h4 {
    cursor: pointer;
    margin-bottom: 5px;
}

.participants-list ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.participants-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    background-color: #f9f9f9;
}

.participant-name {
    cursor: pointer;
    text-decoration: none;
}

.participant-name:hover {
    text-decoration: underline;
    color: blue;
}

.remove-participant {
    cursor: pointer;
    color: red;
    padding: 5px;
    border-radius: 50%;
    transition: background-color 0.3s, transform 0.3s;
}

.remove-participant:hover {
    background-color: #f8d7da;
    transform: scale(1.2);
}

.add-participant {
    cursor: pointer;
    color: blue;
}

.add-participant:hover {
    color: darkblue;
}

.search-student {
    margin-top: 10px;
}

.search-student ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.search-student li {
    cursor: pointer;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 5px;
}

.search-student li:hover {
    background-color: #e9ecef;
}

.error-message {
    color: red;
    margin-top: 10px;
}

.add-button {
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    background-color: #28a745;
    color: white;
    cursor: pointer;
    border-radius: 5px;
    margin-top: 10px;
}

.add-button:hover {
    background-color: #218838;
}

.slide-enter-active,
.slide-leave-active {
    transition: max-height 0.5s ease;
}

.slide-enter,
.slide-leave-to {
    max-height: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.drop-enter-active,
.drop-leave-active {
    transition: max-height 0.5s ease;
    overflow: hidden;
}

.drop-enter,
.drop-leave-to {
    max-height: 0;
}

.drop-enter-active,
.drop-leave-active {
    transition: max-height 0.5s ease, opacity 0.5s ease;
}

.drop-enter,
.drop-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>