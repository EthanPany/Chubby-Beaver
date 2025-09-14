import Foundation
import Starscream

class WebSocketManager: NSObject {
    private var socket: WebSocket?
    private var serverURL: URL
    private var isConnected = false
    private var reconnectTimer: Timer?
    private var deviceId: String

    // Callbacks
    var onConnected: (() -> Void)?
    var onDisconnected: (() -> Void)?
    var onError: ((Error?) -> Void)?
    var onDirectionUpdate: ((String, Double, Double) -> Void)?

    init(serverURL: String = "ws://localhost:3000") {
        self.serverURL = URL(string: serverURL)!
        self.deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        super.init()
        setupWebSocket()
    }

    private func setupWebSocket() {
        var request = URLRequest(url: serverURL)
        request.timeoutInterval = 5

        socket = WebSocket(request: request)
        socket?.delegate = self
    }

    func connect() {
        socket?.connect()
    }

    func disconnect() {
        reconnectTimer?.invalidate()
        socket?.disconnect()
    }

    func sendMotionData(_ motionData: [String: Any]) {
        guard isConnected else {
            print("WebSocket not connected")
            return
        }

        var data = motionData
        data["deviceId"] = deviceId

        let message: [String: Any] = [
            "type": "motion",
            "deviceId": deviceId,
            "data": data
        ]

        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            socket?.write(string: jsonString)
        }
    }

    func calibrate() {
        guard isConnected else { return }

        let message: [String: Any] = [
            "type": "calibrate",
            "deviceId": deviceId
        ]

        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            socket?.write(string: jsonString)
        }
    }

    func reset() {
        guard isConnected else { return }

        let message: [String: Any] = [
            "type": "reset",
            "deviceId": deviceId
        ]

        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            socket?.write(string: jsonString)
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }

        switch type {
        case "connected":
            print("Connected to server with ID: \(json["clientId"] ?? "")")

        case "processed":
            if let data = json["data"] as? [String: Any],
               let directionData = data["direction"] as? [String: Any],
               let direction = directionData["direction"] as? String,
               let heading = directionData["heading"] as? Double,
               let confidence = directionData["confidence"] as? Double {
                onDirectionUpdate?(direction, heading, confidence)
            }

        case "calibrated":
            print("Device calibrated")

        case "error":
            print("Server error: \(json["message"] ?? "")")

        default:
            break
        }
    }

    private func scheduleReconnect() {
        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { [weak self] _ in
            print("Attempting to reconnect...")
            self?.connect()
        }
    }
}

// MARK: - WebSocketDelegate
extension WebSocketManager: WebSocketDelegate {
    func didReceive(event: WebSocketEvent, client: WebSocket) {
        switch event {
        case .connected(_):
            isConnected = true
            reconnectTimer?.invalidate()
            onConnected?()
            print("WebSocket connected")

        case .disconnected(let reason, let code):
            isConnected = false
            onDisconnected?()
            print("WebSocket disconnected: \(reason) with code: \(code)")
            scheduleReconnect()

        case .text(let text):
            handleMessage(text)

        case .binary(_):
            break

        case .ping(_), .pong(_):
            break

        case .viabilityChanged(let viable):
            print("WebSocket viability changed: \(viable)")

        case .reconnectSuggested(let shouldReconnect):
            if shouldReconnect {
                scheduleReconnect()
            }

        case .cancelled:
            isConnected = false

        case .error(let error):
            isConnected = false
            onError?(error)
            print("WebSocket error: \(error?.localizedDescription ?? "Unknown error")")
            scheduleReconnect()
        }
    }
}