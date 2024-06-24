import express from 'express'
import db from '../data/database.js'

const adminRouter = express.Router()

adminRouter.get('/:table', (req, res) => {
  const { table } = req.params

  db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при получении данных из таблицы' })
    }

    db.all(`PRAGMA table_info(${table})`, [], (err, columns) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при получении информации о таблице' })
      }

      const headers = columns.map((col) => ({
        text: col.name.charAt(0).toUpperCase() + col.name.slice(1),
        value: col.name
      }))

      headers.push({ text: 'Actions', value: 'actions', sortable: false })

      res.json({ headers, rows })
    })
  })
})

adminRouter.get('/:table/:id', (req, res) => {
  const { table, id } = req.params

  db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при получении данных по ID из таблицы' })
    }
    res.json(row)
  })
})

adminRouter.post('/:table', (req, res) => {
  const { table } = req.params
  const columns = Object.keys(req.body).join(', ')
  const placeholders = Object.keys(req.body)
    .map(() => '?')
    .join(', ')
  const values = Object.values(req.body)

  db.get(`SELECT MAX(id) as maxId FROM ${table}`, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при получении максимального id из таблицы' })
    }
    const newId = row.maxId + 1
    db.run(
      `INSERT INTO ${table} (id, ${columns}) VALUES (${newId}, ${placeholders})`,
      values,
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при добавлении данных в таблицу' })
        }
        res.json({ id: newId, ...req.body })
      }
    )
  })
})

adminRouter.put('/:table/:id', (req, res) => {
  const { table, id } = req.params
  const updates = Object.keys(req.body)
    .map((key) => `${key} = ?`)
    .join(', ')
  const values = [...Object.values(req.body), id]

  db.run(`UPDATE ${table} SET ${updates} WHERE id = ?`, values, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при обновлении данных в таблице' })
    }
    res.json({ id, ...req.body })
  })
})

adminRouter.delete('/:table/:id', (req, res) => {
  const { table, id } = req.params

  if (id === '1') {
    return res.status(400).json({ error: 'Невозможно удалить аккаунт' })
  }

  db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при удалении данных из таблицы' })
    }
    res.json({ message: 'Дата успешно удалена' })
  })
})

export default adminRouter
