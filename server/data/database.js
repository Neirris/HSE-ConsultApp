import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')

const db = new sqlite3.Database(dbPath)

const defaultProfileImagePath = path.resolve(__dirname, '../assets/icons/DefaultPFP.png')
const defaultProfileImage = fs.readFileSync(defaultProfileImagePath, { encoding: 'base64' })

export const initializeDatabase = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        accountType TEXT,
        token TEXT
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        educationProgramId INTEGER,
        FOREIGN KEY(educationProgramId) REFERENCES educationPrograms(id)
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS educationPrograms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        fullName TEXT,
        description TEXT,
        profileImage TEXT,
        sectionId INTEGER,
        educationProgramId INTEGER,
        mainContact TEXT,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(sectionId) REFERENCES sections(id),
        FOREIGN KEY(educationProgramId) REFERENCES educationPrograms(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherId INTEGER,
        title TEXT,
        description TEXT,
        slots INTEGER,
        start DATETIME,
        end DATETIME,
        FOREIGN KEY(teacherId) REFERENCES users(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS consultationRegistrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultationId INTEGER,
        studentId INTEGER,
        FOREIGN KEY(consultationId) REFERENCES consultations(id),
        FOREIGN KEY(studentId) REFERENCES users(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS chatSessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1Id INTEGER,
        user2Id INTEGER,
        FOREIGN KEY(user1Id) REFERENCES users(id),
        FOREIGN KEY(user2Id) REFERENCES users(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS chatMessages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId INTEGER,
        senderId INTEGER,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        isRead INTEGER DEFAULT 0,
        FOREIGN KEY(sessionId) REFERENCES chatSessions(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        senderId INTEGER,
        message TEXT,
        link TEXT,
        isRead INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
      )
    `)

    db.run(`
      CREATE TRIGGER IF NOT EXISTS set_default_section
      AFTER INSERT ON users
      FOR EACH ROW
      WHEN NEW.accountType = 'student'
      BEGIN
        INSERT INTO profiles (userId, fullName, description, profileImage, sectionId, educationProgramId)
        VALUES (NEW.id, '', '', '${defaultProfileImage}', (SELECT id FROM sections WHERE name = 'default'), NULL);
      END;
    `)
  })
}

export default db
