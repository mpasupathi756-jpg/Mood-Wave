// MoodWave Socket.IO client — connects to backend for room real-time events
// Note: Java backend uses native WebSocket (/ws/rooms/{code}) for room sync.
// This socket.js is a lightweight wrapper that gracefully no-ops if socket.io
// is not available on the server (Java backend doesn't run socket.io).

let socket = null

export const getSocket = () => socket

export const connect = (token) => {
  // Don't crash if socket.io server is unavailable — Java backend uses raw WebSocket
  try {
    if (socket?.connected) return socket
    // Return a dummy socket object that no-ops to prevent crashes
    socket = {
      connected: false,
      emit: () => {},
      on: () => {},
      off: () => {},
      disconnect: () => {},
    }
  } catch {
    socket = null
  }
  return socket
}

export const disconnect = () => {
  try {
    if (socket && typeof socket.disconnect === 'function') socket.disconnect()
  } catch {}
  socket = null
}
