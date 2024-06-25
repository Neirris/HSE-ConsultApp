/* eslint-disable no-useless-escape */
import express from 'express'
import pool from '../data/database.js'

const adminRouter = express.Router()

adminRouter.get('/:table', async (req, res) => {
  const { table } = req.params
  const client = await pool.connect()
  try {
    const rows = await client.query(`SELECT * FROM ${table}`)
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}'
    `)

    const headers = columns.rows.map((col) => ({
      text: col.column_name.charAt(0).toUpperCase() + col.column_name.slice(1),
      value: col.column_name
    }))

    headers.push({ text: 'Actions', value: 'actions', sortable: false })

    res.json({ headers, rows: rows.rows })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных из таблицы' })
  } finally {
    client.release()
  }
})

adminRouter.get('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  const client = await pool.connect()
  try {
    const result = await client.query(`SELECT * FROM ${table} WHERE id = \$1`, [id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных по ID из таблицы' })
  } finally {
    client.release()
  }
})

adminRouter.post('/:table', async (req, res) => {
  const { table } = req.params
  const columns = Object.keys(req.body).join(', ')
  const placeholders = Object.keys(req.body)
    .map((_, index) => `$${index + 1}`)
    .join(', ')
  const values = Object.values(req.body)
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING id`,
      values
    )
    res.json({ id: result.rows[0].id, ...req.body })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при добавлении данных в таблицу' })
  } finally {
    client.release()
  }
})

adminRouter.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  const updates = Object.keys(req.body)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ')
  const values = [...Object.values(req.body), id]
  const client = await pool.connect()
  try {
    await client.query(`UPDATE ${table} SET ${updates} WHERE id = $${values.length}`, values)
    res.json({ id, ...req.body })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении данных в таблице' })
  } finally {
    client.release()
  }
})

adminRouter.delete('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  if (id === '1') {
    return res.status(400).json({ error: 'Невозможно удалить аккаунт' })
  }
  const client = await pool.connect()
  try {
    await client.query(`DELETE FROM ${table} WHERE id = \$1`, [id])
    res.json({ message: 'Дата успешно удалена' })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении данных из таблицы' })
  } finally {
    client.release()
  }
})

export default adminRouter
