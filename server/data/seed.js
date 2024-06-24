import db from './database.js'
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

export const seedDatabase = () => {
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

  db.serialize(() => {
    db.run(
      `
      INSERT OR IGNORE INTO educationPrograms (name)
      VALUES ${educationPrograms.map(() => '(?)').join(', ')}
    `,
      educationPrograms
    )

    sections.forEach((section) => {
      db.run(
        `
        INSERT OR IGNORE INTO sections (name, educationProgramId)
        VALUES (?, (SELECT id FROM educationPrograms WHERE name = ?))
      `,
        [section.name, section.program]
      )
    })

    users.forEach((user) => {
      user.hashedPassword = CryptoJS.SHA256(user.password).toString(CryptoJS.enc.Hex)
      user.token = createPermanentToken(user.email, user.hashedPassword)
    })

    // выключение триггера
    db.run(`DROP TRIGGER IF EXISTS set_default_section`)

    db.run(
      `
      INSERT OR IGNORE INTO users (email, password, accountType, token)
      VALUES ${users.map(() => '(?, ?, ?, ?)').join(', ')}
    `,
      users.flatMap((user) => [user.email, user.hashedPassword, user.accountType, user.token]),
      function (err) {
        if (err) {
          return console.error(err.message)
        }

        db.get(`SELECT id FROM sections WHERE name = 'default'`, (err, section) => {
          if (err) {
            return console.error(err.message)
          }

          const defaultSectionId = section.id

          const profileValues = users
            .map((user, index) => [
              this.lastID - users.length + index + 1, // userId
              user.fullName,
              '',
              defaultProfileImage,
              defaultSectionId
            ])
            .flat()

          db.run(
            `
          INSERT OR IGNORE INTO profiles (userId, fullName, description, profileImage, sectionId)
          VALUES ${users.map(() => '(?, ?, ?, ?, ?)').join(', ')}
        `,
            profileValues
          )
        })
      }
    )

    db.run(`
      CREATE TRIGGER IF NOT EXISTS set_default_section
      AFTER INSERT ON users
      FOR EACH ROW
      WHEN NEW.accountType = 'student'
      BEGIN
        INSERT INTO profiles (userId, fullName, description, profileImage, sectionId)
        VALUES (NEW.id, '', '', '${defaultProfileImage}', (SELECT id FROM sections WHERE name = 'default'));
      END;
    `)
  })
}
