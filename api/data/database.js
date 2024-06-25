import pool from './config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultProfileImagePath = path.resolve(__dirname, '../assets/icons/DefaultPFP.png')
const defaultProfileImage = fs.readFileSync(defaultProfileImagePath, { encoding: 'base64' })

export const initializeDatabase = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      DROP TABLE IF EXISTS consultationRegistrations;
      DROP TABLE IF EXISTS consultations;
      DROP TABLE IF EXISTS profiles;
      DROP TABLE IF EXISTS sections;
      DROP TABLE IF EXISTS educationPrograms;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS chatMessages;
      DROP TABLE IF EXISTS chatSessions;
      DROP TABLE IF EXISTS users;
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        accountType TEXT,
        token TEXT
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        educationProgramId INTEGER REFERENCES educationPrograms(id)
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS educationPrograms (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        fullName TEXT,
        description TEXT,
        profileImage TEXT,
        sectionId INTEGER REFERENCES sections(id),
        educationProgramId INTEGER REFERENCES educationPrograms(id),
        mainContact TEXT
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY,
        teacherId INTEGER REFERENCES users(id),
        title TEXT,
        description TEXT,
        slots INTEGER,
        start TIMESTAMP,
        end TIMESTAMP
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultationRegistrations (
        id SERIAL PRIMARY KEY,
        consultationId INTEGER REFERENCES consultations(id),
        studentId INTEGER REFERENCES users(id)
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chatSessions (
        id SERIAL PRIMARY KEY,
        user1Id INTEGER REFERENCES users(id),
        user2Id INTEGER REFERENCES users(id)
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chatMessages (
        id SERIAL PRIMARY KEY,
        sessionId INTEGER REFERENCES chatSessions(id),
        senderId INTEGER REFERENCES users(id),
        message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT FALSE
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        senderId INTEGER REFERENCES users(id),
        message TEXT,
        link TEXT,
        isRead BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await client.query(`
      CREATE OR REPLACE FUNCTION set_default_section()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.accountType = 'student' THEN
          INSERT INTO profiles (userId, fullName, description, profileImage, sectionId)
          VALUES (NEW.id, '', '', ${defaultProfileImage}, (SELECT id FROM sections WHERE name = 'default'));
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER set_default_section
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_default_section();
    `)
  } catch (error) {
    console.error('Error initializing database:', error)
  } finally {
    client.release()
  }
}

export default pool
