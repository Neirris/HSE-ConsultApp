import express from 'express'
import axios from 'axios'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'
const usersRouter = express.Router()

usersRouter.get('/users', async (req, res) => {
  const accountType = req.query.accountType

  try {
    const response = await axios.get(`${API_BASE_URL}/users`, { params: { accountType } })
    res.status(200).json(response.data)
  } catch (err) {
    console.error('Ошибка в получении данных пользователей:', err.message)
    res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
  }
})

usersRouter.get('/users/not-registered/:eventId', async (req, res) => {
  const eventId = req.params.eventId

  try {
    const response = await axios.get(`${API_BASE_URL}/users/not-registered/${eventId}`)
    res.status(200).json(response.data)
  } catch (err) {
    console.error('Ошибка в получении данных пользователей:', err.message)
    res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
  }
})

usersRouter.get('/users/id/:id', async (req, res) => {
  const userId = req.params.id
  const token = req.cookies.token

  try {
    const response = await axios.get(`${API_BASE_URL}/users/id/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data) {
      res.json(response.data)
    } else {
      res.status(404).json({ error: 'Пользователь не найден' })
    }
  } catch (err) {
    console.error('Ошибка в получении данных пользователя:', err.message)
    res.status(500).json({ error: err.message })
  }
})

usersRouter.put('/users/id/:id', async (req, res) => {
  const userId = req.params.id
  const { fullName, email, section, description, profileImage } = req.body

  try {
    const response = await axios.put(`${API_BASE_URL}/users/id/${userId}`, {
      fullName,
      email,
      section,
      description,
      profileImage
    })
    res.status(200).json(response.data)
  } catch (err) {
    if (err.response && err.response.status === 400) {
      res.status(400).json({ error: 'Email уже используется' })
    } else {
      console.error('Ошибка в обновлении профиля:', err.message)
      res.status(500).json({ error: 'Ошибка в обновлении профиля' })
    }
  }
})

usersRouter.get('/sections', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sections`)
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка в получении данных разделов:', err.message)
    res.status(500).json({ error: err.message })
  }
})

usersRouter.get('/users/list', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/users/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { searchQuery: req.query.searchQuery || '' }
    })
    res.json(response.data)
  } catch (err) {
    console.error('Ошибка в получении списка пользователей:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default usersRouter
