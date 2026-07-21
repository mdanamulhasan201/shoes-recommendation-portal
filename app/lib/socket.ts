import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/api/apiConfig'

/**
 * Socket.IO helper for foot-scanner presence:
 * - `initSocket(scannerId)` → singleton client; on connect emits `join-scanner` with scanner.id
 * - `getSocket()` → existing instance (or null)
 * - `disconnectSocket()` → closes and clears the instance
 *
 * Backend tracks online time in scanner_timeline_analytics (joinAt / leaveAt).
 * Same device reconnect = same session until all sockets disconnect.
 */

let socket: Socket | null = null
let joinedScannerId: string | null = null

function emitJoinScanner (scannerId: string) {
  if (!socket?.connected) return
  socket.emit('join-scanner', scannerId)
  console.info('[socket] Emitted join-scanner:', scannerId)
}

/**
 * Initialize a singleton Socket.IO client and join the scanner room after connect.
 * Safe on the server: returns null when `window` is not available.
 */
export const initSocket = (scannerId?: string | null): Socket | null => {
  if (typeof window === 'undefined') return null
  if (!scannerId) return socket

  joinedScannerId = scannerId

  if (socket) {
    emitJoinScanner(scannerId)
    return socket
  }

  socket = io(API_BASE_URL, {
    transports: ['polling', 'websocket'],
    path: '/socket.io',
    withCredentials: true
  })

  socket.on('connect', () => {
    console.info('[socket] Connected with id:', socket?.id)
    if (joinedScannerId) {
      emitJoinScanner(joinedScannerId)
    }
  })

  socket.on('disconnect', (reason) => {
    console.info('[socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[socket] Connection error:', error.message)
  })

  return socket
}

/** Get existing socket instance if initialised. */
export const getSocket = (): Socket | null => socket

/** Disconnect and clear socket instance. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  joinedScannerId = null
}
