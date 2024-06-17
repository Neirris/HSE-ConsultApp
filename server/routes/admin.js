import express from 'express'
import axios from 'axios'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'
const adminRouter = express.Router()

adminRouter.get('/:table', async (req, res) => {
  const { table } = req.params
  try {
    const response = await axios.get(`${API_BASE_URL}/${table}`)
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при получении данных из таблицы:', err.message)
    res.status(500).json({ error: 'Ошибка при получении данных из таблицы' })
  }
})

adminRouter.get('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  try {
    const response = await axios.get(`${API_BASE_URL}/${table}/${id}`)
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при получении данных по ID из таблицы:', err.message)
    res.status(500).json({ error: 'Ошибка при получении данных по ID из таблицы' })
  }
})

adminRouter.post('/:table', async (req, res) => {
  const { table } = req.params
  try {
    const response = await axios.post(`${API_BASE_URL}/${table}`, req.body)
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при добавлении данных в таблицу:', err.message)
    res.status(500).json({ error: 'Ошибка при добавлении данных в таблицу' })
  }
})

adminRouter.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  try {
    const response = await axios.put(`${API_BASE_URL}/${table}/${id}`, req.body)
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при обновлении данных в таблице:', err.message)
    res.status(500).json({ error: 'Ошибка при обновлении данных в таблице' })
  }
})

adminRouter.delete('/:table/:id', async (req, res) => {
  const { table, id } = req.params

  if (id === '1') {
    return res.status(400).json({ error: 'Невозможно удалить аккаунт' })
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/${table}/${id}`)
    res.json({ message: 'Дата успешно удалена' })
  } catch (err) {
    console.error('Ошибка при удалении данных из таблицы:', err.message)
    res.status(500).json({ error: 'Ошибка при удалении данных из таблицы' })
  }
})

export default adminRouter
