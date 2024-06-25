/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'

const usersRouter = express.Router()

usersRouter.get('/users', async (req, res) => {
  const accountType = req.query.accountType

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT u.id, p.fullName, u.email 
       FROM users u
       JOIN profiles p ON u.id = p.userId
       WHERE u.accountType = \$1`,
      [accountType]
    )
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
  } finally {
    client.release()
  }
})

usersRouter.get('/users/not-registered/:eventId', async (req, res) => {
  const eventId = req.params.eventId

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT u.id, p.fullName, u.email 
       FROM users u
       JOIN profiles p ON u.id = p.userId
       WHERE u.accountType = 'student' AND u.id NOT IN (
         SELECT studentId FROM consultationRegistrations WHERE consultationId = \$1
       )`,
      [eventId]
    )
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка в получении данных пользователей' })
  } finally {
    client.release()
  }
})

usersRouter.get('/users/id/:id', async (req, res) => {
  const userId = req.params.id
  const token = req.cookies.token

  const client = await pool.connect()
  try {
    const result = await client.query(
      `
      SELECT u.email, p.fullName, p.profileImage, s.name as section, p.description, p.mainContact, ep.name as educationProgram, u.token, u.accountType
      FROM users u
      JOIN profiles p ON u.id = p.userId
      JOIN sections s ON p.sectionId = s.id
      LEFT JOIN educationPrograms ep ON p.educationProgramId = ep.id
      WHERE u.id = \$1
    `,
      [userId]
    )
    const row = result.rows[0]
    if (row) {
      const isOwnProfile = row.token === token
      res.json({
        email: row.email,
        fullName: row.fullname,
        profileImage: row.profileimage || '',
        section: row.section,
        description: row.description,
        mainContact: row.maincontact,
        educationProgram: row.educationprogram,
        isOwnProfile,
        accountType: row.accountype
      })
    } else {
      res.status(404).json({ error: 'Пользователь не найден' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

usersRouter.put('/users/id/:id', async (req, res) => {
  const userId = req.params.id
  const { fullName, email, mainContact, educationProgram, section, description, profileImage } =
    req.body

  const client = await pool.connect()
  try {
    const emailCheckResult = await client.query(
      `SELECT id FROM users WHERE email = \$1 AND id != \$2`,
      [email, userId]
    )
    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email уже используется' })
    }

    await client.query(`UPDATE users SET email = \$1 WHERE id = \$2`, [email, userId])

    await client.query(
      `UPDATE profiles
       SET fullName = \$1, description = \$2, mainContact = \$3, 
           educationProgramId = (SELECT id FROM educationPrograms WHERE name = \$4), 
           sectionId = (SELECT id FROM sections WHERE name = \$5), 
           profileImage = \$6
       WHERE userId = \$7`,
      [fullName, description || '', mainContact, educationProgram, section, profileImage, userId]
    )

    res.status(200).json({ message: 'Профиль обновлен успешно' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

usersRouter.get('/sections', async (req, res) => {
  const client = await pool.connect()
  try {
    const result = await client.query(`SELECT name FROM sections`)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

usersRouter.get('/education-programs', async (req, res) => {
  const client = await pool.connect()
  try {
    const result = await client.query(`SELECT name FROM educationPrograms`)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

usersRouter.get('/users/list', async (req, res) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  const client = await pool.connect()
  try {
    const userResult = await client.query(`SELECT accountType FROM users WHERE token = \$1`, [
      token
    ])
    const user = userResult.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }

    const { accountType } = user
    const searchQuery = req.query.searchQuery || ''
    const targetAccountType = accountType === 'student' ? 'teacher' : 'student'

    let query = `
      SELECT u.id, u.email, p.fullName, p.profileImage, u.accountType
      FROM users u
      JOIN profiles p ON u.id = p.userId
      WHERE u.accountType = \$1
    `
    const params = [targetAccountType]

    if (searchQuery) {
      query += ` AND (p.fullName LIKE \$2 OR u.email LIKE \$2)`
      const searchPattern = `%${searchQuery}%`
      params.push(searchPattern)
    }

    const result = await client.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default usersRouter
