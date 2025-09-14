"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSServer = void 0;
const ws_1 = require("ws");
const motionProcessor_1 = require("../services/motionProcessor");
const buildingLocationService_1 = require("../services/buildingLocationService");
class WSServer {
    wss;
    motionProcessor;
    buildingLocationService;
    clients = new Map();
    heartbeatInterval = null;
    currentLocation = null;
    constructor(server) {
        this.wss = new ws_1.WebSocketServer({ server });
        this.motionProcessor = new motionProcessor_1.MotionProcessor();
        this.buildingLocationService = new buildingLocationService_1.BuildingLocationService();
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.initializeBuildingService();
    }
    async initializeBuildingService() {
        try {
            await this.buildingLocationService.initialize();
        }
        catch (error) {
            console.error('❌ Failed to initialize building location service:', error);
        }
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            process.stdout.write(`\r✅ Client connected: ${clientId} | Total: ${this.clients.size + 1} clients`);
            // Store client
            this.clients.set(clientId, ws);
            // Send welcome message
            this.sendToClient(ws, {
                type: 'connected',
                clientId,
                message: 'Connected to AirPods Gyro Server'
            });
            // Setup message handler
            ws.on('message', (data) => {
                this.handleMessage(ws, clientId, data);
            });
            // Setup error handler
            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
            });
            // Setup close handler
            ws.on('close', () => {
                this.clients.delete(clientId);
                this.motionProcessor.clearDeviceData(clientId);
                process.stdout.write(`\r❌ Client disconnected: ${clientId} | Total: ${this.clients.size} clients`);
            });
            // Setup pong handler for heartbeat
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });
    }
    handleMessage(ws, clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'motion':
                    this.handleMotionData(ws, message.deviceId || clientId, message.data);
                    break;
                case 'calibrate':
                    this.handleCalibration(ws, message.deviceId || clientId);
                    break;
                case 'reset':
                    this.handleReset(ws, message.deviceId || clientId);
                    break;
                case 'getStats':
                    this.handleGetStats(ws, message.deviceId || clientId);
                    break;
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                    break;
                case 'updateLocation':
                    this.handleLocationUpdate(ws, message.data);
                    break;
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            console.error('Error parsing message:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Invalid message format'
            });
        }
    }
    async handleMotionData(ws, deviceId, data) {
        try {
            // Process the motion data
            const processedData = this.motionProcessor.processData(data, deviceId);
            // Update building location data if we have current location
            let locationState = null;
            let facingBuilding = null;
            if (this.currentLocation) {
                try {
                    locationState = await this.buildingLocationService.updateLocationAndDirection(this.currentLocation.lat, this.currentLocation.lng, processedData.direction.direction, processedData.direction.heading, 10 // Get 10 closest buildings
                    );
                    facingBuilding = locationState.facingBuilding;
                }
                catch (error) {
                    console.error('❌ Error updating building location:', error);
                }
            }
            // Enhanced status display
            const direction = processedData.direction.direction;
            const heading = Math.round(processedData.direction.heading);
            const confidence = Math.round(processedData.direction.confidence * 100);
            const buildingInfo = facingBuilding ? ` → ${facingBuilding.name}` : '';
            process.stdout.write(`\r🧭 ${deviceId.slice(-6)}: ${direction} ${heading}° (${confidence}%)${buildingInfo}    `);
            // Send enhanced processed data back to client
            this.sendToClient(ws, {
                type: 'processed',
                data: {
                    direction: processedData.direction,
                    timestamp: processedData.timestamp,
                    deviceId: processedData.deviceId,
                    facingBuilding: facingBuilding,
                    nearbyBuildings: locationState?.nearbyBuildings || [],
                    locationState: locationState
                }
            });
            // Broadcast to other clients for monitoring
            this.broadcastToOthers(ws, {
                type: 'deviceUpdate',
                deviceId,
                data: {
                    direction: processedData.direction.direction,
                    heading: processedData.direction.heading,
                    confidence: processedData.direction.confidence,
                    facingBuilding: facingBuilding?.name || null,
                    nearbyBuildingsCount: locationState?.nearbyBuildings.length || 0
                }
            });
        }
        catch (error) {
            process.stdout.write(`\r❌ Error processing motion data: ${error}    `);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Failed to process motion data'
            });
        }
    }
    handleCalibration(ws, deviceId) {
        // Manual calibration using current orientation
        this.motionProcessor.calibrateDevice(deviceId);
        process.stdout.write(`\r🎯 Calibrated ${deviceId.slice(-6)} - current direction set as North    `);
        this.sendToClient(ws, {
            type: 'calibrated',
            deviceId,
            message: 'Current direction set as North'
        });
    }
    handleReset(ws, deviceId) {
        this.motionProcessor.resetDevice(deviceId);
        this.sendToClient(ws, {
            type: 'reset',
            deviceId,
            message: 'Device reset successfully'
        });
    }
    handleGetStats(ws, deviceId) {
        const motionStats = this.motionProcessor.getDeviceStats(deviceId);
        const locationStatus = this.buildingLocationService.getConnectionStatus();
        const currentState = this.buildingLocationService.getCurrentLocationState();
        this.sendToClient(ws, {
            type: 'stats',
            deviceId,
            data: {
                motion: motionStats,
                location: {
                    currentLocation: this.currentLocation,
                    buildingService: locationStatus,
                    state: currentState
                }
            }
        });
    }
    async handleLocationUpdate(ws, data) {
        try {
            this.currentLocation = { lat: data.lat, lng: data.lng };
            console.log(`📍 Location updated: ${data.lat}, ${data.lng}`);
            // Get nearby buildings for the new location
            const nearbyBuildings = await this.buildingLocationService.findClosestBuildings(data.lat, data.lng, 10);
            this.sendToClient(ws, {
                type: 'locationUpdated',
                data: {
                    location: this.currentLocation,
                    nearbyBuildings: nearbyBuildings
                }
            });
            // Broadcast to other clients
            this.broadcastToOthers(ws, {
                type: 'locationBroadcast',
                data: {
                    location: this.currentLocation,
                    nearbyBuildingsCount: nearbyBuildings.length
                }
            });
        }
        catch (error) {
            console.error('❌ Error handling location update:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Failed to update location'
            });
        }
    }
    sendToClient(ws, data) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    broadcastToOthers(sender, data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (client !== sender && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds
    }
    async stop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.clients.forEach((ws) => {
            ws.close();
        });
        this.wss.close();
        // Close database connection
        await this.buildingLocationService.close();
    }
    getConnectedDevices() {
        return this.motionProcessor.getConnectedDevices();
    }
    getDeviceStats(deviceId) {
        return this.motionProcessor.getDeviceStats(deviceId);
    }
    getBuildingLocationService() {
        return this.buildingLocationService;
    }
}
exports.WSServer = WSServer;
//# sourceMappingURL=wsServer.js.map