import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './data/database.js'
import { seedDatabase } from './data/seed.js'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import usersRouter from './routes/users.js'
import chatsRouter from './routes/chats.js'
import eventsRouter from './routes/events.js'
import {
  notificationsRouter,
  createNotification,
  sendNotification
} from './routes/notifications.js'
import adminRouter from './routes/admin.js'
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.API_BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
})

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
app.use(cors({ origin: process.env.API_BASE_URL, credentials: true }))

initializeDatabase()
seedDatabase()

app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/users', usersRouter)
app.use('/chats', chatsRouter(io))
app.use('/events', eventsRouter(io))
app.use('/notifications', notificationsRouter)
app.use('/admin', adminRouter)

// Обслуживание статических файлов из dist
app.use(express.static(path.join(__dirname, '../dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'))
})

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// Подключение к WebSocket
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId)
  })

  socket.on('disconnect', () => {})
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})

export { server, io, createNotification, sendNotification }
