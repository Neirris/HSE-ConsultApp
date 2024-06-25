/* eslint-disable no-undef */
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { initializeDatabase } from '../data/database.js'
import { seedDatabase } from '../data/seed.js'
import authRouter from '../routes/auth.js'
import profileRouter from '../routes/profile.js'
import usersRouter from '../routes/users.js'
import chatsRouter from '../routes/chats.js'
import eventsRouter from '../routes/events.js'
import { notificationsRouter, createNotification } from '../routes/notifications.js'
import adminRouter from '../routes/admin.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`)
  next()
})

;(async () => {
  try {
    await initializeDatabase()
    await seedDatabase()
    console.log('База данных успешно подключена')
  } catch (error) {
    console.error('Ошибка подключения базы данных:', error)
  }
})()

app.use(authRouter)
app.use(profileRouter)
app.use(usersRouter)
app.use(chatsRouter)
app.use(eventsRouter)
app.use(notificationsRouter)
app.use('/admin', adminRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})

export { app, createNotification }
