import api from './axios'

export const estimateTrip = (payload) => api.post('/trips/estimate', payload)
// payload: { origin, destination, zone, time }
export const requestTrip  = (payload) => api.post('/trips/request', payload)
