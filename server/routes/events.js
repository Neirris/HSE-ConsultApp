import express from 'express'
import axios from 'axios'
import { createNotification, sendNotification } from './notifications.js'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'

const eventsRouter = (io) => {
  const router = express.Router()

  router.post('/events', async (req, res) => {
    const { teacherId, title, description, slots, start, end } = req.body

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' })
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/events`, {
        teacherId,
        title,
        description,
        slots,
        start,
        end
      })
      res.status(201).json(response.data)
    } catch (err) {
      console.error('Ошибка в создании события:', err.message)
      res.status(500).json({ error: 'Ошибка в создании события' })
    }
  })

  router.put('/events/:id', async (req, res) => {
    const eventId = req.params.id
    const { teacherId, title, description, slots, start, end } = req.body

    try {
      const response = await axios.put(`${API_BASE_URL}/events/${eventId}`, {
        teacherId,
        title,
        description,
        slots,
        start,
        end
      })
      res.status(200).json(response.data)
    } catch (err) {
      console.error('Ошибка в обновлении события:', err.message)
      res.status(500).json({ error: 'Ошибка в обновлении события' })
    }
  })

  router.delete('/events/:id', async (req, res) => {
    const eventId = req.params.id

    try {
      await axios.delete(`${API_BASE_URL}/events/${eventId}`)

      const response = await axios.get(`${API_BASE_URL}/events/${eventId}/registrations`)
      const rows = response.data

      rows.forEach((row) => {
        const message = `Событие "${eventId}" было отменено`
        const link = `/users/id/${eventId}`
        createNotification(row.studentId, message, link, req.user.id)
        sendNotification(io, row.studentId, message, link)
      })

      res.status(200).json({ message: 'Событие успешно удалено' })
    } catch (err) {
      console.error('Ошибка удаления:', err.message)
      res.status(500).json({ error: 'Ошибка удаления' })
    }
  })

  router.get('/events', async (req, res) => {
    const teacherId = req.query.teacherId
    const studentId = req.query.studentId

    try {
      if (teacherId) {
        const response = await axios.get(`${API_BASE_URL}/events`, { params: { teacherId } })
        res.status(200).json(response.data)
      } else if (studentId) {
        const response = await axios.get(`${API_BASE_URL}/events`, { params: { studentId } })
        res.status(200).json(response.data)
      } else {
        res.status(400).json({ error: 'Необходим Teacher ID или Student ID ' })
      }
    } catch (err) {
      console.error('Ошибка получения данных событий:', err.message)
      res.status(500).json({ error: 'Ошибка получения данных событий' })
    }
  })

  router.get('/events/:id', async (req, res) => {
    const eventId = req.params.id

    try {
      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`)
      if (response.data) {
        res.status(200).json(response.data)
      } else {
        res.status(404).json({ error: 'Событие не найдено' })
      }
    } catch (err) {
      console.error('Ошибка получения данных событий:', err.message)
      res.status(500).json({ error: 'Ошибка получения данных событий' })
    }
  })

  router.get('/search', async (req, res) => {
    const query = req.query.query

    try {
      const response = await axios.get(`${API_BASE_URL}/search`, { params: { query } })
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при поиске:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/events/:id/registrations', async (req, res) => {
    const eventId = req.params.id

    try {
      const response = await axios.get(`${API_BASE_URL}/events/${eventId}/registrations`)
      res.status(200).json(response.data)
    } catch (err) {
      console.error('Ошибка получения данных записей:', err.message)
      res.status(500).json({ error: 'Ошибка получения данных записей' })
    }
  })

  router.post('/events/:id/registrations', async (req, res) => {
    const eventId = req.params.id
    const { studentId } = req.body

    try {
      const existingRegistration = await axios.get(
        `${API_BASE_URL}/events/${eventId}/registrations`,
        {
          params: { studentId }
        }
      )

      if (existingRegistration.data) {
        return res.status(400).json({ error: 'Студент уже записан на это событие' })
      }

      await axios.post(`${API_BASE_URL}/events/${eventId}/registrations`, { studentId })

      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`)
      const event = response.data
      const message = `${event.teacherName} добавил вас в событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
      const link = `/users/id/${event.teacherId}`
      createNotification(studentId, message, link, event.teacherId)
      sendNotification(io, studentId, message, link)

      res.status(201).json({ message: 'Запись добавлена успешно' })
    } catch (err) {
      console.error('Ошибка в добавлении записи:', err.message)
      res.status(500).json({ error: 'Ошибка в добавлении записи' })
    }
  })

  router.delete('/events/:eventId/registrations/:participantId', async (req, res) => {
    const { eventId, participantId } = req.params

    try {
      await axios.delete(`${API_BASE_URL}/events/${eventId}/registrations/${participantId}`)

      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`)
      const event = response.data
      const message = `${event.teacherName} отменил вашу запись на событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
      const link = `/users/id/${event.teacherId}`
      createNotification(participantId, message, link, event.teacherId)
      sendNotification(io, participantId, message, link)

      res.status(200).json({ message: 'Registration deleted successfully' })
    } catch (err) {
      console.error('Failed to delete registration:', err.message)
      res.status(500).json({ error: 'Failed to delete registration' })
    }
  })

  return router
}

export default eventsRouter
