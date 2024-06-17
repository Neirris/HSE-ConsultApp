import express from 'express'
import axios from 'axios'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'
const notificationsRouter = express.Router()

notificationsRouter.get('/notifications', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при получении уведомлений:', err.message)
    res.status(500).json({ error: err.message })
  }
})

notificationsRouter.post('/notifications/read', async (req, res) => {
  const { notificationId } = req.body

  try {
    const response = await axios.post(`${API_BASE_URL}/notifications/read`, { notificationId })
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка при обновлении уведомления:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const createNotification = async (userId, message, link, senderId) => {
  try {
    await axios.post(`${API_BASE_URL}/notifications`, { userId, message, link, senderId })
  } catch (err) {
    console.error('Не удалось сохранить уведомление:', err.message)
  }
}

const sendNotification = (io, userId, message, link) => {
  io.to(userId).emit('notification', { message, link })
}

export { notificationsRouter, createNotification, sendNotification }
