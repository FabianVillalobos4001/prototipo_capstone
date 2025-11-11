import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

const pushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)

if (pushEnabled) {
  webpush.setVapidDetails('mailto:notificaciones@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} else {
  console.warn('[push] VAPID keys missing. Push notifications disabled.')
}

async function sendPushToUsers(userIds, payload) {
  if (!pushEnabled || !Array.isArray(userIds) || userIds.length === 0) return

  const uniqueIds = [...new Set(userIds.map(String))]
  const subscriptions = await PushSubscription.find({ user: { $in: uniqueIds } }).lean()
  if (!subscriptions.length) return

  const data = JSON.stringify(payload)
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, data)
      } catch (err) {
        const status = err?.statusCode || err?.status
        if (status === 410 || status === 404) {
          await PushSubscription.deleteOne({ _id: sub._id })
        } else {
          console.error('[push] Error sending notification', status)
        }
      }
    })
  )
}

export async function notifyMatchEvent({ group, actorId, message }) {
  if (!pushEnabled || !group) return
  const recipients = group.members
    ?.map((m) => m?.userId && String(m.userId))
    .filter((id) => id && id !== String(actorId)) || []
  if (!recipients.length) return

  await sendPushToUsers(recipients, {
    title: 'Nuevo match listo para coordinar',
    body: message || 'Un companero se unio a tu grupo de viaje.',
    data: { url: `/chat/${group._id}` },
  })
}

export async function notifyChatMessage({ group, senderId, senderName, body }) {
  if (!pushEnabled || !group) return
  const recipients = group.members
    ?.map((m) => m?.userId && String(m.userId))
    .filter((id) => id && id !== String(senderId)) || []
  if (!recipients.length) return

  await sendPushToUsers(recipients, {
    title: `Nuevo mensaje de ${senderName || 'tu grupo'}`,
    body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
    data: { url: `/chat/${group._id}` },
  })
}

