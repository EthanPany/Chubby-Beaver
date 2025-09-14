import { MongoClient, Db, Collection } from 'mongodb';

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

let client: MongoClient;
let db: Db;
let buildingsCollection: Collection<Building>;

export async function connectToDatabase(connectionString?: string): Promise<void> {
  let mongoUrl: string;

  if (connectionString) {
    mongoUrl = connectionString;
  } else if (process.env.MONGODB_URI) {
    mongoUrl = process.env.MONGODB_URI;
  } else {
    // Build connection string from individual components
    const username = process.env.MONGODB_USERNAME || 'pyy122759996_db_user';
    const password = process.env.MONGODB_PASSWORD || 'rDrJ3vfjmwbJaCr8';
    const hostname = process.env.MONGODB_HOSTNAME || 'hackmit.kjtqepn.mongodb.net';
    const dbName = process.env.DB_NAME || 'mit_tour_guide';

    mongoUrl = `mongodb+srv://${username}:${password}@${hostname}/${dbName}?retryWrites=true&w=majority`;
  }

  const dbName = process.env.DB_NAME || 'mit_tour_guide';

  client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  buildingsCollection = db.collection<Building>('buildings');
}

function calculateEuclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const latDiff = lat1 - lat2;
  const lngDiff = lng1 - lng2;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

export async function findClosestBuildings(lat: number, lng: number, k: number = 10): Promise<Building[]> {
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

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
}
