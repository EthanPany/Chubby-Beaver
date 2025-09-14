# ✅ Fixed Setup Instructions

## The Starscream module is now installed!

### What was done:
1. ✅ Moved Podfile to correct location (project root)
2. ✅ Ran `pod install` successfully
3. ✅ Created `AirPodsProMotion.xcworkspace`
4. ✅ Installed Starscream WebSocket library

## 🚀 Next Steps

### 1. Close Xcode completely and reopen with workspace
```bash
# Make sure Xcode is closed, then:
open /Users/panyiyang/code/hackMIT/AirPodsPro-Motion-Sampler/AirPodsProMotion.xcworkspace
```

**⚠️ IMPORTANT: Use `.xcworkspace` NOT `.xcodeproj`**

### 2. Add the WebSocket files to Xcode project

In Xcode:
1. Right-click on `AirPodsProMotion` folder in navigator
2. Select "Add Files to 'AirPodsProMotion'..."
3. Navigate to the AirPodsProMotion folder and select:
   - `WebSocketManager.swift`
   - `MotionStreamingViewController.swift`
4. Ensure "Add to targets: AirPodsProMotion" is checked
5. Click "Add"

### 3. Update TopViewController.swift

Replace lines 22-23 with:
```swift
private var items: [UIViewController] = [InformationViewController(), SK3DViewController(), TableViewController(), ExportCSVViewController(), MotionStreamingViewController()]
private var itemTitle: [String] = ["Information View", "Rotate the Cube View", "Table scrolling by Head Motion", "Export CSV file", "Stream to Server"]
```

### 4. Build and Run

1. Clean build folder: `Shift+Cmd+K`
2. Build: `Cmd+B`
3. Run: `Cmd+R`

## 🎯 Testing the Integration

### Start the Backend Server
```bash
cd /Users/panyiyang/code/hackMIT/gyro/server
npm install
npm run dev
```

### Configure for Device Testing
If testing on a physical device, find your computer's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Use this IP in the app instead of `localhost`:
```
ws://YOUR_IP:3000
```
Example: `ws://192.168.1.100:3000`

## ✅ Verification Checklist

- [x] Starscream pod installed
- [x] .xcworkspace file created
- [ ] Using .xcworkspace (not .xcodeproj)
- [ ] WebSocketManager.swift added to project
- [ ] MotionStreamingViewController.swift added to project
- [ ] TopViewController updated
- [ ] Project builds without errors
- [ ] Server running on port 3000
- [ ] "Stream to Server" option visible in app

## 🆘 If You Still See Errors

### "No such module 'Starscream'"
1. Make absolutely sure you're using `.xcworkspace`
2. Clean build folder (`Shift+Cmd+K`)
3. Close Xcode completely
4. Reopen with: `open AirPodsProMotion.xcworkspace`
5. Build again

### "Cannot find 'MotionStreamingViewController' in scope"
The files need to be added to the Xcode project target (Step 2 above)

## 📁 Project Structure After Setup
```
AirPodsProMotion.xcworkspace/  ← USE THIS
AirPodsProMotion.xcodeproj/    ← NOT THIS
Pods/                           ← Created by pod install
Podfile
Podfile.lock
AirPodsProMotion/
  ├── WebSocketManager.swift
  ├── MotionStreamingViewController.swift
  └── ... other files
```

## 🎉 Success Indicators
- Xcode opens without module errors
- Project builds successfully
- "Stream to Server" appears in the app menu
- Can connect to the backend server
- Direction data appears when connected

---

The Starscream issue is now fixed! Just make sure to use the `.xcworkspace` file when opening the project in Xcode.