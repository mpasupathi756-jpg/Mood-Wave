import { io } from 'socket.io-client'

let socket = null

export const getSocket = () => socket

export const connect = (token) => {
  if (socket?.connected) return socket
  const socketUrl = import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000')

  socket = io(socketUrl, {
    auth       : { token },
    transports : ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay   : 1000,
  })
  return socket
}

export const disconnect = () => {
  socket?.disconnect()
  socket = null
}
