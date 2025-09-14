"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.findClosestBuildings = findClosestBuildings;
exports.closeDatabase = closeDatabase;
const mongodb_1 = require("mongodb");
let client;
let db;
let buildingsCollection;
async function connectToDatabase(connectionString) {
    let mongoUrl;
    if (connectionString) {
        mongoUrl = connectionString;
    }
    else if (process.env.MONGODB_URI) {
        mongoUrl = process.env.MONGODB_URI;
    }
    else {
        // Build connection string from individual components
        const username = process.env.MONGODB_USERNAME || 'pyy122759996_db_user';
        const password = process.env.MONGODB_PASSWORD || 'rDrJ3vfjmwbJaCr8';
        const hostname = process.env.MONGODB_HOSTNAME || 'hackmit.kjtqepn.mongodb.net';
        const dbName = process.env.DB_NAME || 'mit_tour_guide';
        mongoUrl = `mongodb+srv://${username}:${password}@${hostname}/${dbName}?retryWrites=true&w=majority`;
    }
    const dbName = process.env.DB_NAME || 'mit_tour_guide';
    client = new mongodb_1.MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    buildingsCollection = db.collection('buildings');
}
function calculateEuclideanDistance(lat1, lng1, lat2, lng2) {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}
async function findClosestBuildings(lat, lng, k = 10) {
    if (!buildingsCollection) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    const allBuildings = await buildingsCollection.find({}).toArray();
    const buildingsWithDistance = allBuildings.map(building => ({
        ...building,
        distance: calculateEuclideanDistance(lat, lng, building.coordinates.lat, building.coordinates.lng)
    }));
    buildingsWithDistance.sort((a, b) => a.distance - b.distance);
    return buildingsWithDistance.slice(0, k).map(({ distance, ...building }) => building);
}
async function closeDatabase() {
    if (client) {
        await client.close();
    }
}
//# sourceMappingURL=buildingService.js.map