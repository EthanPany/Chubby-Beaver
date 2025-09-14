"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingLocationService = void 0;
const mongodb_1 = require("mongodb");
class BuildingLocationService {
    client = null;
    db = null;
    buildingsCollection = null;
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectInterval = 5000; // 5 seconds
    locationState = null;
    connectionCheckInterval = null;
    constructor() {
        this.startConnectionMonitor();
    }
    async connectToDatabase() {
        try {
            const username = process.env.MONGODB_USERNAME || 'pyy122759996_db_user';
            const password = process.env.MONGODB_PASSWORD || 'rDrJ3vfjmwbJaCr8';
            const hostname = process.env.MONGODB_HOSTNAME || 'hackmit.kjtqepn.mongodb.net';
            const dbName = process.env.DB_NAME || 'mit_tour_guide';
            const mongoUrl = `mongodb+srv://${username}:${password}@${hostname}/?retryWrites=true&w=majority`;
            this.client = new mongodb_1.MongoClient(mongoUrl, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            await this.client.connect();
            this.db = this.client.db(dbName);
            this.buildingsCollection = this.db.collection('buildings');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('✅ Database connected successfully');
        }
        catch (error) {
            this.isConnected = false;
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    startConnectionMonitor() {
        this.connectionCheckInterval = setInterval(async () => {
            if (!this.isConnected) {
                await this.attemptReconnection();
            }
        }, this.reconnectInterval);
    }
    async attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            return;
        }
        this.reconnectAttempts++;
        console.log(`🔄 Attempting database reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        try {
            await this.connectToDatabase();
        }
        catch (error) {
            console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        }
    }
    async initialize() {
        try {
            await this.connectToDatabase();
        }
        catch (error) {
            console.error('❌ Initial database connection failed, will retry automatically');
        }
    }
    calculateEuclideanDistance(lat1, lng1, lat2, lng2) {
        const latDiff = lat1 - lat2;
        const lngDiff = lng1 - lng2;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = lng2 - lng1;
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        const bearing = Math.atan2(y, x);
        return (bearing * 180 / Math.PI + 360) % 360; // Convert to degrees and normalize
    }
    isWithinDirectionCone(targetBearing, currentHeading, coneWidth = 45) {
        const diff = Math.abs(targetBearing - currentHeading);
        const normalizedDiff = Math.min(diff, 360 - diff);
        return normalizedDiff <= coneWidth / 2;
    }
    async findClosestBuildings(lat, lng, k = 10, heading) {
        if (!this.isConnected || !this.buildingsCollection) {
            throw new Error('Database not connected. Attempting to reconnect...');
        }
        try {
            const allBuildings = await this.buildingsCollection.find({}).toArray();
            if (heading !== undefined) {
                // Use angle-prioritized ranking when heading is provided
                const buildingsWithRanking = allBuildings.map(building => {
                    const distance = this.calculateEuclideanDistance(lat, lng, building.coordinates.lat, building.coordinates.lng);
                    const distanceMeters = distance * 111320;
                    const bearing = this.calculateBearing(lat, lng, building.coordinates.lat, building.coordinates.lng);
                    const angleDifference = this.calculateAngleDifference(heading, bearing);
                    // Calculate ranking score (lower is better)
                    const angleScore = Math.abs(angleDifference);
                    // Distance weight: no penalty within 150m, linear decrease beyond
                    let distanceWeight = 1.0;
                    if (distanceMeters > 150) {
                        distanceWeight = Math.max(0.2, 1.0 - ((distanceMeters - 150) / 800));
                    }
                    const rankingScore = angleScore / distanceWeight;
                    return {
                        ...building,
                        distance,
                        distanceMeters,
                        bearing,
                        angleDifference,
                        distanceWeight,
                        rankingScore
                    };
                });
                buildingsWithRanking.sort((a, b) => a.rankingScore - b.rankingScore);
                return buildingsWithRanking.slice(0, k).map(({ distance, distanceMeters, bearing, angleDifference, distanceWeight, rankingScore, ...building }) => building);
            }
            else {
                // Use simple distance-based ranking when no heading provided
                const buildingsWithDistance = allBuildings.map(building => ({
                    ...building,
                    distance: this.calculateEuclideanDistance(lat, lng, building.coordinates.lat, building.coordinates.lng)
                }));
                buildingsWithDistance.sort((a, b) => a.distance - b.distance);
                return buildingsWithDistance.slice(0, k).map(({ distance, ...building }) => building);
            }
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Database query failed: ${error}`);
        }
    }
    calculateAngleDifference(heading, bearing) {
        let diff = bearing - heading;
        if (diff > 180)
            diff -= 360;
        if (diff < -180)
            diff += 360;
        return diff;
    }
    async updateLocationAndDirection(lat, lng, direction, heading, k = 10) {
        try {
            // Get nearby buildings
            const nearbyBuildings = await this.findClosestBuildings(lat, lng, k);
            // Find building the user is facing
            let facingBuilding = null;
            for (const building of nearbyBuildings) {
                const bearingToBuilding = this.calculateBearing(lat, lng, building.coordinates.lat, building.coordinates.lng);
                if (this.isWithinDirectionCone(bearingToBuilding, heading)) {
                    facingBuilding = building;
                    break; // Take the closest building within the direction cone
                }
            }
            // Update location state
            this.locationState = {
                currentLat: lat,
                currentLng: lng,
                direction,
                heading,
                nearbyBuildings,
                facingBuilding,
                lastUpdate: Date.now()
            };
            return this.locationState;
        }
        catch (error) {
            console.error('❌ Error updating location and direction:', error);
            throw error;
        }
    }
    getCurrentLocationState() {
        return this.locationState;
    }
    getFacingBuilding() {
        return this.locationState?.facingBuilding || null;
    }
    getNearbyBuildings() {
        return this.locationState?.nearbyBuildings || [];
    }
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            lastUpdate: this.locationState?.lastUpdate || null
        };
    }
    async close() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
        }
    }
    // Helper method to convert heading to CardinalDirection for compatibility
    static headingToCardinalDirection(heading) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(heading / 45) % 8;
        return directions[index];
    }
}
exports.BuildingLocationService = BuildingLocationService;
//# sourceMappingURL=buildingLocationService.js.map