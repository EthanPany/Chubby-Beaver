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
export declare function connectToDatabase(connectionString?: string): Promise<void>;
export declare function findClosestBuildings(lat: number, lng: number, k?: number): Promise<Building[]>;
export declare function closeDatabase(): Promise<void>;
export {};
//# sourceMappingURL=buildingService.d.ts.map