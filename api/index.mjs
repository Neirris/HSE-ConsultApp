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
import notificationsRouter from './routes/notifications.js'
import adminRouter from './routes/admin.js'
import dotenv from 'dotenv'
import pool from './data/config.js'

dotenv.config()

const app = express()

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
app.use(cors({ origin: process.env.API_BASE_URL, credentials: true }))

const testDatabaseConnection = async () => {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT NOW()')
    console.log('Database connected:', res.rows[0])
  } catch (err) {
    console.error('Error connecting to the database:', err)
  } finally {
    client.release()
  }
}

initializeDatabase().then(() => {
  seedDatabase()
})

testDatabaseConnection()

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
