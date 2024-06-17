<template>
    <div class="calendar-container">
        <div class="calendar-upper">
            <div class="calendar-header">
                <img src="@/assets/icons/Calendar.png" alt="Calendar Icon" class="calendar-icon" />
                <h1 class="calendar-title">Календарь</h1>
            </div>
        </div>
        <div class="calendar-lower">
            <div class="calendar-content">
                <div class="calendar-left">
                    <h2>Ближайшие события</h2>
                    <div class="event-cards">
                        <div v-for="event in upcomingEvents" :key="event.id"
                            :style="{ backgroundColor: event.backgroundColor }" class="event-card pointer-cursor"
                            @click="openEventView(event)">
                            <h3 class="event-title">{{ truncateTitle(event.title) }}</h3>
                            <p class="event-info">{{ event.slots }} ч. <span class="event-registrations">| {{
                                event.registrations }} записалось</span></p>
                            <p class="event-description">Описание: <span class="event-text">{{
                                truncateDescription(event.description) }}</span></p>
                            <p class="event-time">Начало: <span class="event-text">{{ formatDate(event.start) }}</span>
                            </p>
                            <p class="event-time">Конец: <span class="event-text">{{ formatDate(event.end) }}</span></p>
                        </div>
                    </div>
                </div>
                <div class="calendar-right">
                    <FullCalendar :options="calendarOptions" />
                </div>
            </div>
        </div>
        <EventModal v-if="showModal" @close="handleCloseModal" @save="handleSaveEvent" @delete="handleDeleteEvent"
            @refresh="fetchEvents" :new-event="newEvent" :is-edit="isEdit" :registrations="registrations">
            <template #header>
                <h2>{{ isEdit ? 'Редактировать событие' : 'Добавить событие' }}</h2>
            </template>
        </EventModal>
        <EventView v-if="showEventView" @close="handleCloseEventView" :event="selectedEvent"
            :registrations="registrations" :is-student="currentUserAccountType === 'student'" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import EventModal from '@/views/event/EventModal.vue';
import EventView from '@/views/event/EventView.vue';

const showModal = ref(false);
const showEventView = ref(false);
const isEdit = ref(false);
const newEvent = ref({
    title: '',
    description: '',
    start: '',
    end: '',
    slots: 1
});
const selectedEvent = ref(null);
const registrations = ref(0);

const events = ref([]);
const upcomingEvents = ref([]);
const colors = ['#009688', '#5181b8'];
const currentUserId = ref(null);
const currentUserAccountType = ref(null);

const handleDateClick = (info) => {
    if (currentUserAccountType.value === 'teacher') {
        isEdit.value = false;
        newEvent.value = {
            title: '',
            description: '',
            start: info.dateStr,
            end: info.dateStr,
            slots: 1
        };
        registrations.value = 0;
        showModal.value = true;
    }
};

const handleEventClick = async (info) => {
    try {
        const response = await axios.get(`http://localhost:3000/events/${info.event.id}`, { withCredentials: true });
        newEvent.value = response.data;
        const registrationResponse = await axios.get(`http://localhost:3000/events/${info.event.id}/registrations`, { withCredentials: true });
        registrations.value = registrationResponse.data;

        if (currentUserAccountType.value === 'teacher') {
            isEdit.value = true;
            showModal.value = true;
        } else if (currentUserAccountType.value === 'student') {
            selectedEvent.value = newEvent.value;
            showEventView.value = true;
        }
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

const handleCloseModal = () => {
    showModal.value = false;
    newEvent.value = {
        title: '',
        description: '',
        start: '',
        end: '',
        slots: 1
    };
    registrations.value = 0;
};

const handleSaveEvent = async (event) => {
    try {
        event.teacherId = currentUserId.value;

        if (isEdit.value) {
            const response = await axios.put(`http://localhost:3000/events/${event.id}`, event, { withCredentials: true });
            const index = events.value.findIndex(e => e.id === event.id);
            if (index !== -1) {
                events.value[index] = response.data;
            }
        } else {
            event.backgroundColor = colors[events.value.length % colors.length];
            const response = await axios.post('http://localhost:3000/events', event, { withCredentials: true });
            events.value.push(response.data);
        }
        calendarOptions.value.events = [...events.value];
    } catch (error) {
        console.error('Error saving event:', error);
    } finally {
        handleCloseModal();
        fetchEvents();
    }
};

const handleDeleteEvent = async (eventId) => {
    const confirmed = confirm('Вы действительно хотите удалить это событие?');
    if (confirmed) {
        try {
            await axios.delete(`http://localhost:3000/events/${eventId}`, { withCredentials: true });
            events.value = events.value.filter(e => e.id !== eventId);
            calendarOptions.value.events = [...events.value];
        } catch (error) {
            console.error('Error deleting event:', error);
        } finally {
            handleCloseModal();
            fetchEvents();
        }
    }
};

const fetchEvents = async () => {
    try {
        const userResponse = await axios.get('http://localhost:3000/profile-data', { withCredentials: true });
        currentUserId.value = userResponse.data.userId;
        currentUserAccountType.value = userResponse.data.accountType;

        let response;
        if (currentUserAccountType.value === 'teacher') {
            response = await axios.get(`http://localhost:3000/events?teacherId=${currentUserId.value}`, { withCredentials: true });
        } else if (currentUserAccountType.value === 'student') {
            response = await axios.get(`http://localhost:3000/events?studentId=${currentUserId.value}`, { withCredentials: true });
        }

        events.value = response.data.map((event, index) => {
            event.backgroundColor = colors[index % colors.length];
            return event;
        });

        calendarOptions.value.events = [...events.value];
        events.value.sort((a, b) => new Date(a.start) - new Date(b.start));

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        upcomingEvents.value = events.value.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= today;
        }).slice(0, 5);

        for (const event of upcomingEvents.value) {
            const registrationResponse = await axios.get(`http://localhost:3000/events/${event.id}/registrations`, { withCredentials: true });
            event.registrations = registrationResponse.data.length;
        }

    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

const truncateDescription = (description) => {
    if (description.length > 80) {
        return description.slice(0, 80) + '...';
    }
    return description;
};

const truncateTitle = (title) => {
    if (title.length > 20) {
        return title.slice(0, 20) + '...';
    }
    return title;
};

const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(date).toLocaleString('ru-RU', options);
};

const openEventView = (event) => {
    selectedEvent.value = event;
    showEventView.value = true;
};

const handleCloseEventView = () => {
    showEventView.value = false;
    selectedEvent.value = null;
};

onMounted(() => {
    fetchEvents();
});

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
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    eventDisplay: 'block'
});
</script>

<style scoped>
.calendar-container {
    display: flex;
    flex-direction: column;
    height: 98vh;
    background-color: #f0f0f0;
}

.calendar-upper {
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-bottom: 1px solid #ccc;
    margin-top: 50px;
}

.calendar-header {
    display: flex;
    align-items: center;
}

.calendar-icon {
    width: 35px;
    height: 35px;
    margin-right: 10px;
}

.calendar-title {
    font-size: 24px;
    font-weight: bold;
}

.calendar-lower {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.calendar-content {
    display: flex;
    width: 100%;
    max-width: 1500px;
    height: 100%;
    margin: 50px 0;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.calendar-left {
    flex: 1;
    padding: 20px;
    background-color: #f0f0f0;
    font-size: 20px;
    overflow-y: auto;
}

.calendar-right {
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: white;
    overflow: hidden;
}

.calendar-right .fc {
    font-size: 16px;
    width: 100%;
    height: 100%;
}

.fc-scrollgrid-sync-table {
    table-layout: fixed;
}

.fc-daygrid-day-frame {
    height: 100px;
    overflow-y: auto;
}

.event-cards {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.event-card {
    width: 90%;
    max-height: 300px;
    padding: 20px;
    padding-top: 0px;
    margin-bottom: 20px;
    border-radius: 5px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 18px;
    line-height: 1.4;
    word-wrap: break-word;
    color: #ffffe4;
}

.event-card:hover {
    background-color: #e5e5e5;
}

.event-title {
    font-weight: bold;
    color: #ffffe4;
    font-size: 24px;
}

.event-info {
    font-weight: bold;
    color: #0d1214;
}

.event-registrations {
    font-weight: normal;
    color: #ffffe4;
}

.event-description {
    font-weight: bold;
    color: #0d1214;
}

.event-time {
    font-weight: bold;
    color: #0d1214;
}

.event-text {
    font-weight: normal;
    color: #ffffe4;
}

.fc-event {
    transition: background-color 0.3s;
}

.fc-event:hover {
    background-color: #e5e5e5 !important;
}

.pointer-cursor {
    cursor: pointer;
}
</style>