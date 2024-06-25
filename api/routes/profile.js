import express from 'express'
import db from '../../server/data/database.js'

const profileRouter = express.Router()

profileRouter.get('/profile-data', (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  db.get(
    `
    SELECT u.id, u.accountType, p.fullName, p.profileImage
    FROM users u
    JOIN profiles p ON u.id = p.userId
    WHERE u.token = ?
  `,
    [token],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (row) {
        res.json({
          userId: row.id,
          accountType: row.accountType,
          fullName: row.fullName,
          profileImage: row.profileImage
        })
      } else {
        res.status(404).json({ error: 'Пользователь не найден' })
      }
    }
  )
})

export default profileRouter
