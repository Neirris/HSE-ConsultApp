import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { initializeDatabase } from './data/database.mjs'
import { seedDatabase } from './data/seed.mjs'
import authRouter from './routes/auth.mjs'
import profileRouter from './routes/profile.mjs'
import usersRouter from './routes/users.mjs'
import chatsRouter from './routes/chats.mjs'
import eventsRouter from './routes/events.mjs'
import notificationsRouter from './routes/notifications.mjs'
import adminRouter from './routes/admin.mjs'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
app.use(cors({ origin: process.env.API_BASE_URL, credentials: true }))

initializeDatabase().then(() => {
  seedDatabase()
})

app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/users', usersRouter)
app.use('/chats', chatsRouter)
app.use('/events', eventsRouter)
app.use('/notifications', notificationsRouter)
app.use('/admin', adminRouter)

app.get('/', (req, res) => {
  res.redirect('/auth')
})

export default app
