# iOS Integration Guide for AirPods Motion Streaming

## 📱 Setup Instructions

### 1. Install CocoaPods Dependencies

Navigate to the iOS project directory and install the Starscream WebSocket library:

```bash
cd /Users/panyiyang/code/hackMIT/AirPodsPro-Motion-Sampler
pod install
```

If you don't have CocoaPods installed:
```bash
sudo gem install cocoapods
```

### 2. Open the Workspace

After pod installation, open the `.xcworkspace` file (not `.xcodeproj`):
```bash
open AirPodsProMotion.xcworkspace
```

### 3. Configure Server Connection

#### For Simulator Testing
Use `ws://localhost:3000` (default)

#### For Physical Device Testing
1. Find your computer's IP address:
   ```bash
   # On macOS
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update the server URL in the app to:
   ```
   ws://YOUR_COMPUTER_IP:3000
   ```
   Example: `ws://192.168.1.100:3000`

### 4. Required Permissions

Add to `Info.plist` if not already present:
```xml
<key>NSMotionUsageDescription</key>
<string>This app uses motion data from your AirPods to detect head direction</string>
```

### 5. Build and Run

1. Connect your iOS device (iPhone or iPad)
2. Ensure AirPods Pro/Max are connected to the device via Bluetooth
3. Select your device as the build target in Xcode
4. Build and run (Cmd+R)

## 🔍 Verify Integration

### Check Files Are Present
The following files should be in the project:
- ✅ `WebSocketManager.swift` - WebSocket communication handler
- ✅ `MotionStreamingViewController.swift` - UI for streaming control
- ✅ `Podfile` - CocoaPods dependencies

### Test the Connection

1. **Start the Backend Server**
   ```bash
   cd /Users/panyiyang/code/hackMIT/gyro/server
   npm install
   npm run dev
   ```

2. **Run the iOS App**
   - Launch the app on your device
   - Navigate to "Stream to Server" from the main menu
   - Enter server URL (use your computer's IP for device testing)
   - Tap "Connect"

3. **Verify Data Flow**
   - Status should change to "Connected" (green)
   - Direction should start showing (N, NE, E, SE, S, SW, W, NW)
   - Heading should display degrees (0-360°)
   - Confidence should show percentage

4. **Calibration**
   - Face North (or desired reference direction)
   - Tap "Calibrate" button
   - The current direction will be set as North (0°)

## 🐛 Troubleshooting

### "Headphone motion is not available"
- Ensure AirPods Pro/Max are connected
- Check Bluetooth settings
- Try disconnecting and reconnecting AirPods

### Cannot Connect to Server
- Verify server is running (`npm run dev`)
- Check firewall isn't blocking port 3000
- Ensure device and computer are on same network
- Use correct IP address (not localhost) for device testing

### No Direction Updates
- Move your head slowly to see changes
- Check confidence level - low confidence may indicate issues
- Try calibrating again

### Build Errors

#### "No such module 'Starscream'"
Run `pod install` and open `.xcworkspace` instead of `.xcodeproj`

#### "Undefined symbols for architecture"
Clean build folder (Shift+Cmd+K) and rebuild

## 📊 Server Monitoring

While the app is streaming, you can monitor the server:

1. **Check connected devices:**
   ```bash
   curl http://localhost:3000/api/devices
   ```

2. **Get device statistics:**
   ```bash
   curl http://localhost:3000/api/devices/YOUR_DEVICE_ID/stats
   ```

3. **View server logs:**
   Check the terminal where `npm run dev` is running

## 🎯 Usage Tips

1. **Best Performance:**
   - Keep phone/server on same Wi-Fi network
   - Minimize distance between AirPods and phone
   - Avoid rapid head movements during calibration

2. **Calibration:**
   - Stand still when calibrating
   - Face a known direction (use compass app if needed)
   - Recalibrate if direction seems off

3. **Battery Optimization:**
   - Disconnect when not in use
   - Lower update rate if needed (modify `updateInterval` in code)

## 📝 Development Notes

### Modifying Update Rate
In `MotionStreamingViewController.swift`:
```swift
private var updateInterval: TimeInterval = 0.05 // 20 Hz
// Change to 0.1 for 10 Hz, 0.033 for 30 Hz, etc.
```

### Changing Server URL Default
In `MotionStreamingViewController.swift`, `setupUI()` method:
```swift
serverURLTextField.text = "ws://your-server:3000"
```

### Adding Custom Processing
Modify `processAndSendMotion()` method to add custom data processing before sending to server.

## ✅ Verification Checklist

- [ ] CocoaPods installed and `pod install` completed
- [ ] Using `.xcworkspace` file
- [ ] Server running on port 3000
- [ ] AirPods Pro/Max connected
- [ ] Correct server URL configured
- [ ] App launches without errors
- [ ] "Stream to Server" option visible in menu
- [ ] Can connect to server
- [ ] Direction updates shown in UI
- [ ] Calibration works

## 🚀 Next Steps

1. Test with different head movements
2. Monitor server-side data processing
3. Adjust smoothing factors if needed
4. Implement additional features as required