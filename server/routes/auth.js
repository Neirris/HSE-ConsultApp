import express from 'express'
import db from '../data/database.js'
import CryptoJS from 'crypto-js'

const authRouter = express.Router()

const createPermanentToken = (email, password) => {
  const firstHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const combined = email + firstHash
  const permanentToken = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex)
  return permanentToken
}

authRouter.post('/register', (req, res) => {
  const { email, password, fullName } = req.body
  const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const permanentToken = createPermanentToken(email, hashedPassword)

  db.run(
    `
    INSERT INTO users (email, password, accountType, token)
    VALUES (?, ?, 'student', ?)
  `,
    [email, hashedPassword, permanentToken],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Пользователь уже существует' })
      }
      const userId = this.lastID

      db.run(
        `
      UPDATE profiles
      SET fullName = ?
      WHERE userId = ?
    `,
        [fullName, userId]
      )

      res.cookie('token', permanentToken, { httpOnly: true })

      res.status(200).json({ message: 'Регистрация выполнена', accountType: 'student' })
    }
  )
})

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body

  db.get(
    `
    SELECT * FROM users WHERE email = ?
  `,
    [email],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Пользователь не найден' })
      }
      const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
      if (hashedPassword !== user.password) {
        return res.status(400).json({ error: 'Неправильный пароль' })
      }

      const permanentToken = user.token

      res.cookie('token', permanentToken, { httpOnly: true })

      res.status(200).json({ message: 'Вход выполнен', accountType: user.accountType })
    }
  )
})

authRouter.get('/check-auth', (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  db.get(
    `
    SELECT * FROM users WHERE token = ?
  `,
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Не авторизован' })
      }

      res.status(200).json({ userId: user.id, accountType: user.accountType })
    }
  )
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true })
  res.status(200).json({ message: 'Выход выполнен' })
})

export default authRouter
