# How to Add WebSocket Files to Xcode Project

## ⚠️ Important: Files Must Be Added to Xcode Target

The WebSocket files (`WebSocketManager.swift` and `MotionStreamingViewController.swift`) exist in the directory but need to be added to the Xcode project target to compile.

## 📝 Steps to Add Files to Xcode

### 1. Open the Xcode Workspace
```bash
cd /Users/panyiyang/code/hackMIT/AirPodsPro-Motion-Sampler
open AirPodsProMotion.xcworkspace
```

### 2. Add Files to Project

1. **Right-click on the `AirPodsProMotion` folder** in the Xcode navigator (left sidebar)
2. Select **"Add Files to 'AirPodsProMotion'..."**
3. Navigate to the `AirPodsProMotion` folder and select:
   - ✅ `WebSocketManager.swift`
   - ✅ `MotionStreamingViewController.swift`
4. **Important Settings:**
   - ✅ Check "Copy items if needed" (should be unchecked since files are already there)
   - ✅ Check "Add to targets: AirPodsProMotion"
   - Select "Create groups" for added folders
5. Click **"Add"**

### 3. Update TopViewController

After adding the files to Xcode, update `TopViewController.swift`:

```swift
// Line 22-23, change from:
private var items: [UIViewController] = [InformationViewController(), SK3DViewController(), TableViewController(), ExportCSVViewController()]
private var itemTitle: [String] = ["Information View", "Rotate the Cube View", "Table scrolling by Head Motion", "Export CSV file"]

// To:
private var items: [UIViewController] = [InformationViewController(), SK3DViewController(), TableViewController(), ExportCSVViewController(), MotionStreamingViewController()]
private var itemTitle: [String] = ["Information View", "Rotate the Cube View", "Table scrolling by Head Motion", "Export CSV file", "Stream to Server"]
```

### 4. Install CocoaPods Dependencies

If you haven't already:
```bash
cd /Users/panyiyang/code/hackMIT/AirPodsPro-Motion-Sampler
pod install
```

### 5. Build the Project

1. Select your target device (iPhone/iPad)
2. Press **Cmd+B** to build
3. Fix any remaining issues

## 🔍 Verify Files Are Added

In Xcode's navigator, you should see:
```
AirPodsProMotion
├── Assets.xcassets
├── Base.lproj
├── ExportCSVViewController.swift
├── InformationViewController.swift
├── MotionStreamingViewController.swift ← New file (should not be red)
├── Podfile
├── SK3DViewController.swift
├── Supporting Files/
├── TableViewController.swift
├── TopViewController.swift
└── WebSocketManager.swift ← New file (should not be red)
```

**Note:** If files appear in RED, they're not properly linked. Remove and re-add them.

## 🚨 Common Issues and Solutions

### "Cannot find type 'WebSocket' in scope"
**Solution:** Run `pod install` and make sure you opened `.xcworkspace` not `.xcodeproj`

### "Use of unresolved identifier 'MotionStreamingViewController'"
**Solution:** Make sure both Swift files are added to the project target (Step 2)

### "No such module 'Starscream'"
**Solution:**
1. Close Xcode
2. Run `pod install`
3. Open `.xcworkspace` file
4. Clean build folder (Shift+Cmd+K)
5. Build again

### Files appear in red in Xcode
**Solution:**
1. Remove the red files from Xcode (right-click → Delete → Remove Reference)
2. Re-add them following Step 2
3. Make sure the files physically exist in the directory

## ✅ Final Checklist

- [ ] Both Swift files added to Xcode project
- [ ] Files are not red in navigator
- [ ] Pod install completed successfully
- [ ] Using .xcworkspace file
- [ ] TopViewController updated with new menu item
- [ ] Project builds without errors
- [ ] "Stream to Server" appears in app menu

## 🎯 After Successful Setup

1. Start the backend server:
   ```bash
   cd /Users/panyiyang/code/hackMIT/gyro/server
   npm run dev
   ```

2. Run the iOS app
3. Navigate to "Stream to Server"
4. Enter your computer's IP address (not localhost for device testing)
5. Connect and start streaming!

## 💡 Alternative: Manual Integration

If adding files through Xcode is problematic, you can manually integrate the WebSocket code into an existing view controller like `ExportCSVViewController.swift`. Contact support if you need help with this approach.