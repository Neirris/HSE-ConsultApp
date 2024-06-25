import { createClient } from '@vercel/postgres'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  connectionString: process.env.POSTGRES_URL
})

export default client
