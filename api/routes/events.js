/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'
import { createNotification } from './notifications.js'

const router = express.Router()

router.post('/events', async (req, res) => {
  const { teacherId, title, description, slots, start, end } = req.body

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID is required' })
  }

  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO consultations (teacherId, title, description, slots, start, end)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6) RETURNING id`,
      [teacherId, title, description, slots, start, end]
    )
    const newEvent = {
      id: result.rows[0].id,
      teacherId,
      title,
      description,
      slots,
      start,
      end
    }
    res.status(201).json(newEvent)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка в создании события' })
  } finally {
    client.release()
  }
})

router.put('/events/:id', async (req, res) => {
  const eventId = req.params.id
  const { teacherId, title, description, slots, start, end } = req.body

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE consultations SET teacherId = \$1, title = \$2, description = \$3, slots = \$4, start = \$5, end = \$6
       WHERE id = \$7`,
      [teacherId, title, description, slots, start, end, eventId]
    )
    res.status(200).json({
      id: eventId,
      teacherId,
      title,
      description,
      slots,
      start,
      end
    })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка в обновлении события' })
  } finally {
    client.release()
  }
})

router.delete('/events/:id', async (req, res) => {
  const eventId = req.params.id

  const client = await pool.connect()
  try {
    await client.query('DELETE FROM consultations WHERE id = $1', [eventId])
    const registrationResults = await client.query(
      `SELECT studentId FROM consultationRegistrations WHERE consultationId = \$1`,
      [eventId]
    )
    registrationResults.rows.forEach((row) => {
      const message = `Событие "${eventId}" было отменено`
      const link = `/users/id/${eventId}`
      createNotification(row.studentId, message, link, req.user.id)
    })
    res.status(200).json({ message: 'Событие успешно удалено' })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' })
  } finally {
    client.release()
  }
})

router.get('/events', async (req, res) => {
  const teacherId = req.query.teacherId
  const studentId = req.query.studentId

  const client = await pool.connect()
  try {
    if (teacherId) {
      const result = await client.query('SELECT * FROM consultations WHERE teacherId = $1', [
        teacherId
      ])
      res.status(200).json(result.rows)
    } else if (studentId) {
      const result = await client.query(
        `SELECT consultations.* 
         FROM consultations 
         JOIN consultationRegistrations ON consultations.id = consultationRegistrations.consultationId 
         WHERE consultationRegistrations.studentId = \$1`,
        [studentId]
      )
      res.status(200).json(result.rows)
    } else {
      res.status(400).json({ error: 'Необходим Teacher ID или Student ID ' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных событий' })
  } finally {
    client.release()
  }
})

router.get('/events/:id', async (req, res) => {
  const eventId = req.params.id

  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM consultations WHERE id = $1', [eventId])
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Событие не найдено' })
    } else {
      res.status(200).json(result.rows[0])
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных событий' })
  } finally {
    client.release()
  }
})

router.get('/search', async (req, res) => {
  const query = req.query.query
  const sql = `
    SELECT consultations.*, COUNT(consultationRegistrations.id) AS registrations
    FROM consultations
    LEFT JOIN consultationRegistrations
    ON consultations.id = consultationRegistrations.consultationId
    WHERE consultations.title LIKE \$1 OR consultations.id IN (
      SELECT consultationRegistrations.consultationId
      FROM consultationRegistrations
      JOIN users ON consultationRegistrations.studentId = users.id
      WHERE users.fullName LIKE \$2
    )
    GROUP BY consultations.id
  `
  const params = [`%${query}%`, `%${query}%`]

  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

router.get('/events/:id/registrations', async (req, res) => {
  const eventId = req.params.id

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT profiles.fullName, users.email, users.id
       FROM consultationRegistrations
       JOIN users ON consultationRegistrations.studentId = users.id
       JOIN profiles ON users.id = profiles.userId
       WHERE consultationRegistrations.consultationId = \$1`,
      [eventId]
    )
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных записей' })
  } finally {
    client.release()
  }
})

router.post('/events/:id/registrations', async (req, res) => {
  const eventId = req.params.id
  const { studentId } = req.body

  const client = await pool.connect()
  try {
    const registrationResult = await client.query(
      'SELECT * FROM consultationRegistrations WHERE consultationId = $1 AND studentId = $2',
      [eventId, studentId]
    )
    if (registrationResult.rows.length > 0) {
      return res.status(400).json({ error: 'Студент уже записан на это событие' })
    }

    await client.query(
      'INSERT INTO consultationRegistrations (consultationId, studentId) VALUES ($1, $2)',
      [eventId, studentId]
    )

    const eventResult = await client.query(
      `SELECT consultations.title, consultations.start, profiles.fullName as teacherName, users.id as teacherId
       FROM consultations
       JOIN users ON consultations.teacherId = users.id
       JOIN profiles ON users.id = profiles.userId
       WHERE consultations.id = \$1`,
      [eventId]
    )
    const event = eventResult.rows[0]
    const message = `${event.teacherName} добавил вас в событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
    const link = `/users/id/${event.teacherId}`
    createNotification(studentId, message, link, event.teacherId)
    res.status(201).json({ message: 'Запись добавлена успешно' })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка в добавлении записи' })
  } finally {
    client.release()
  }
})

router.delete('/events/:eventId/registrations/:participantId', async (req, res) => {
  const { eventId, participantId } = req.params

  const client = await pool.connect()
  try {
    await client.query(
      'DELETE FROM consultationRegistrations WHERE consultationId = $1 AND studentId = $2',
      [eventId, participantId]
    )

    const eventResult = await client.query(
      `SELECT consultations.title, consultations.start, profiles.fullName as teacherName, users.id as teacherId
       FROM consultations
       JOIN users ON consultations.teacherId = users.id
       JOIN profiles ON users.id = profiles.userId
       WHERE consultations.id = \$1`,
      [eventId]
    )
    const event = eventResult.rows[0]
    const message = `${event.teacherName} отменил вашу запись на событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
    const link = `/users/id/${event.teacherId}`
    createNotification(participantId, message, link, event.teacherId)
    res.status(200).json({ message: 'Registration deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete registration' })
  } finally {
    client.release()
  }
})

export default router
