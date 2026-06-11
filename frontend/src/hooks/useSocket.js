import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (roomId, eventHandlers = {}) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.io server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected', newSocket.id);
      
      // Join specific room
      if (roomId) {
        // We'll use a generic join event for both session and restaurant
        // Or we could have passed the event name
        newSocket.emit(roomId.type === 'session' ? 'join-session' : 'join-restaurant', roomId.id);
      }
    });

    // Attach custom event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      newSocket.on(event, handler);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId?.id, roomId?.type]); // Only reconnect if room ID or type changes

  return socket;
};

export default useSocket;
