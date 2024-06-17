import express from 'express'
import db from '../data/database.js'

const usersRouter = express.Router()

usersRouter.get('/users', (req, res) => {
  const accountType = req.query.accountType

  db.all(
    `SELECT u.id, p.fullName, u.email 
     FROM users u
     JOIN profiles p ON u.id = p.userId
     WHERE u.accountType = ?`,
    [accountType],
    (err, rows) => {
      if (err) {
        console.error('Error fetching users:', err)
        res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
      } else {
        res.status(200).json(rows)
      }
    }
  )
})

usersRouter.get('/users/not-registered/:eventId', (req, res) => {
  const eventId = req.params.eventId

  db.all(
    `SELECT u.id, p.fullName, u.email 
     FROM users u
     JOIN profiles p ON u.id = p.userId
     WHERE u.accountType = 'student' AND u.id NOT IN (
       SELECT studentId FROM consultationRegistrations WHERE consultationId = ?
     )`,
    [eventId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching users:', err)
        res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
      } else {
        res.status(200).json(rows)
      }
    }
  )
})

usersRouter.get('/users/id/:id', (req, res) => {
  const userId = req.params.id
  const token = req.cookies.token

  db.get(
    `
    SELECT u.email, p.fullName, p.profileImage, s.name as section, p.description, u.token, u.accountType
    FROM users u
    JOIN profiles p ON u.id = p.userId
    JOIN sections s ON p.sectionId = s.id
    WHERE u.id = ?
  `,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (row) {
        const isOwnProfile = row.token === token
        res.json({
          email: row.email,
          fullName: row.fullName,
          profileImage: row.profileImage,
          section: row.section,
          description: row.description,
          isOwnProfile,
          accountType: row.accountType
        })
      } else {
        res.status(404).json({ error: 'Пользователь не найден' })
      }
    }
  )
})

usersRouter.put('/users/id/:id', (req, res) => {
  const userId = req.params.id
  const { fullName, email, section, description, profileImage } = req.body

  db.get(
    `
    SELECT id FROM users WHERE email = ? AND id != ?
  `,
    [email, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (row) {
        return res.status(400).json({ error: 'Email уже используется' })
      }

      db.run(
        `
      UPDATE users
      SET email = ?
      WHERE id = ?
    `,
        [email, userId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          db.run(
            `
        UPDATE profiles
        SET fullName = ?, description = ?, sectionId = (SELECT id FROM sections WHERE name = ?), profileImage = ?
        WHERE userId = ?
      `,
            [fullName, description, section, profileImage, userId],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message })
              }
              res.status(200).json({ message: 'Профиль обновлен успешно' })
            }
          )
        }
      )
    }
  )
})

usersRouter.get('/sections', (req, res) => {
  db.all(
    `
    SELECT name FROM sections
  `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json(rows)
    }
  )
})

usersRouter.get('/users/list', (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  db.get(
    `
    SELECT accountType FROM users WHERE token = ?
  `,
    [token],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (!user) {
        return res.status(401).json({ error: 'Не авторизован' })
      }

      const { accountType } = user
      const searchQuery = req.query.searchQuery || ''
      const targetAccountType = accountType === 'student' ? 'teacher' : 'student'

      let query = `
      SELECT u.id, u.email, p.fullName, p.profileImage, u.accountType
      FROM users u
      JOIN profiles p ON u.id = p.userId
      WHERE u.accountType = ?
    `
      const params = [targetAccountType]

      if (searchQuery) {
        query += ` AND (p.fullName LIKE ? OR u.email LIKE ?)`
        const searchPattern = `%${searchQuery}%`
        params.push(searchPattern, searchPattern)
      }

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json(rows)
      })
    }
  )
})

export default usersRouter
