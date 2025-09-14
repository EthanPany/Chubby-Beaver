# 🧭 Automatic Compass Calibration Setup

## ✅ What's Been Added

### 🎯 **Auto-Calibration on Connect**
- When you connect to the server, the app automatically reads your phone's compass
- Uses the phone's heading to calibrate AirPods direction
- Assumes your head faces the same direction as your phone
- Shows a toast message: "Auto-calibrated with compass: 285°"

### 🔧 **Manual Calibration Button (Backup)**
- Still available if auto-calibration fails
- Uses current AirPods orientation instead of compass
- Good for fine-tuning or when compass isn't available

## 📱 **Required: Add Location Permission**

**IMPORTANT**: Add this to your `Info.plist` file for compass access:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses your device's compass to automatically calibrate head direction when connecting to the motion tracking server.</string>
```

### How to add in Xcode:
1. Open `Info.plist` in Xcode
2. Right-click → Add Row
3. Key: `NSLocationWhenInUseUsageDescription`
4. Type: String
5. Value: `This app uses your device's compass to automatically calibrate head direction when connecting to the motion tracking server.`

## 🌐 **How It Works**

### **Connection Flow:**
1. **Connect** to server → WebSocket established
2. **Auto-calibrate** → Phone compass reading sent to server
3. **Head direction** → Now aligned with phone's compass direction
4. **Manual backup** → Calibrate button still works for adjustments

### **Server Messages:**
- **Auto-calibration**: `🧭 Auto-calibrated abc123 with compass: 285°`
- **Manual calibration**: `🎯 Manual calibrated device: abc123`
- **Direction updates**: `🧭 abc123: NE 45° (87%)`

## 🎮 **User Experience**

### **First Time Use:**
1. App requests location permission for compass
2. User grants permission
3. Connect to server → automatic calibration happens
4. Direction immediately shows accurate compass bearings

### **Without Location Permission:**
1. Alert: "Location Access Denied - Please enable location access..."
2. Auto-calibration disabled
3. Manual calibration button still works
4. Can still use the app, just without automatic compass alignment

## 🧠 **Smart Features**

### **Delayed Auto-Calibration:**
- If compass not ready when connecting, app waits
- Auto-calibrates as soon as compass reading is available
- Only one auto-calibration per connection

### **Compass Accuracy:**
- Uses magnetic north (adjusted for local magnetic declination)
- Updates continuously in background
- Most accurate when phone is held flat and away from metal objects

## 🔧 **Troubleshooting**

### **"Location Access Denied"**
- Go to Settings → Privacy & Security → Location Services
- Find your app → Set to "While Using App"
- Restart the app

### **Inaccurate Auto-Calibration**
- Make sure phone compass is calibrated (wave phone in figure-8 motion)
- Hold phone away from metal objects
- Use manual calibration button for fine-tuning

### **No Auto-Calibration Message**
- Check location permission is granted
- Ensure compass is available (won't work in simulator)
- Manual calibration always works as backup

## 🎯 **Best Practices**

1. **Hold phone steady** when connecting for accurate auto-calibration
2. **Face the direction** you want to track when connecting
3. **Use manual calibration** to fine-tune if needed
4. **Recalibrate** if you move to a different location

## 🚀 **Testing**

1. **Build and run** the app
2. **Grant location permission** when prompted
3. **Connect to server** → should see auto-calibration toast
4. **Turn your head** → direction should align with phone's compass
5. **Test manual button** → should still work for adjustments

The system now provides the best of both worlds: automatic convenience with manual control!