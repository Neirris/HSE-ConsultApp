/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'
import CryptoJS from 'crypto-js'

const authRouter = express.Router()

const createPermanentToken = (email, password) => {
  const firstHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const combined = email + firstHash
  const permanentToken = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex)
  return permanentToken
}

authRouter.post('https://hse-consult-app.vercel.app/register', async (req, res) => {
  const { email, password, fullName } = req.body
  const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const permanentToken = createPermanentToken(email, hashedPassword)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertUserQuery = `
      INSERT INTO users (email, password, accountType, token)
      VALUES (\$1, \$2, 'student', \$3)
      RETURNING id
    `
    const insertUserValues = [email, hashedPassword, permanentToken]

    const result = await client.query(insertUserQuery, insertUserValues)
    const userId = result.rows[0].id

    const updateProfileQuery = `
      UPDATE profiles
      SET fullName = \$1
      WHERE userId = \$2
    `
    const updateProfileValues = [fullName, userId]

    await client.query(updateProfileQuery, updateProfileValues)
    await client.query('COMMIT')

    res.cookie('token', permanentToken, { httpOnly: true })
    res.status(200).json({ message: 'Регистрация выполнена', accountType: 'student' })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      // unique_violation
      res.status(400).json({ error: 'Пользователь уже существует' })
    } else {
      res.status(500).json({ error: 'Ошибка сервера' })
    }
  } finally {
    client.release()
  }
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  const client = await pool.connect()
  try {
    const findUserQuery = `
      SELECT * FROM users WHERE email = \$1
    `
    const findUserValues = [email]

    const result = await client.query(findUserQuery, findUserValues)
    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден' })
    }

    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
    if (hashedPassword !== user.password) {
      return res.status(400).json({ error: 'Неправильный пароль' })
    }

    const permanentToken = user.token

    res.cookie('token', permanentToken, { httpOnly: true })
    res.status(200).json({ message: 'Вход выполнен', accountType: user.accountType })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' })
  } finally {
    client.release()
  }
})

authRouter.get('/check-auth', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  const client = await pool.connect()
  try {
    const findUserQuery = `
      SELECT id, email, password, accounttype AS "accountType", token
      FROM users
      WHERE token = \$1
    `
    const findUserValues = [token]

    const result = await client.query(findUserQuery, findUserValues)
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    res.status(200).json({ userId: user.id, accountType: user.accountType })
  } catch (err) {
    console.error('Ошибка сервера:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  } finally {
    client.release()
  }
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true })
  res.status(200).json({ message: 'Выход выполнен' })
})

export default authRouter
