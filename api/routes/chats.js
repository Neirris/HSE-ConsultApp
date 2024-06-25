import express from 'express'
import db from '../data/database.js'
import { createNotification } from './notifications.js'

const router = express.Router()

router.get('/chats/list', (req, res) => {
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
    const searchQuery = req.query.searchQuery || ''

    let query = `
        SELECT cs.id, u.email, p.fullName, p.profileImage, u.accountType,
               (SELECT COUNT(*) FROM chatMessages cm WHERE cm.sessionId = cs.id) as messageCount
        FROM chatSessions cs
        JOIN users u ON (cs.user1Id = u.id OR cs.user2Id = u.id) AND u.id != ?
        JOIN profiles p ON u.id = p.userId
        WHERE (cs.user1Id = ? OR cs.user2Id = ?)
      `
    const params = [userId, userId, userId]

    if (searchQuery) {
      query += ` AND (p.fullName LIKE ? OR u.email LIKE ?)`
      const searchPattern = `%${searchQuery}%`
      params.push(searchPattern, searchPattern)
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Ошибка при получении списка чатов:', err.message)
        return res.status(500).json({ error: err.message })
      }
      res.json(rows)
    })
  })
})

router.post('/chats/start', (req, res) => {
  const token = req.cookies.token
  const { userId } = req.body

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

    const currentUserId = user.id

    db.get(
      `SELECT id FROM chatSessions
         WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)`,
      [currentUserId, userId, userId, currentUserId],
      (err, chatSession) => {
        if (err) {
          console.error('Ошибка при проверке существующего чата:', err.message)
          return res.status(500).json({ error: err.message })
        }
        if (chatSession) {
          res.json({ sessionId: chatSession.id })
        } else {
          db.run(
            `INSERT INTO chatSessions (user1Id, user2Id) VALUES (?, ?)`,
            [currentUserId, userId],
            function (err) {
              if (err) {
                console.error('Ошибка при создании нового чата:', err.message)
                return res.status(500).json({ error: err.message })
              }
              res.json({ sessionId: this.lastID })
            }
          )
        }
      }
    )
  })
})

router.get('/chats/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  db.all(
    `SELECT cm.id, cm.senderId, cm.message, cm.timestamp, cm.isRead, p.fullName as senderName, p.profileImage as senderProfileImage
     FROM chatMessages cm
     JOIN users u ON cm.senderId = u.id
     JOIN profiles p ON u.id = p.userId
     WHERE cm.sessionId = ?
     ORDER BY cm.timestamp ASC`,
    [sessionId],
    (err, rows) => {
      if (err) {
        console.error('Ошибка при получении сообщений чата:', err.message)
        return res.status(500).json({ error: err.message })
      }
      res.json(rows)
    }
  )
})

router.post('/chats/messages', (req, res) => {
  const { sessionId, content, senderId } = req.body

  db.run(
    `INSERT INTO chatMessages (sessionId, senderId, message, isRead) VALUES (?, ?, ?, 0)`,
    [sessionId, senderId, content],
    function (err) {
      if (err) {
        console.error('Не удалось сохранить сообщение:', err.message)
        return res.status(500).json({ error: 'Не удалось сохранить сообщение' })
      }

      db.get(
        `SELECT p.fullName as senderName, p.profileImage as senderProfileImage
         FROM profiles p WHERE p.userId = ?`,
        [senderId],
        (err, row) => {
          if (err) {
            console.error('Не удалось получить данные отправителя:', err.message)
            return res.status(500).json({ error: 'Не удалось получить данные отправителя' })
          }

          const notificationMessage = `${row.senderName} отправил вам сообщение`
          const notificationLink = `/chats/sid=${sessionId}`

          db.get(
            `SELECT user1Id, user2Id FROM chatSessions WHERE id = ?`,
            [sessionId],
            (err, chatSession) => {
              if (err) {
                console.error('Не удалось получить данные чата:', err.message)
                return res.status(500).json({ error: 'Не удалось получить данные чата' })
              }

              const recipientId =
                chatSession.user1Id === senderId ? chatSession.user2Id : chatSession.user1Id

              createNotification(recipientId, notificationMessage, notificationLink, senderId)
              // sendNotification(io, recipientId, notificationMessage, notificationLink) // Удаляем отправку уведомлений через сокеты

              res.json({
                sessionId,
                senderId,
                message: content,
                id: this.lastID,
                timestamp: new Date().toISOString(),
                senderName: row ? row.senderName : 'Unknown',
                senderProfileImage: row ? row.senderProfileImage : null,
                isRead: false
              })
            }
          )
        }
      )
    }
  )
})

router.get('/chats/partner/:sessionId', (req, res) => {
  const { sessionId } = req.params
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

    db.get(
      `SELECT p.fullName
         FROM chatSessions cs
         JOIN users u ON (cs.user1Id = u.id OR cs.user2Id = u.id) AND u.id != ?
         JOIN profiles p ON u.id = p.userId
         WHERE cs.id = ?`,
      [userId, sessionId],
      (err, row) => {
        if (err) {
          console.error('Ошибка при получении имени собеседника:', err.message)
          return res.status(500).json({ error: err.message })
        }
        if (row) {
          res.json({ fullName: row.fullName })
        } else {
          res.status(404).json({ error: 'Собеседник не найден' })
        }
      }
    )
  })
})

router.post('/chats/messages/read', (req, res) => {
  const { sessionId } = req.body
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

    db.run(
      `UPDATE chatMessages SET isRead = 1 WHERE sessionId = ? AND senderId != ?`,
      [sessionId, userId],
      function (err) {
        if (err) {
          console.error('Ошибка при обновлении статуса сообщений:', err.message)
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true })
      }
    )
  })
})

export default router
