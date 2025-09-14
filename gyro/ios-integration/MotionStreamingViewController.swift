import UIKit
import CoreMotion

class MotionStreamingViewController: UIViewController {
    // UI Elements
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var directionLabel: UILabel!
    @IBOutlet weak var headingLabel: UILabel!
    @IBOutlet weak var confidenceLabel: UILabel!
    @IBOutlet weak var connectButton: UIButton!
    @IBOutlet weak var calibrateButton: UIButton!
    @IBOutlet weak var serverURLTextField: UITextField!

    // Motion Manager
    private var headphoneMotionManager: CMHeadphoneMotionManager?
    private var motionUpdateTimer: Timer?

    // WebSocket Manager
    private var webSocketManager: WebSocketManager?

    // Settings
    private var updateInterval: TimeInterval = 0.05 // 20 Hz
    private var isStreaming = false

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupMotionManager()
    }

    private func setupUI() {
        statusLabel.text = "Disconnected"
        directionLabel.text = "--"
        headingLabel.text = "--°"
        confidenceLabel.text = "--"
        serverURLTextField.text = "ws://localhost:3000"
        calibrateButton.isEnabled = false
    }

    private func setupMotionManager() {
        headphoneMotionManager = CMHeadphoneMotionManager()

        guard let manager = headphoneMotionManager else {
            showAlert(title: "Error", message: "Failed to initialize CMHeadphoneMotionManager")
            return
        }

        if !manager.isDeviceMotionAvailable {
            showAlert(title: "Not Available",
                     message: "Headphone motion is not available. Make sure AirPods Pro/Max are connected.")
            connectButton.isEnabled = false
        }
    }

    @IBAction func connectButtonTapped(_ sender: UIButton) {
        if isStreaming {
            stopStreaming()
        } else {
            startStreaming()
        }
    }

    @IBAction func calibrateButtonTapped(_ sender: UIButton) {
        webSocketManager?.calibrate()
        showToast("Calibration sent")
    }

    private func startStreaming() {
        guard let serverURL = serverURLTextField.text, !serverURL.isEmpty else {
            showAlert(title: "Error", message: "Please enter a valid server URL")
            return
        }

        // Initialize WebSocket
        webSocketManager = WebSocketManager(serverURL: serverURL)

        webSocketManager?.onConnected = { [weak self] in
            DispatchQueue.main.async {
                self?.statusLabel.text = "Connected"
                self?.statusLabel.textColor = .systemGreen
                self?.calibrateButton.isEnabled = true
                self?.startMotionUpdates()
            }
        }

        webSocketManager?.onDisconnected = { [weak self] in
            DispatchQueue.main.async {
                self?.statusLabel.text = "Disconnected"
                self?.statusLabel.textColor = .systemRed
                self?.calibrateButton.isEnabled = false
            }
        }

        webSocketManager?.onError = { [weak self] error in
            DispatchQueue.main.async {
                self?.showAlert(title: "Connection Error",
                               message: error?.localizedDescription ?? "Unknown error")
            }
        }

        webSocketManager?.onDirectionUpdate = { [weak self] direction, heading, confidence in
            DispatchQueue.main.async {
                self?.updateDirectionUI(direction: direction, heading: heading, confidence: confidence)
            }
        }

        // Connect to server
        webSocketManager?.connect()
        connectButton.setTitle("Disconnect", for: .normal)
        isStreaming = true
    }

    private func stopStreaming() {
        stopMotionUpdates()
        webSocketManager?.disconnect()
        webSocketManager = nil

        connectButton.setTitle("Connect", for: .normal)
        statusLabel.text = "Disconnected"
        statusLabel.textColor = .systemGray
        calibrateButton.isEnabled = false
        isStreaming = false

        // Reset UI
        directionLabel.text = "--"
        headingLabel.text = "--°"
        confidenceLabel.text = "--"
    }

    private func startMotionUpdates() {
        guard let manager = headphoneMotionManager else { return }

        manager.startDeviceMotionUpdates(to: OperationQueue.main) { [weak self] motion, error in
            if let error = error {
                print("Motion update error: \(error.localizedDescription)")
                return
            }

            guard let motion = motion else { return }
            self?.processAndSendMotion(motion)
        }
    }

    private func stopMotionUpdates() {
        headphoneMotionManager?.stopDeviceMotionUpdates()
    }

    private func processAndSendMotion(_ motion: CMDeviceMotion) {
        let motionData: [String: Any] = [
            "timestamp": motion.timestamp,
            "attitude": [
                "quaternion": [
                    "x": motion.attitude.quaternion.x,
                    "y": motion.attitude.quaternion.y,
                    "z": motion.attitude.quaternion.z,
                    "w": motion.attitude.quaternion.w
                ],
                "eulerAngles": [
                    "pitch": motion.attitude.pitch,
                    "roll": motion.attitude.roll,
                    "yaw": motion.attitude.yaw
                ]
            ],
            "rotationRate": [
                "x": motion.rotationRate.x,
                "y": motion.rotationRate.y,
                "z": motion.rotationRate.z
            ],
            "userAcceleration": [
                "x": motion.userAcceleration.x,
                "y": motion.userAcceleration.y,
                "z": motion.userAcceleration.z
            ],
            "gravity": [
                "x": motion.gravity.x,
                "y": motion.gravity.y,
                "z": motion.gravity.z
            ]
        ]

        webSocketManager?.sendMotionData(motionData)
    }

    private func updateDirectionUI(direction: String, heading: Double, confidence: Double) {
        directionLabel.text = direction
        headingLabel.text = String(format: "%.1f°", heading)
        confidenceLabel.text = String(format: "%.0f%%", confidence * 100)

        // Update direction label color based on confidence
        if confidence > 0.8 {
            directionLabel.textColor = .systemGreen
        } else if confidence > 0.5 {
            directionLabel.textColor = .systemYellow
        } else {
            directionLabel.textColor = .systemRed
        }
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    private func showToast(_ message: String) {
        let toast = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(toast, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            toast.dismiss(animated: true)
        }
    }
}