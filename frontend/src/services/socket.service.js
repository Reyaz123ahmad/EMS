import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    const accessToken = token || localStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    // Reattach listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket.on(event, cb);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return cleanup function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
