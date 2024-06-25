import { Pool } from '@vercel/postgres'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export default pool
