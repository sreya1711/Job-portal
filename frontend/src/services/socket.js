import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const url = process.env.REACT_APP_SOCKET_URL || apiBase.replace(/\/api$/, '');
    socket = io(url, { withCredentials: true });
  }
  return socket;
}
