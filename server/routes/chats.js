import express from 'express'
import axios from 'axios'
import db from '../data/database.js'
import { createNotification, sendNotification } from './notifications.js'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'

const chatsRouter = (io) => {
  const router = express.Router()

  io.on('connection', (socket) => {
    socket.on('join', (sessionId) => {
      socket.join(sessionId)
    })

    socket.on('message', async (message) => {
      const { sessionId, content, senderId } = message

      try {
        await db.run(
          `INSERT INTO chatMessages (sessionId, senderId, message, isRead) VALUES (?, ?, ?, 0)`,
          [sessionId, senderId, content]
        )

        const sender = await db.get(
          `SELECT p.fullName as senderName, p.profileImage as senderProfileImage
           FROM profiles p WHERE p.userId = ?`,
          [senderId]
        )

        const notificationMessage = `${sender.senderName} отправил вам сообщение`
        const notificationLink = `/chats/sid=${sessionId}`

        const chatSession = await db.get(`SELECT user1Id, user2Id FROM chatSessions WHERE id = ?`, [
          sessionId
        ])

        const recipientId =
          chatSession.user1Id === senderId ? chatSession.user2Id : chatSession.user1Id

        createNotification(recipientId, notificationMessage, notificationLink, senderId)
        sendNotification(io, recipientId, notificationMessage, notificationLink)

        io.to(sessionId).emit('message', {
          sessionId,
          senderId,
          message: content,
          id: this.lastID,
          timestamp: new Date().toISOString(),
          senderName: sender ? sender.senderName : 'Unknown',
          senderProfileImage: sender ? sender.senderProfileImage : null,
          isRead: false
        })
      } catch (err) {
        console.error('Не удалось сохранить сообщение или получить данные:', err.message)
      }
    })
  })

  router.get('/chats/list', async (req, res) => {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/chats/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при получении списка чатов:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/chats/start', async (req, res) => {
    const token = req.cookies.token
    const { userId } = req.body

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chats/start`,
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при создании нового чата:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/chats/messages/:sessionId', async (req, res) => {
    const { sessionId } = req.params
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/chats/messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при получении сообщений чата:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/chats/partner/:sessionId', async (req, res) => {
    const { sessionId } = req.params
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/chats/partner/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при получении имени собеседника:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/chats/messages/read', async (req, res) => {
    const { sessionId } = req.body
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chats/messages/read`,
        { sessionId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      res.json(response.data)
    } catch (err) {
      console.error('Ошибка при обновлении статуса сообщений:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

export default chatsRouter
