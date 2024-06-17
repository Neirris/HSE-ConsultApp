import express from 'express'
import axios from 'axios'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'
const profileRouter = express.Router()

profileRouter.get('/profile-data', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/profile-data`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data) {
      res.json(response.data)
    } else {
      res.status(404).json({ error: 'Пользователь не найден' })
    }
  } catch (err) {
    console.error('Ошибка при получении данных профиля:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default profileRouter
