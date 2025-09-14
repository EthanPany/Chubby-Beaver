# AirPods Pro Gyro Streaming System

A real-time motion tracking system that streams gyroscope data from AirPods Pro/Max to a TypeScript server, providing head direction detection (N, NE, E, SE, S, SW, W, NW) with WebSocket communication.

## 🎯 Features

- **Real-time Motion Streaming**: Continuous gyroscope data streaming from AirPods Pro/Max
- **Cardinal Direction Detection**: Accurate head direction calculation (8 cardinal points)
- **WebSocket Communication**: Low-latency bidirectional data streaming
- **Automatic Calibration**: Set current heading as North reference point
- **Confidence Scoring**: Motion stability and accuracy indicators
- **Multi-device Support**: Handle multiple concurrent AirPods connections
- **Smoothing Algorithms**: Reduces jitter in direction readings
- **REST API**: Monitor device status and statistics

## 📁 Project Structure

```
gyro/
├── server/                     # TypeScript backend server
│   ├── src/
│   │   ├── index.ts           # Main server entry point
│   │   ├── types/
│   │   │   └── motion.ts      # TypeScript type definitions
│   │   ├── utils/
│   │   │   └── directionCalculator.ts  # Direction calculation algorithms
│   │   ├── services/
│   │   │   └── motionProcessor.ts      # Motion data processing
│   │   └── websocket/
│   │       └── wsServer.ts    # WebSocket server implementation
│   ├── package.json
│   └── tsconfig.json
│
├── ios-integration/           # iOS Swift integration code
│   ├── WebSocketManager.swift
│   ├── MotionStreamingViewController.swift
│   └── Podfile
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Xcode 12.0+
- iOS 14.0+
- AirPods Pro, AirPods Max, AirPods (3rd gen), or Beats Fit Pro
- TypeScript

### Backend Server Setup

1. **Navigate to server directory**
   ```bash
   cd gyro/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

   Server will start on `http://localhost:3000`

### iOS App Integration

1. **Clone the AirPods Motion Sampler repository**
   ```bash
   git clone https://github.com/tukuyo/AirPodsPro-Motion-Sampler.git
   cd AirPodsPro-Motion-Sampler
   ```

2. **Install CocoaPods dependencies**
   ```bash
   cd ios-integration
   pod install
   ```

3. **Add WebSocket integration files**
   - Copy `WebSocketManager.swift` to your Xcode project
   - Copy `MotionStreamingViewController.swift` to your Xcode project
   - Add Starscream pod to your Podfile

4. **Configure server URL**
   - Update the server URL in the app to point to your backend
   - Default: `ws://localhost:3000`
   - For device testing: Use your computer's IP address

5. **Build and run**
   - Open `.xcworkspace` file in Xcode
   - Connect your iOS device
   - Ensure AirPods Pro/Max are connected to the device
   - Build and run the app

## 📡 WebSocket Protocol

### Client → Server Messages

#### Motion Data
```json
{
  "type": "motion",
  "deviceId": "device_unique_id",
  "data": {
    "timestamp": 1234567890.123,
    "attitude": {
      "quaternion": { "x": 0, "y": 0, "z": 0, "w": 1 },
      "eulerAngles": { "pitch": 0, "roll": 0, "yaw": 0 }
    },
    "rotationRate": { "x": 0, "y": 0, "z": 0 },
    "userAcceleration": { "x": 0, "y": 0, "z": 0 },
    "gravity": { "x": 0, "y": -1, "z": 0 }
  }
}
```

#### Calibrate
```json
{
  "type": "calibrate",
  "deviceId": "device_unique_id"
}
```

#### Reset
```json
{
  "type": "reset",
  "deviceId": "device_unique_id"
}
```

### Server → Client Messages

#### Processed Direction
```json
{
  "type": "processed",
  "data": {
    "direction": {
      "direction": "NE",
      "heading": 45.5,
      "confidence": 0.95
    },
    "timestamp": 1234567890.123,
    "deviceId": "device_unique_id"
  }
}
```

## 🌐 REST API Endpoints

### Health Check
```http
GET /health
```

### Get Connected Devices
```http
GET /api/devices
```

Response:
```json
{
  "count": 2,
  "devices": ["device_id_1", "device_id_2"]
}
```

### Get Device Statistics
```http
GET /api/devices/:deviceId/stats
```

Response:
```json
{
  "currentDirection": "N",
  "currentHeading": 358.5,
  "averageConfidence": 0.92,
  "averageRotationRate": {
    "x": 0.02,
    "y": 0.01,
    "z": 0.03
  },
  "dataPoints": 100,
  "lastUpdate": 1234567890123
}
```

### Server Info
```http
GET /api/info
```

## 🧭 Direction Calculation

The system uses quaternion-based orientation tracking with the following features:

1. **Quaternion to Euler Conversion**: Converts quaternion orientation to Euler angles
2. **Yaw-based Heading**: Uses yaw angle for horizontal direction
3. **Calibration**: Sets current orientation as North (0°)
4. **Smoothing**: Exponential smoothing reduces jitter
5. **Confidence Scoring**: Based on rotation rate and acceleration

### Cardinal Directions

- **N** (North): 337.5° - 22.5°
- **NE** (Northeast): 22.5° - 67.5°
- **E** (East): 67.5° - 112.5°
- **SE** (Southeast): 112.5° - 157.5°
- **S** (South): 157.5° - 202.5°
- **SW** (Southwest): 202.5° - 247.5°
- **W** (West): 247.5° - 292.5°
- **NW** (Northwest): 292.5° - 337.5°

## 🔧 Configuration

### Server Configuration

Edit `.env` file:
```env
PORT=3000
```

### Smoothing Factor

Adjust in `directionCalculator.ts`:
```typescript
calculator.setSmoothingFactor(0.2); // 0-1, higher = more smoothing
```

### Update Rate

iOS app update frequency:
```swift
private var updateInterval: TimeInterval = 0.05 // 20 Hz
```

## 📊 Performance Considerations

- **Update Rate**: 20 Hz (50ms interval) provides good balance
- **Buffer Size**: Server maintains 100 data points per device
- **Heartbeat**: 30-second WebSocket ping/pong
- **Reconnection**: Automatic 5-second retry on disconnect

## 🐛 Troubleshooting

### AirPods Not Detected
- Ensure AirPods Pro/Max are connected via Bluetooth
- Check iOS version (14.0+ required)
- Verify CMHeadphoneMotionManager availability

### Connection Issues
- Check server is running on correct port
- Verify firewall settings
- Use device IP address instead of localhost for physical devices

### Inaccurate Directions
- Perform calibration after connecting
- Ensure AirPods are properly worn
- Check confidence scores
- Adjust smoothing factor if needed

## 📝 Development

### Running Tests
```bash
cd server
npm test
```

### Building for Production
```bash
cd server
npm run build
```

### Type Checking
```bash
cd server
npx tsc --noEmit
```

## 🔮 Future Enhancements

- [ ] Add magnetometer support for absolute heading
- [ ] Implement gesture recognition
- [ ] Add data recording and playback
- [ ] Create web dashboard for visualization
- [ ] Support for multiple coordinate systems
- [ ] Machine learning for gesture patterns
- [ ] Battery level monitoring
- [ ] Latency optimization

## 📄 License

MIT License - Feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📚 References

- [CMHeadphoneMotionManager Documentation](https://developer.apple.com/documentation/coremotion/cmheadphonemotionmanager)
- [AirPods Pro Motion Sampler](https://github.com/tukuyo/AirPodsPro-Motion-Sampler)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Quaternion Mathematics](https://en.wikipedia.org/wiki/Quaternion)