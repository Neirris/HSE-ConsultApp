/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'
import { createNotification } from './notifications.js'

const router = express.Router()

router.get('/chats/list', async (req, res) => {
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
    const searchQuery = req.query.searchQuery || ''
    let query = `
      SELECT cs.id, u.email, p.fullName, p.profileImage, u.accountType,
             (SELECT COUNT(*) FROM chatMessages cm WHERE cm.sessionId = cs.id) as messageCount
      FROM chatSessions cs
      JOIN users u ON (cs.user1Id = u.id OR cs.user2Id = u.id) AND u.id != \$1
      JOIN profiles p ON u.id = p.userId
      WHERE (cs.user1Id = \$1 OR cs.user2Id = \$1)
    `
    const params = [userId]
    if (searchQuery) {
      query += ` AND (p.fullName LIKE \$2 OR u.email LIKE \$2)`
      const searchPattern = `%${searchQuery}%`
      params.push(searchPattern)
    }
    const result = await client.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Ошибка при получении списка чатов:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

router.post('/chats/start', async (req, res) => {
  const token = req.cookies.token
  const { userId } = req.body
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
    const currentUserId = user.id
    const chatSessionResult = await client.query(
      `SELECT id FROM chatSessions
       WHERE (user1Id = \$1 AND user2Id = \$2) OR (user1Id = \$2 AND user2Id = \$1)`,
      [currentUserId, userId]
    )
    const chatSession = chatSessionResult.rows[0]
    if (chatSession) {
      res.json({ sessionId: chatSession.id })
    } else {
      const insertResult = await client.query(
        `INSERT INTO chatSessions (user1Id, user2Id) VALUES (\$1, \$2) RETURNING id`,
        [currentUserId, userId]
      )
      res.json({ sessionId: insertResult.rows[0].id })
    }
  } catch (err) {
    console.error('Ошибка при создании нового чата:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

router.get('/chats/messages/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  const client = await pool.connect()
  try {
    const messagesResult = await client.query(
      `SELECT cm.id, cm.senderId, cm.message, cm.timestamp, cm.isRead, p.fullName as senderName, p.profileImage as senderProfileImage
       FROM chatMessages cm
       JOIN users u ON cm.senderId = u.id
       JOIN profiles p ON u.id = p.userId
       WHERE cm.sessionId = \$1
       ORDER BY cm.timestamp ASC`,
      [sessionId]
    )
    res.json(messagesResult.rows)
  } catch (err) {
    console.error('Ошибка при получении сообщений чата:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

router.post('/chats/messages', async (req, res) => {
  const { sessionId, content, senderId } = req.body
  const client = await pool.connect()
  try {
    const insertResult = await client.query(
      `INSERT INTO chatMessages (sessionId, senderId, message, isRead) VALUES (\$1, \$2, \$3, false) RETURNING id`,
      [sessionId, senderId, content]
    )
    const messageId = insertResult.rows[0].id

    const senderResult = await client.query(
      `SELECT p.fullName as senderName, p.profileImage as senderProfileImage
       FROM profiles p WHERE p.userId = \$1`,
      [senderId]
    )
    const sender = senderResult.rows[0]

    const chatSessionResult = await client.query(
      `SELECT user1Id, user2Id FROM chatSessions WHERE id = \$1`,
      [sessionId]
    )
    const chatSession = chatSessionResult.rows[0]
    const recipientId = chatSession.user1Id === senderId ? chatSession.user2Id : chatSession.user1Id

    const notificationMessage = `${sender.sendername} отправил вам сообщение`
    const notificationLink = `/chats/sid=${sessionId}`

    await createNotification(recipientId, notificationMessage, notificationLink, senderId)

    res.json({
      sessionId,
      senderId,
      message: content,
      id: messageId,
      timestamp: new Date().toISOString(),
      senderName: sender ? sender.sendername : 'Unknown',
      senderProfileImage: sender ? sender.senderProfileImage : null,
      isRead: false
    })
  } catch (err) {
    console.error('Не удалось сохранить сообщение:', err.message)
    res.status(500).json({ error: 'Не удалось сохранить сообщение' })
  } finally {
    client.release()
  }
})

router.get('/chats/partner/:sessionId', async (req, res) => {
  const { sessionId } = req.params
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
    const partnerResult = await client.query(
      `SELECT p.fullName
       FROM chatSessions cs
       JOIN users u ON (cs.user1Id = u.id OR cs.user2Id = u.id) AND u.id != \$1
       JOIN profiles p ON u.id = p.userId
       WHERE cs.id = \$2`,
      [userId, sessionId]
    )
    const partner = partnerResult.rows[0]
    if (partner) {
      res.json({ fullName: partner.fullName })
    } else {
      res.status(404).json({ error: 'Собеседник не найден' })
    }
  } catch (err) {
    console.error('Ошибка при получении имени собеседника:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

router.post('/chats/messages/read', async (req, res) => {
  const { sessionId } = req.body
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
    await client.query(
      `UPDATE chatMessages SET isRead = true WHERE sessionId = \$1 AND senderId != \$2`,
      [sessionId, userId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Ошибка при обновлении статуса сообщений:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router
