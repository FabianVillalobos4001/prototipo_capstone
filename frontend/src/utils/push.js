import api from '../api/axios'

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
let registrationPromise = null

export async function initPushNotifications() {
  if (!PUBLIC_KEY) return null
  if (typeof window === 'undefined') return null
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const registration = await getRegistration()
  if (!registration) return null

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    })
  }

  try {
    await api.post('/notifications/subscribe', subscription)
  } catch (err) {
    console.warn('[push] subscribe failed', err)
  }

  return registration
}

function getRegistration() {
  if (!registrationPromise) {
    registrationPromise = (async () => {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return null
      return navigator.serviceWorker.register('/sw.js')
    })().catch((err) => {
      console.warn('[push] init failed', err)
      return null
    })
  }
  return registrationPromise
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
