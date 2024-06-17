import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
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
import path from 'path'
import { fileURLToPath } from 'url'
dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
})

console.log('API_BASE_URL:', process.env.API_BASE_URL)

app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: '*',
    credentials: true
  })
)

initializeDatabase()
seedDatabase()

// Настройка для обслуживания статических файлов
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Предположим, что папка dist находится в корне проекта
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// Настройка маршрутов
app.use(authRouter)
app.use(profileRouter)
app.use(usersRouter)
app.use(chatsRouter(io))
app.use(eventsRouter(io))
app.use(notificationsRouter)
app.use('/admin', adminRouter)

// Подключение к WebSocket
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId)
  })

  socket.on('disconnect', () => {})
})

// Обслуживание фронтенд-приложения для всех остальных маршрутов
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})

export { server, io, createNotification, sendNotification }
