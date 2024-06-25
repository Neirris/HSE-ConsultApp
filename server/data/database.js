/* eslint-disable no-undef */
import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
})

const defaultProfileImagePath = path.resolve(__dirname, '../assets/icons/DefaultPFP.png')
const defaultProfileImage = fs.readFileSync(defaultProfileImagePath, { encoding: 'base64' })

export const initializeDatabase = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS educationPrograms (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        educationProgramId INTEGER,
        FOREIGN KEY(educationProgramId) REFERENCES educationPrograms(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        accountType TEXT,
        token TEXT
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY,
        teacherId INTEGER,
        title TEXT,
        description TEXT,
        slots INTEGER,
        startTime TIMESTAMP,
        endTime TIMESTAMP,
        FOREIGN KEY(teacherId) REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultationRegistrations (
        id SERIAL PRIMARY KEY,
        consultationId INTEGER,
        studentId INTEGER,
        FOREIGN KEY(consultationId) REFERENCES consultations(id),
        FOREIGN KEY(studentId) REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chatSessions (
        id SERIAL PRIMARY KEY,
        user1Id INTEGER,
        user2Id INTEGER,
        FOREIGN KEY(user1Id) REFERENCES users(id),
        FOREIGN KEY(user2Id) REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chatMessages (
        id SERIAL PRIMARY KEY,
        sessionId INTEGER,
        senderId INTEGER,
        message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT FALSE,
        FOREIGN KEY(sessionId) REFERENCES chatSessions(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        senderId INTEGER,
        message TEXT,
        link TEXT,
        isRead BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(senderId) REFERENCES users(id)
      )
    `)

    // Удаляем существующий триггер, если он есть
    await client.query(`
      DROP TRIGGER IF EXISTS set_default_section ON users;
    `)

    await client.query(`
      CREATE OR REPLACE FUNCTION set_default_section()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.accountType = 'student' THEN
          INSERT INTO profiles (userId, fullName, description, profileImage, sectionId, educationProgramId)
          VALUES (
            NEW.id, 
            '', 
            '', 
            '${defaultProfileImage}', 
            (SELECT id FROM sections WHERE name = 'default'), 
            NULL
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await client.query(`
      CREATE TRIGGER set_default_section
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_default_section();
    `)
  } finally {
    client.release()
  }
}

export default pool
