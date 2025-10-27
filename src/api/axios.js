import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // <- importante
  withCredentials: true                 // <- para enviar/recibir cookie JWT
})

export default api
