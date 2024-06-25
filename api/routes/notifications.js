/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'

const notificationsRouter = express.Router()

notificationsRouter.get('/notifications', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  const client = await pool.connect()
  try {
    const userResult = await client.query(`SELECT id FROM users WHERE token = \$1`, [token])
    const user = userResult.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    const userId = user.id
    const notificationsResult = await client.query(
      `SELECT * FROM notifications WHERE userId = \$1 ORDER BY timestamp DESC`,
      [userId]
    )
    res.json(notificationsResult.rows)
  } catch (err) {
    console.error('Ошибка при получении уведомлений:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

notificationsRouter.post('/notifications/read', async (req, res) => {
  const { notificationId } = req.body

  const client = await pool.connect()
  try {
    await client.query(`UPDATE notifications SET isRead = true WHERE id = \$1`, [notificationId])
    res.json({ success: true })
  } catch (err) {
    console.error('Ошибка при обновлении уведомления:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

const createNotification = async (userId, message, link, senderId) => {
  const client = await pool.connect()
  try {
    await client.query(
      `INSERT INTO notifications (userId, message, link, senderId) VALUES (\$1, \$2, \$3, \$4)`,
      [userId, message, link, senderId]
    )
  } catch (err) {
    console.error('Не удалось сохранить уведомление:', err.message)
  } finally {
    client.release()
  }
}

export { notificationsRouter, createNotification }
