import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  init(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  // Setup basic event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Join a service request room for real-time updates
  joinRequest(requestId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_request', { requestId });
    }
  }

  // Leave a service request room
  leaveRequest(requestId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_request', { requestId });
    }
  }

  // Update location (for mechanics)
  updateLocation(location) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_location', {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 10,
      });
    }
  }

  // Send chat message
  sendMessage(requestId, message, sender = 'customer') {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        requestId,
        message,
        sender,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Send emergency alert
  sendEmergencyAlert(requestId, alertType, location) {
    if (this.socket && this.isConnected) {
      this.socket.emit('emergency_alert', {
        requestId,
        type: alertType,
        location,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Listen for request updates
  onRequestUpdate(callback) {
    if (this.socket) {
      this.socket.on('request_updated', callback);
    }
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for emergency alerts
  onEmergencyAlert(callback) {
    if (this.socket) {
      this.socket.on('emergency_alert', callback);
    }
  }

  // Listen for mechanic assigned
  onMechanicAssigned(callback) {
    if (this.socket) {
      this.socket.on('mechanic_assigned', callback);
    }
  }

  // Listen for service started
  onServiceStarted(callback) {
    if (this.socket) {
      this.socket.on('service_started', callback);
    }
  }

  // Listen for service completed
  onServiceCompleted(callback) {
    if (this.socket) {
      this.socket.on('service_completed', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket instance (for custom events)
  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
