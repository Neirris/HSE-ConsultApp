import db from './database.js'
import CryptoJS from 'crypto-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultProfileImagePath = path.join(__dirname, 'assets', 'icons', 'DefaultPFP.png')
const defaultProfileImage = fs.readFileSync(defaultProfileImagePath, { encoding: 'base64' })

export const seedDatabase = () => {
  db.run(`
    INSERT OR IGNORE INTO sections (name)
    VALUES ('default')
  `)

  const adminPassword = '123321!!aA'
  const teacherPassword = '123321!!aA'
  const studentPassword = '123321!!aA'
  const hashedAdminPassword = CryptoJS.SHA256(adminPassword).toString(CryptoJS.enc.Hex)
  const hashedTeacherPassword = CryptoJS.SHA256(teacherPassword).toString(CryptoJS.enc.Hex)
  const hashedStudentPassword = CryptoJS.SHA256(studentPassword).toString(CryptoJS.enc.Hex)

  const adminToken = createPermanentToken('admin@mail.ru', hashedAdminPassword)
  const teacherToken = createPermanentToken('teacher@mail.ru', hashedTeacherPassword)
  const studentToken = createPermanentToken('student@mail.ru', hashedStudentPassword)

  db.serialize(() => {
    // Отключение триггера
    db.run(`DROP TRIGGER IF EXISTS set_default_section`)

    db.run(
      `
      INSERT OR IGNORE INTO users (email, password, accountType, token)
      VALUES ('admin@mail.ru', ?, 'admin', ?),
             ('teacher@mail.ru', ?, 'teacher', ?),
             ('student@mail.ru', ?, 'student', ?)
    `,
      [
        hashedAdminPassword,
        adminToken,
        hashedTeacherPassword,
        teacherToken,
        hashedStudentPassword,
        studentToken
      ],
      function (err) {
        if (err) {
          return console.error(err.message)
        }

        db.get(
          `
        SELECT id FROM sections WHERE name = 'default'
      `,
          (err, section) => {
            if (err) {
              return console.error(err.message)
            }
            const defaultSectionId = section.id

            const adminId = this.lastID - 2
            const teacherId = this.lastID - 1
            const studentId = this.lastID

            db.run(
              `
          INSERT OR IGNORE INTO profiles (userId, fullName, description, profileImage, sectionId)
          VALUES (?, 'Админ', '', ?, ?),
                 (?, 'Учитель', '', ?, ?),
                 (?, 'Студент', '', ?, ?)
        `,
              [
                adminId,
                defaultProfileImage,
                defaultSectionId,
                teacherId,
                defaultProfileImage,
                defaultSectionId,
                studentId,
                defaultProfileImage,
                defaultSectionId
              ]
            )
          }
        )
      }
    )

    // Включение триггера
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

const createPermanentToken = (email, password) => {
  const firstHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  const combined = email + firstHash
  const permanentToken = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex)
  return permanentToken
}
