import express from 'express'
import db from '../data/database.js'

const notificationsRouter = express.Router()

notificationsRouter.get('/notifications', (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  db.get(`SELECT id FROM users WHERE token = ?`, [token], (err, user) => {
    if (err) {
      console.error('Ошибка при получении пользователя:', err.message)
      return res.status(500).json({ error: err.message })
    }
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    const userId = user.id

    db.all(
      `SELECT * FROM notifications WHERE userId = ? ORDER BY timestamp DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Ошибка при получении уведомлений:', err.message)
          return res.status(500).json({ error: err.message })
        }
        res.json(rows)
      }
    )
  })
})

notificationsRouter.post('/notifications/read', (req, res) => {
  const { notificationId } = req.body

  db.run(`UPDATE notifications SET isRead = 1 WHERE id = ?`, [notificationId], function (err) {
    if (err) {
      console.error('Ошибка при обновлении уведомления:', err.message)
      return res.status(500).json({ error: err.message })
    }
    res.json({ success: true })
  })
})

const createNotification = (userId, message, link, senderId) => {
  db.run(
    `INSERT INTO notifications (userId, message, link, senderId) VALUES (?, ?, ?, ?)`,
    [userId, message, link, senderId],
    function (err) {
      if (err) {
        console.error('Не удалось сохранить уведомление:', err.message)
      }
    }
  )
}

const sendNotification = (io, userId, message, link) => {
  io.to(userId).emit('notification', { message, link })
}

export { notificationsRouter, createNotification, sendNotification }
