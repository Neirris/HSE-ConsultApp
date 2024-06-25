import sql from './config.js'
import CryptoJS from 'crypto-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultProfileImagePath = path.join(__dirname, '../assets/icons/DefaultPFP.png')
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

  try {
    await sql.begin(async (sql) => {
      await sql`
        INSERT INTO educationPrograms (name)
        VALUES ${sql(educationPrograms.map((name) => [name]))}
        ON CONFLICT (name) DO NOTHING
      `

      for (const section of sections) {
        await sql`
          INSERT INTO sections (name, educationProgramId)
          VALUES (${section.name}, (SELECT id FROM educationPrograms WHERE name = ${section.program}))
          ON CONFLICT (name) DO NOTHING
        `
      }

      for (const user of users) {
        user.hashedPassword = CryptoJS.SHA256(user.password).toString(CryptoJS.enc.Hex)
        user.token = createPermanentToken(user.email, user.hashedPassword)

        const res = await sql`
          INSERT INTO users (email, password, accountType, token)
          VALUES (${user.email}, ${user.hashedPassword}, ${user.accountType}, ${user.token})
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `

        if (res.count > 0) {
          const userId = res[0].id
          const defaultSectionId = await sql`
            SELECT id FROM sections WHERE name = 'default'
          `

          await sql`
            INSERT INTO profiles (userId, fullName, description, profileImage, sectionId)
            VALUES (${userId}, ${user.fullName}, '', ${defaultProfileImage}, ${defaultSectionId[0].id})
            ON CONFLICT (userId) DO NOTHING
          `
        }
      }
    })
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}
