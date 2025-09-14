const WebSocket = require('ws');

class TestClient {
  constructor() {
    this.ws = null;
    this.deviceId = `test_device_${Date.now()}`;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:3001');

    this.ws.on('open', () => {
      console.log('🟢 Connected to server');
      this.sendLocationUpdate();
      this.startSendingMotionData();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('🔴 Disconnected from server');
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('✅ Server confirmed connection:', message.message);
        break;

      case 'processed':
        console.log('🧭 Motion processed:', {
          direction: message.data.direction.direction,
          heading: Math.round(message.data.direction.heading),
          confidence: Math.round(message.data.direction.confidence * 100) + '%',
          facingBuilding: message.data.facingBuilding?.name || 'None',
          nearbyBuildings: message.data.nearbyBuildings.length
        });
        break;

      case 'locationUpdated':
        console.log('📍 Location updated:', {
          lat: message.data.location.lat,
          lng: message.data.location.lng,
          nearbyBuildings: message.data.nearbyBuildings.length
        });
        break;

      default:
        console.log('📨 Received:', message.type);
    }
  }

  sendLocationUpdate() {
    // MIT coordinates
    const locationMessage = {
      type: 'updateLocation',
      deviceId: this.deviceId,
      data: {
        lat: 42.3601,
        lng: -71.0942
      }
    };

    this.ws.send(JSON.stringify(locationMessage));
    console.log('📍 Sent location update: MIT coordinates');
  }

  startSendingMotionData() {
    let heading = 0;

    // Simulate rotation - facing different directions
    setInterval(() => {
      heading = (heading + 15) % 360; // Rotate 15 degrees each second

      const motionData = {
        timestamp: Date.now(),
        attitude: {
          quaternion: { x: 0, y: 0, z: Math.sin(heading * Math.PI / 360), w: Math.cos(heading * Math.PI / 360) },
          eulerAngles: {
            pitch: 0,
            roll: 0,
            yaw: heading * Math.PI / 180
          }
        },
        rotationRate: { x: 0, y: 0, z: 0.1 },
        userAcceleration: { x: 0, y: 0, z: 0 },
        gravity: { x: 0, y: 0, z: -9.81 }
      };

      const message = {
        type: 'motion',
        deviceId: this.deviceId,
        data: motionData
      };

      this.ws.send(JSON.stringify(message));
    }, 1000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Start the test client
console.log('🚀 Starting test client...');
const client = new TestClient();
client.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test client...');
  client.disconnect();
  process.exit(0);
});