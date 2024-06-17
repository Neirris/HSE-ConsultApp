<template>
    <div>
        <v-container class="fill-height" fluid>
            <v-row justify="center">
                <v-col cols="12" sm="10" md="8" lg="6">
                    <v-card>
                        <v-card-title class="custom-card-title">
                            <v-toolbar-title class="custom-toolbar-title">{{ currentTable }}</v-toolbar-title>
                        </v-card-title>
                        <v-card-text>
                            <v-data-table :headers="headers" :items="items" :items-per-page="5"
                                class="elevation-1 custom-data-table" item-value="id" :loading="loading">
                                <template v-slot:top>
                                    <v-toolbar flat>
                                        <v-spacer></v-spacer>
                                        <v-dialog v-model="dialog" max-width="500px">
                                            <template #activator="{ props }">
                                                <v-btn color="primary" dark class="mb-2" v-bind="props">
                                                    Добавить
                                                </v-btn>
                                            </template>
                                            <v-card>
                                                <v-card-title>
                                                    <span class="headline">{{ editedItem.id ? 'Редактировать' :
                                                        'Добавить' }} {{ currentTable }}</span>
                                                </v-card-title>
                                                <v-card-text>
                                                    <v-container>
                                                        <v-row>
                                                            <v-col v-for="field in headers" :key="field.value"
                                                                cols="12">
                                                                <v-text-field v-if="field.value !== 'accountType'"
                                                                    v-model="editedItem[field.value]"
                                                                    :label="field.text"
                                                                    :disabled="field.value === 'id'">
                                                                </v-text-field>
                                                                <v-select v-else v-model="editedItem[field.value]"
                                                                    :items="accountTypes" :label="field.text">
                                                                </v-select>
                                                            </v-col>
                                                        </v-row>
                                                    </v-container>
                                                </v-card-text>
                                                <v-card-actions>
                                                    <v-spacer></v-spacer>
                                                    <v-btn color="blue darken-1" text @click="close">Отмена</v-btn>
                                                    <v-btn color="blue darken-1" text @click="save">Сохранить</v-btn>
                                                </v-card-actions>
                                            </v-card>
                                        </v-dialog>
                                    </v-toolbar>
                                </template>
                                <template v-slot:[`item.actions`]="{ item }">
                                    <img src="@/assets/icons/Edit.png" alt="Edit" class="icon"
                                        @click="editItem(item)" />
                                    <img v-if="item.id !== 1" src="@/assets/icons/Delete.png" alt="Delete" class="icon"
                                        @click="deleteItem(item)" />
                                </template>
                                <template v-slot:no-data>
                                    <div class="text-center">Нет результатов</div>
                                </template>
                            </v-data-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const currentTable = ref('')
const headers = ref([])
const items = ref([])
const dialog = ref(false)
const editedItem = ref({})
const loading = ref(false)
const accountTypes = ['student', 'teacher', 'admin']

const fetchTableData = async (tableName) => {
    loading.value = true
    try {
        const response = await axios.get(`http://localhost:3000/admin/${tableName}`)
        if (response.data.length > 0) {
            headers.value = Object.keys(response.data[0]).map(key => ({
                text: key.charAt(0).toUpperCase() + key.slice(1),
                value: key
            }))
            headers.value.push({ text: 'Actions', value: 'actions', sortable: false })
            items.value = response.data
        } else {
            headers.value = []
            items.value = []
        }
    } catch (error) {
        console.error(`Ошибка при загрузке данных для таблицы ${tableName}:`, error)
    } finally {
        loading.value = false
    }
}

const editItem = (item) => {
    editedItem.value = { ...item }
    dialog.value = true
}

const deleteItem = async (item) => {
    try {
        await axios.delete(`http://localhost:3000/admin/${currentTable.value}/${item.id}`)
        items.value = items.value.filter(i => i.id !== item.id)
    } catch (error) {
        console.error(`Ошибка при удалении элемента из таблицы ${currentTable.value}:`, error)
    }
}

const save = async () => {
    if (editedItem.value.id) {
        try {
            await axios.put(`http://localhost:3000/admin/${currentTable.value}/${editedItem.value.id}`, editedItem.value)
            const index = items.value.findIndex(i => i.id === editedItem.value.id)
            if (index !== -1) {
                items.value.splice(index, 1, editedItem.value)
            }
        } catch (error) {
            console.error(`Ошибка при обновлении элемента в таблице ${currentTable.value}:`, error)
        }
    } else {
        try {
            const response = await axios.post(`http://localhost:3000/admin/${currentTable.value}`, editedItem.value)
            items.value.push(response.data)
        } catch (error) {
            console.error(`Ошибка при добавлении элемента в таблицу ${currentTable.value}:`, error)
        }
    }
    close()
}

const close = () => {
    dialog.value = false
    editedItem.value = {}
}

watch(() => route.path, (newPath) => {
    const tableName = newPath.split('/').pop()
    currentTable.value = tableName.charAt(0).toUpperCase() + tableName.slice(1)
    fetchTableData(tableName)
})

onMounted(() => {
    const tableName = route.path.split('/').pop()
    currentTable.value = tableName.charAt(0).toUpperCase() + tableName.slice(1)
    fetchTableData(tableName)
})
</script>

<style scoped>
.v-app-bar {
    background-color: white;
}

.custom-card-title {
    display: flex;
    justify-content: center;
    align-items: center;
}

.custom-toolbar-title {
    margin-top: 50px;
    text-align: center;
    width: 100%;
}

.custom-data-table {
    height: 100%;
}

.v-toolbar-title {
    color: black;
}

.icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
}
</style>