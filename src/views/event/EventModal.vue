<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>{{ isEdit ? 'Редактировать событие' : 'Добавить событие' }}</h2>
      </div>
      <div class="modal-body">
        <div class="modal-body-content">
          <label for="event-title">Название:</label>
          <input id="event-title" v-model="localEvent.title" type="text" />
          <label for="event-slots">Количество мест:</label>
          <input id="event-slots" v-model="localEvent.slots" type="number" min="1" @input="handleSlotsInput" />
          <p v-if="registrations > 0">Записалось: {{ registrations }}</p>
          <label for="event-description">Описание:</label>
          <textarea id="event-description" v-model="localEvent.description"></textarea>
          <label for="event-start">Начало:</label>
          <input id="event-start" v-model="localEvent.start" type="datetime-local" :min="getMinDateTime()"
            :max="getMaxDateTime()" @input="validateTimeRange" />
          <label for="event-end">Конец:</label>
          <input id="event-end" v-model="localEvent.end" type="datetime-local" :min="getMinDateTime()"
            :max="getMaxDateTime()" @input="validateTimeRange" />
        </div>
      </div>
      <div class="modal-footer">
        <div class="modal-footer-left">
          <button class="btn-repeat-week" @click="confirmRepeat('week')">След. неделя</button>
          <button class="btn-repeat-day" @click="confirmRepeat('day')">След. день</button>
        </div>
        <div class="modal-footer-right">
          <button v-if="isEdit" class="btn-delete" @click="confirmDeleteEvent">Удалить</button>
          <button class="btn-save" @click="confirmSaveEvent" :disabled="!isFormValid">Сохранить</button>
        </div>
      </div>
      <div class="modal-footer-bottom">
        <button class="btn-close" @click="$emit('close')">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps(['newEvent', 'isEdit', 'registrations']);
const emit = defineEmits(['close', 'save', 'delete', 'refresh']);

const localEvent = ref({ ...props.newEvent });

watch(
  () => props.newEvent,
  (newVal) => {
    localEvent.value = { ...newVal };
  }
);

const isFormValid = computed(() => {
  const isTimeValid = (time) => {
    if (!time) return false;
    const [hour, minute] = time.split(':').map(Number);
    const result = hour >= 8 && hour <= 20 && minute >= 0 && minute <= 59;
    return result;
  };

  const isDateValid = (date) => {
    if (!date) return false;
    const [datePart, timePart] = date.split('T');
    if (!datePart || !timePart) return false;
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    const result = (
      year.length === 4 &&
      month.length === 2 &&
      day.length === 2 &&
      isTimeValid(hour + ':' + minute)
    );
    return result;
  };

  const isTimeGapValid = (start, end) => {
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const result = (endDate - startDate) >= 3600000;
    return result;
  };

  const isTitleValid = localEvent.value.title.trim() !== '';
  const isSlotsValid = localEvent.value.slots > 0 && localEvent.value.slots >= props.registrations;

  const result = (
    isTitleValid &&
    isDateValid(localEvent.value.start) &&
    isDateValid(localEvent.value.end) &&
    localEvent.value.end >= localEvent.value.start &&
    isTimeGapValid(localEvent.value.start, localEvent.value.end) &&
    isSlotsValid
  );

  return result;
});

const confirmSaveEvent = () => {
  const confirmed = confirm('Вы уверены, что хотите сохранить изменения?');
  if (confirmed) {
    saveEvent();
  }
};

const confirmDeleteEvent = () => {
  const confirmed = confirm('Вы уверены, что хотите удалить это событие?');
  if (confirmed) {
    deleteEvent();
  }
};

const saveEvent = () => {
  emit('save', localEvent.value);
};

const deleteEvent = () => {
  emit('delete', localEvent.value.id);
};

const handleOverlayClick = (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    emit('close');
  }
};

const handleSlotsInput = () => {
  if (localEvent.value.slots > 999) {
    localEvent.value.slots = 999;
  }
  if (localEvent.value.slots < props.registrations) {
    localEvent.value.slots = props.registrations;
  }
};

const confirmRepeat = (type) => {
  const confirmed = confirm(`Хотите повторить это событие на следующий ${type === 'week' ? 'неделю' : 'день'}?`);
  if (confirmed) {
    repeatEvent(type);
  }
};

const repeatEvent = async (type) => {
  const newEvent = { ...localEvent.value };
  const startDate = new Date(newEvent.start);
  const endDate = new Date(newEvent.end);

  if (type === 'week') {
    startDate.setDate(startDate.getDate() + 7);
    endDate.setDate(endDate.getDate() + 7);
  } else {
    startDate.setDate(startDate.getDate() + 1);
    endDate.setDate(endDate.getDate() + 1);
  }

  const startTime = newEvent.start.split('T')[1];
  const endTime = newEvent.end.split('T')[1];

  newEvent.start = `${startDate.toISOString().split('T')[0]}T${startTime}`;
  newEvent.end = `${endDate.toISOString().split('T')[0]}T${endTime}`;
  delete newEvent.id;

  try {
    const response = await axios.post('http://localhost:3000/events', newEvent, { withCredentials: true });
    console.log('Event duplicated:', response.data);
    emit('refresh');
    emit('close');
  } catch (error) {
    console.error('Error duplicating event:', error);
  }
};

const getMinDateTime = () => {
  const selectedDate = new Date(localEvent.value.start);
  selectedDate.setHours(8, 0, 0, 0); // 8:00 AM
  return selectedDate.toISOString().slice(0, 16);
};

const getMaxDateTime = () => {
  const selectedDate = new Date(localEvent.value.start);
  selectedDate.setHours(20, 0, 0, 0); // 8:00 PM
  return selectedDate.toISOString().slice(0, 16);
};

const validateTimeRange = () => {
  if (!localEvent.value.start || !localEvent.value.end) {
    return;
  }

  const [startHour] = localEvent.value.start.split('T')[1]?.split(':').map(Number) || [];
  const [endHour] = localEvent.value.end.split('T')[1]?.split(':').map(Number) || [];

  if (startHour < 8) {
    localEvent.value.start = localEvent.value.start.replace(/T\d{2}/, 'T08');
  }

  if (endHour > 20) {
    localEvent.value.end = localEvent.value.end.replace(/T\d{2}/, 'T20');
  }

  if (new Date(localEvent.value.end) - new Date(localEvent.value.start) < 3600000) {
    const newEndDate = new Date(new Date(localEvent.value.start).getTime() + 3600000); // +1 час к стартовому времени
    localEvent.value.end = newEndDate.toISOString().slice(0, 16);
  }
};


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

.modal {
  background: white;
  padding: 2px;
  border-radius: 5px;
  width: 500px;
  max-width: 100%;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #009688;
  padding: 10px;
  color: white;
  border-radius: 5px 5px 0 0;
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
  background-color: white;
}

.modal-body input {
  width: calc(100% - 20px);
}

.modal-body textarea {
  resize: none;
  height: 100px;
  width: calc(100% - 20px);
}

.modal-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

.modal-footer-left {
  display: flex;
  align-items: center;
}

.modal-footer-right {
  display: flex;
  align-items: center;
}

.btn-delete {
  background-color: red;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  border-radius: 5px;
  width: 105px;
}

.btn-save {
  background-color: green;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  border-radius: 5px;
  width: 105px;
}

.btn-save:disabled {
  background-color: gray;
  cursor: not-allowed;
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
  width: 220px;
}

.btn-repeat-week {
  background-color: #28a745;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  margin-left: 10px;
  margin-right: 10px;
  border-radius: 5px;
  width: 125px;
}

.btn-repeat-day {
  background-color: #009688;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  width: 105px;
}
</style>