import axios from 'axios'

const API = axios.create({ baseURL: 'http://127.0.0.1:4000' })

API.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default API
