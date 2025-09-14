import { MongoClient, Db, Collection } from 'mongodb';
import { CardinalDirection } from '../types/motion';

interface BuildingCoordinates {
  lat: number;
  lng: number;
}

interface Building {
  _id: string;
  name: string;
  address: string;
  coordinates: BuildingCoordinates;
  image_url: string | null;
  description: string;
  related_departments: string[];
  related_buildings: string[];
  source_url: string;
  created_at: string;
  building_number: string;
  alternate_names: string[];
  building_type: string;
  year_built: number;
  architect: string;
  raw_data: Record<string, any>;
}

interface LocationState {
  currentLat: number;
  currentLng: number;
  direction: CardinalDirection;
  heading: number;
  nearbyBuildings: Building[];
  facingBuilding: Building | null;
  lastUpdate: number;
}

export class BuildingLocationService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private buildingsCollection: Collection<Building> | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private locationState: LocationState | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startConnectionMonitor();
  }

  private async connectToDatabase(): Promise<void> {
    try {
      const username = process.env.MONGODB_USERNAME || 'pyy122759996_db_user';
      const password = process.env.MONGODB_PASSWORD || 'rDrJ3vfjmwbJaCr8';
      const hostname = process.env.MONGODB_HOSTNAME || 'hackmit.kjtqepn.mongodb.net';
      const dbName = process.env.DB_NAME || 'mit_tour_guide';

      const mongoUrl = `mongodb+srv://${username}:${password}@${hostname}/?retryWrites=true&w=majority`;

      this.client = new MongoClient(mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.buildingsCollection = this.db.collection<Building>('buildings');

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private startConnectionMonitor(): void {
    this.connectionCheckInterval = setInterval(async () => {
      if (!this.isConnected) {
        await this.attemptReconnection();
      }
    }, this.reconnectInterval);
  }

  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting database reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    try {
      await this.connectToDatabase();
    } catch (error) {
      console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
    }
  }

  public async initialize(): Promise<void> {
    try {
      await this.connectToDatabase();
    } catch (error) {
      console.error('❌ Initial database connection failed, will retry automatically');
    }
  }

  private calculateEuclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = Math.atan2(y, x);
    return (bearing * 180 / Math.PI + 360) % 360; // Convert to degrees and normalize
  }

  private isWithinDirectionCone(targetBearing: number, currentHeading: number, coneWidth: number = 45): boolean {
    const diff = Math.abs(targetBearing - currentHeading);
    const normalizedDiff = Math.min(diff, 360 - diff);
    return normalizedDiff <= coneWidth / 2;
  }

  public async findClosestBuildings(lat: number, lng: number, k: number = 10, heading?: number): Promise<Building[]> {
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
      } else {
        // Use simple distance-based ranking when no heading provided
        const buildingsWithDistance = allBuildings.map(building => ({
          ...building,
          distance: this.calculateEuclideanDistance(lat, lng, building.coordinates.lat, building.coordinates.lng)
        }));

        buildingsWithDistance.sort((a, b) => a.distance - b.distance);
        return buildingsWithDistance.slice(0, k).map(({ distance, ...building }) => building);
      }
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Database query failed: ${error}`);
    }
  }

  private calculateAngleDifference(heading: number, bearing: number): number {
    let diff = bearing - heading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  public async updateLocationAndDirection(
    lat: number,
    lng: number,
    direction: CardinalDirection,
    heading: number,
    k: number = 10
  ): Promise<LocationState> {
    try {
      // Get nearby buildings
      const nearbyBuildings = await this.findClosestBuildings(lat, lng, k);

      // Find building the user is facing
      let facingBuilding: Building | null = null;

      for (const building of nearbyBuildings) {
        const bearingToBuilding = this.calculateBearing(
          lat, lng,
          building.coordinates.lat, building.coordinates.lng
        );

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
    } catch (error) {
      console.error('❌ Error updating location and direction:', error);
      throw error;
    }
  }

  public getCurrentLocationState(): LocationState | null {
    return this.locationState;
  }

  public getFacingBuilding(): Building | null {
    return this.locationState?.facingBuilding || null;
  }

  public getNearbyBuildings(): Building[] {
    return this.locationState?.nearbyBuildings || [];
  }

  public getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    lastUpdate: number | null;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastUpdate: this.locationState?.lastUpdate || null
    };
  }

  public async close(): Promise<void> {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  // Helper method to convert heading to CardinalDirection for compatibility
  public static headingToCardinalDirection(heading: number): CardinalDirection {
    const directions: CardinalDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }
}