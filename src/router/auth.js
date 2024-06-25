import axios from 'axios'

let isCheckingAuth = false

export const checkAuth = async () => {
  if (isCheckingAuth) {
    return null
  }

  isCheckingAuth = true

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/check-auth`, {
      withCredentials: true
    })
    const { accountType, userId } = response.data
    return { accountType, userId }
  } catch (error) {
    console.error('Не авторизован:', error)
    return null
  } finally {
    isCheckingAuth = false
  }
}
