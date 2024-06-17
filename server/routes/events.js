import express from 'express'
import db from '../data/database.js'
import { createNotification, sendNotification } from './notifications.js'

const eventsRouter = (io) => {
  const router = express.Router()

  router.post('/events', (req, res) => {
    const { teacherId, title, description, slots, start, end } = req.body

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' })
    }

    db.run(
      `INSERT INTO consultations (teacherId, title, description, slots, start, end)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teacherId, title, description, slots, start, end],
      function (err) {
        if (err) {
          res.status(500).json({ error: 'Ошибка в создании события' })
        } else {
          const newEvent = {
            id: this.lastID,
            teacherId,
            title,
            description,
            slots,
            start,
            end
          }

          res.status(201).json(newEvent)
        }
      }
    )
  })

  router.put('/events/:id', (req, res) => {
    const eventId = req.params.id
    const { teacherId, title, description, slots, start, end } = req.body

    db.run(
      `UPDATE consultations SET teacherId = ?, title = ?, description = ?, slots = ?, start = ?, end = ?
       WHERE id = ?`,
      [teacherId, title, description, slots, start, end, eventId],
      function (err) {
        if (err) {
          res.status(500).json({ error: 'Ошибка в обновлении события' })
        } else {
          res.status(200).json({
            id: eventId,
            teacherId,
            title,
            description,
            slots,
            start,
            end
          })
        }
      }
    )
  })

  router.delete('/events/:id', (req, res) => {
    const eventId = req.params.id

    db.run('DELETE FROM consultations WHERE id = ?', [eventId], function (err) {
      if (err) {
        res.status(500).json({ error: 'Ошибка удаления' })
      } else {
        db.all(
          `SELECT studentId FROM consultationRegistrations WHERE consultationId = ?`,
          [eventId],
          (err, rows) => {
            if (err) {
              console.error('Ошибка получения данных записей:', err)
            } else {
              rows.forEach((row) => {
                const message = `Событие "${eventId}" было отменено`
                const link = `/users/id/${eventId}`
                createNotification(row.studentId, message, link, req.user.id)
                sendNotification(io, row.studentId, message, link)
              })
            }
          }
        )
        res.status(200).json({ message: 'Событие успешно удалено' })
      }
    })
  })

  router.get('/events', (req, res) => {
    const teacherId = req.query.teacherId
    const studentId = req.query.studentId

    if (teacherId) {
      db.all('SELECT * FROM consultations WHERE teacherId = ?', [teacherId], (err, rows) => {
        if (err) {
          res.status(500).json({ error: 'Ошибка получения данных событий' })
        } else {
          res.status(200).json(rows)
        }
      })
    } else if (studentId) {
      db.all(
        `SELECT consultations.* 
         FROM consultations 
         JOIN consultationRegistrations ON consultations.id = consultationRegistrations.consultationId 
         WHERE consultationRegistrations.studentId = ?`,
        [studentId],
        (err, rows) => {
          if (err) {
            console.error('Error fetching events:', err)
            res.status(500).json({ error: 'Ошибка получения данных событий' })
          } else {
            res.status(200).json(rows)
          }
        }
      )
    } else {
      res.status(400).json({ error: 'Необходим Teacher ID или Student ID ' })
    }
  })

  router.get('/events/:id', (req, res) => {
    const eventId = req.params.id

    db.get('SELECT * FROM consultations WHERE id = ?', [eventId], (err, row) => {
      if (err) {
        console.error('Error fetching event:', err)
        res.status(500).json({ error: 'Ошибка получения данных событий' })
      } else if (!row) {
        res.status(404).json({ error: 'Событие не найдено' })
      } else {
        res.status(200).json(row)
      }
    })
  })

  router.get('/search', (req, res) => {
    const query = req.query.query
    const sql = `
      SELECT consultations.*, COUNT(consultationRegistrations.id) AS registrations
      FROM consultations
      LEFT JOIN consultationRegistrations
      ON consultations.id = consultationRegistrations.consultationId
      WHERE consultations.title LIKE ? OR consultations.id IN (
        SELECT consultationRegistrations.consultationId
        FROM consultationRegistrations
        JOIN users ON consultationRegistrations.studentId = users.id
        WHERE users.fullName LIKE ?
      )
      GROUP BY consultations.id
    `
    const params = [`%${query}%`, `%${query}%`]

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json(rows)
    })
  })

  router.get('/events/:id/registrations', (req, res) => {
    const eventId = req.params.id

    db.all(
      `SELECT profiles.fullName, users.email, users.id
       FROM consultationRegistrations
       JOIN users ON consultationRegistrations.studentId = users.id
       JOIN profiles ON users.id = profiles.userId
       WHERE consultationRegistrations.consultationId = ?`,
      [eventId],
      (err, rows) => {
        if (err) {
          console.error('Ошибка получения данных записей:', err)
          res.status(500).json({ error: 'Ошибка получения данных записей' })
        } else {
          res.status(200).json(rows)
        }
      }
    )
  })

  router.post('/events/:id/registrations', (req, res) => {
    const eventId = req.params.id
    const { studentId } = req.body

    db.get(
      'SELECT * FROM consultationRegistrations WHERE consultationId = ? AND studentId = ?',
      [eventId, studentId],
      (err, row) => {
        if (err) {
          console.error('Error checking existing registration:', err)
          return res.status(500).json({ error: 'Ошибка проверки существующих записей' })
        }

        if (row) {
          return res.status(400).json({ error: 'Студент уже записан на это событие' })
        }

        db.run(
          'INSERT INTO consultationRegistrations (consultationId, studentId) VALUES (?, ?)',
          [eventId, studentId],
          function (err) {
            if (err) {
              console.error('Error adding registration:', err)
              res.status(500).json({ error: 'Ошибка в добавлении записи' })
            } else {
              db.get(
                `SELECT consultations.title, consultations.start, profiles.fullName as teacherName, users.id as teacherId
                 FROM consultations
                 JOIN users ON consultations.teacherId = users.id
                 JOIN profiles ON users.id = profiles.userId
                 WHERE consultations.id = ?`,
                [eventId],
                (err, event) => {
                  if (err) {
                    console.error('Error fetching event:', err)
                    res.status(500).json({ error: 'Ошибка в получении данных события' })
                  } else {
                    const message = `${event.teacherName} добавил вас в событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
                    const link = `/users/id/${event.teacherId}`
                    createNotification(studentId, message, link, event.teacherId)
                    sendNotification(io, studentId, message, link)
                    res.status(201).json({ message: 'Запись добавлена успешно' })
                  }
                }
              )
            }
          }
        )
      }
    )
  })

  router.delete('/events/:eventId/registrations/:participantId', (req, res) => {
    const { eventId, participantId } = req.params

    db.run(
      'DELETE FROM consultationRegistrations WHERE consultationId = ? AND studentId = ?',
      [eventId, participantId],
      function (err) {
        if (err) {
          console.error('Error deleting registration:', err)
          res.status(500).json({ error: 'Failed to delete registration' })
        } else {
          db.get(
            `SELECT consultations.title, consultations.start, profiles.fullName as teacherName, users.id as teacherId
             FROM consultations
             JOIN users ON consultations.teacherId = users.id
             JOIN profiles ON users.id = profiles.userId
             WHERE consultations.id = ?`,
            [eventId],
            (err, event) => {
              if (err) {
                console.error('Error fetching event:', err)
                res.status(500).json({ error: 'Failed to fetch event' })
              } else {
                const message = `${event.teacherName} отменил вашу запись на событие "${event.title}" на ${new Date(event.start).toLocaleDateString()}`
                const link = `/users/id/${event.teacherId}`
                createNotification(participantId, message, link, event.teacherId)
                sendNotification(io, participantId, message, link)
                res.status(200).json({ message: 'Registration deleted successfully' })
              }
            }
          )
        }
      }
    )
  })

  return router
}

export default eventsRouter
