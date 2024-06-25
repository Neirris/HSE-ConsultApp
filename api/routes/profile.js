/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'

const profileRouter = express.Router()

profileRouter.get('/profile-data', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  const client = await pool.connect()
  try {
    const findUserQuery = `
      SELECT users.id, users.email, users.accountType, profiles.fullName, profiles.profileImage
      FROM users
      LEFT JOIN profiles ON users.id = profiles.userId
      WHERE users.token = \$1
    `
    const findUserValues = [token]

    const result = await client.query(findUserQuery, findUserValues)
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    res.status(200).json({
      userId: user.id,
      fullName: user.fullname,
      profileImage: user.profileimage,
      accountType: user.accounttype
    })
  } catch (err) {
    console.error('Ошибка сервера:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  } finally {
    client.release()
  }
})

export default profileRouter
