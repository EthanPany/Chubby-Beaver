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
export declare class BuildingLocationService {
    private client;
    private db;
    private buildingsCollection;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    private locationState;
    private connectionCheckInterval;
    constructor();
    private connectToDatabase;
    private startConnectionMonitor;
    private attemptReconnection;
    initialize(): Promise<void>;
    private calculateEuclideanDistance;
    private calculateBearing;
    private isWithinDirectionCone;
    findClosestBuildings(lat: number, lng: number, k?: number, heading?: number): Promise<Building[]>;
    private calculateAngleDifference;
    updateLocationAndDirection(lat: number, lng: number, direction: CardinalDirection, heading: number, k?: number): Promise<LocationState>;
    getCurrentLocationState(): LocationState | null;
    getFacingBuilding(): Building | null;
    getNearbyBuildings(): Building[];
    getConnectionStatus(): {
        connected: boolean;
        reconnectAttempts: number;
        lastUpdate: number | null;
    };
    close(): Promise<void>;
    static headingToCardinalDirection(heading: number): CardinalDirection;
}
export {};
//# sourceMappingURL=buildingLocationService.d.ts.map