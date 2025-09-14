import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { WSServer } from './websocket/wsServer';
import { BuildingLocationService } from './services/buildingLocationService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WSServer(server);

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/devices', (req, res) => {
  const devices = wsServer.getConnectedDevices();
  res.json({
    count: devices.length,
    devices: devices
  });
});

app.get('/api/devices/:deviceId/stats', (req, res) => {
  const { deviceId } = req.params;
  const stats = wsServer.getDeviceStats(deviceId);

  if (!stats) {
    return res.status(404).json({
      error: 'Device not found'
    });
  }

  res.json(stats);
});

app.get('/api/location/status', (req, res) => {
  const locationService = wsServer.getBuildingLocationService();
  if (locationService) {
    const status = locationService.getConnectionStatus();
    const state = locationService.getCurrentLocationState();
    res.json({
      database: status,
      currentState: state
    });
  } else {
    res.status(503).json({ error: 'Building location service not available' });
  }
});

app.get('/api/location/facing', (req, res) => {
  const locationService = wsServer.getBuildingLocationService();
  if (locationService) {
    const facingBuilding = locationService.getFacingBuilding();
    res.json({
      facingBuilding: facingBuilding,
      timestamp: Date.now()
    });
  } else {
    res.status(503).json({ error: 'Building location service not available' });
  }
});

app.get('/api/location/nearby', (req, res) => {
  const locationService = wsServer.getBuildingLocationService();
  if (locationService) {
    const nearbyBuildings = locationService.getNearbyBuildings();
    res.json({
      buildings: nearbyBuildings,
      count: nearbyBuildings.length,
      timestamp: Date.now()
    });
  } else {
    res.status(503).json({ error: 'Building location service not available' });
  }
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'AirPods Gyro Server with Building Location',
    version: '1.0.0',
    websocket: {
      url: `ws://localhost:${PORT}`,
      protocol: 'JSON',
      messageTypes: ['motion', 'calibrate', 'reset', 'getStats', 'ping', 'updateLocation']
    },
    api: {
      endpoints: [
        'GET /health',
        'GET /api/devices',
        'GET /api/devices/:deviceId/stats',
        'GET /api/location/status',
        'GET /api/location/facing',
        'GET /api/location/nearby',
        'GET /api/info'
      ]
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     AirPods Gyro Server Started       ║
╠════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}  ║
║  WebSocket:    ws://localhost:${PORT}    ║
╚════════════════════════════════════════╝

Ready to receive AirPods motion data...
  `);

  // Start testing loop - print closest buildings every 5 seconds
  startTestingLoop();
});

function startTestingLoop() {
  // Use MIT coordinates for testing
  const testLat = 42.3601;
  const testLng = -71.0942;
  let testHeading = 0; // Start facing North

  setInterval(async () => {
    try {
      const buildingService = wsServer.getBuildingLocationService();

      if (!buildingService) {
        console.log('❌ Building service not available');
        return;
      }

      // Rotate heading for testing (simulate user turning)
      testHeading = (testHeading + 30) % 360; // Turn 30 degrees every 5 seconds

      // Update the building service location state (this is what the API uses)
      const testDirection = BuildingLocationService.headingToCardinalDirection(testHeading);
      await buildingService.updateLocationAndDirection(testLat, testLng, testDirection, testHeading, 10);

      // Get buildings with angle-prioritized ranking for display purposes
      const nearbyBuildings = await buildingService.findClosestBuildings(testLat, testLng, 10, testHeading);

      console.log('\n' + '═'.repeat(80));
      console.log(`🧭 TEST LOCATION: ${testLat}, ${testLng} | FACING: ${testHeading}°`);
      console.log('═'.repeat(80));

      if (nearbyBuildings.length === 0) {
        console.log('❌ No buildings found');
        return;
      }

      // Calculate distance and angle for each building with custom ranking
      const buildingsWithMetrics = nearbyBuildings.map((building) => {
        const distance = calculateEuclideanDistance(testLat, testLng, building.coordinates.lat, building.coordinates.lng);
        const distanceMeters = distance * 111320; // Convert to approximate meters
        const bearing = calculateBearing(testLat, testLng, building.coordinates.lat, building.coordinates.lng);
        const angleDifference = calculateAngleDifference(testHeading, bearing);

        // Calculate ranking score (lower is better)
        const angleScore = Math.abs(angleDifference); // 0-180, lower is better

        // Distance weight: no penalty within 150m, linear decrease beyond
        let distanceWeight = 1.0;
        if (distanceMeters > 150) {
          // Decrease weight linearly - at 950m, weight = 0.2
          distanceWeight = Math.max(0.2, 1.0 - ((distanceMeters - 150) / 800));
        }

        // Final score: prioritize angle, apply distance weight
        // Lower score = better ranking
        const rankingScore = angleScore / distanceWeight;

        return {
          name: building.name,
          buildingNumber: building.building_number,
          distance: distance,
          distanceMeters: distanceMeters,
          bearing: bearing,
          angleDifference: angleDifference,
          angleScore: angleScore,
          distanceWeight: distanceWeight,
          rankingScore: rankingScore,
          isFacing: Math.abs(angleDifference) <= 22.5, // Within 45-degree cone
          coordinates: building.coordinates,
          rank: 0 // Will be set later
        };
      });

      // Sort by ranking score (lower is better) and add rank
      buildingsWithMetrics.sort((a, b) => a.rankingScore - b.rankingScore);
      buildingsWithMetrics.forEach((building, index) => {
        building.rank = index + 1;
      });

      // Print top 5 ranked buildings
      buildingsWithMetrics.slice(0, 5).forEach(building => {
        const distanceM = building.distanceMeters.toFixed(0);
        const facingIndicator = building.isFacing ? '👁️ ' : '   ';
        const weightIndicator = building.distanceWeight < 1.0 ? '⚖️ ' : '';

        console.log(`${facingIndicator}${weightIndicator}${building.rank}. ${building.name} (${building.buildingNumber})`);
        console.log(`   📏 Distance: ${distanceM}m | 🧭 Bearing: ${building.bearing.toFixed(1)}° | ↔️  Angle Diff: ${building.angleDifference.toFixed(1)}°`);
        console.log(`   🎯 Score: ${building.rankingScore.toFixed(2)} | ⚖️  Weight: ${building.distanceWeight.toFixed(2)}`);
        console.log(`   📍 Coords: ${building.coordinates.lat}, ${building.coordinates.lng}`);
        console.log('');
      });

      // Show which building we're facing
      const facingBuilding = buildingsWithMetrics.find(b => b.isFacing);
      if (facingBuilding) {
        console.log(`🎯 FACING: ${facingBuilding.name} (Rank #${facingBuilding.rank})`);
      } else {
        console.log('🎯 FACING: No building in view cone');
      }

      console.log('═'.repeat(80) + '\n');

    } catch (error) {
      console.error('❌ Testing loop error:', error);
    }
  }, 5000);
}

// Helper functions for distance and angle calculations
function calculateEuclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const latDiff = lat1 - lat2;
  const lngDiff = lng1 - lng2;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360; // Convert to degrees and normalize
}

function calculateAngleDifference(heading: number, bearing: number): number {
  let diff = bearing - heading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await wsServer.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await wsServer.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});