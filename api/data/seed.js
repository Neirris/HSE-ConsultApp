/* eslint-disable no-useless-escape */
import pool from './database.js'
import CryptoJS from 'crypto-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultProfileImagePath = path.join(__dirname, 'assets', 'icons', 'DefaultPFP.png')
const defaultProfileImage = fs.readFileSync(defaultProfileImagePath, { encoding: 'base64' })

const createPermanentToken = (email, password) => {
  const firstHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const combined = email + firstHash
  return CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex)
}

export const seedDatabase = async () => {
  const educationPrograms = [
    'Программная инженерия',
    'Бизнес информатика',
    'Разработка информационных систем'
  ]

  const sections = [
    { name: 'default', program: null },
    { name: 'ПИ-21-1', program: 'Программная инженерия' },
    { name: 'ПИ-21-2', program: 'Программная инженерия' },
    { name: 'ПИ-21-3', program: 'Программная инженерия' },
    { name: 'БИ-21-1', program: 'Бизнес информатика' },
    { name: 'БИ-21-2', program: 'Бизнес информатика' },
    { name: 'БИ-21-3', program: 'Бизнес информатика' },
    { name: 'РИС-22-1', program: 'Разработка информационных систем' },
    { name: 'РИС-22-2', program: 'Разработка информационных систем' },
    { name: 'РИС-22-3', program: 'Разработка информационных систем' }
  ]

  const users = [
    { email: 'admin@mail.ru', password: '123321!!aA', accountType: 'admin', fullName: 'Админ' },
    {
      email: 'teacher@mail.ru',
      password: '123321!!aA',
      accountType: 'teacher',
      fullName: 'Учитель'
    },
    {
      email: 'student@mail.ru',
      password: '123321!!aA',
      accountType: 'student',
      fullName: 'Студент'
    }
  ]

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `
      INSERT INTO educationPrograms (name) VALUES
      ${educationPrograms.map((_, index) => `($${index + 1})`).join(', ')}
      ON CONFLICT DO NOTHING
    `,
      educationPrograms
    )

    for (const section of sections) {
      await client.query(
        `
        INSERT INTO sections (name, educationProgramId)
        VALUES (\$1, (SELECT id FROM educationPrograms WHERE name = \$2))
        ON CONFLICT DO NOTHING
      `,
        [section.name, section.program]
      )
    }

    for (const user of users) {
      const hashedPassword = CryptoJS.SHA256(user.password).toString(CryptoJS.enc.Hex)
      const token = createPermanentToken(user.email, hashedPassword)

      await client.query(
        `
        INSERT INTO users (email, password, accountType, token)
        VALUES (\$1, \$2, \$3, \$4)
        ON CONFLICT DO NOTHING
      `,
        [user.email, hashedPassword, user.accountType, token]
      )

      const res = await client.query(
        `
        SELECT id FROM users WHERE email = \$1
      `,
        [user.email]
      )

      const userId = res.rows[0].id

      const sectionRes = await client.query(`
        SELECT id FROM sections WHERE name = 'default'
      `)

      const defaultSectionId = sectionRes.rows[0].id

      await client.query(
        `
        INSERT INTO profiles (userId, fullName, description, profileImage, sectionId)
        VALUES (\$1, \$2, \$3, \$4, \$5)
        ON CONFLICT DO NOTHING
      `,
        [userId, user.fullName, '', defaultProfileImage, defaultSectionId]
      )
    }

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
