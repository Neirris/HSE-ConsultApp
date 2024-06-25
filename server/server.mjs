import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { initializeDatabase } from './data/database.js'
import { seedDatabase } from './data/seed.js'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import usersRouter from './routes/users.js'
import chatsRouter from './routes/chats.js'
import eventsRouter from './routes/events.js'
import { notificationsRouter, createNotification } from './routes/notifications.js'
import adminRouter from './routes/admin.js'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
// eslint-disable-next-line no-undef
app.use(cors({ origin: process.env.API_BASE_URL, credentials: true }))

initializeDatabase()
seedDatabase()

app.use(authRouter)
app.use(profileRouter)
app.use(usersRouter)
app.use(chatsRouter) // Убираем передачу io
app.use(eventsRouter)
app.use(notificationsRouter)
app.use('/admin', adminRouter)

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})

export { app, createNotification }
