import axios from 'axios'

const API_BASE_URL = 'https://hse-consult-app.vercel.app'

export const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-auth`, {
      withCredentials: true
    })
    const { accountType, userId } = response.data
    return { accountType, userId }
  } catch (error) {
    console.error('Не авторизован:', error)
    return null
  }
}

export const register = async (email, password, fullName) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/register`,
      {
        email,
        password,
        fullName
      },
      {
        withCredentials: true
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    throw error
  }
}

export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/login`,
      {
        email,
        password
      },
      {
        withCredentials: true
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка входа:', error)
    throw error
  }
}

export const logout = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/logout`,
      {},
      {
        withCredentials: true
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка выхода:', error)
    throw error
  }
}
