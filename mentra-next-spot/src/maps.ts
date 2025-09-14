// This client acts as an adapter for the Python Flask backend.
// It provides a set of asynchronous functions to call the various API endpoints.

export class CampusGuideClient {
    // Replace this with the actual URL of your running Python Flask server.
    // This example uses the IP address from our previous conversation.
    private baseUrl: string = "http://127.0.0.1:5001"; // should change with user

    /**
     * Gets a single direction instruction for a walking route between two points.
     * @param latitude The user's current latitude.
     * @param longitude The user's current longitude.
     * @param previousLatitude The user's previous latitude.
     * @param previousLongitude The user's previous longitude.
     * @param destination The key for the destination POI (e.g., "library", "cafe").
     * @returns A string containing the first direction instruction.
     */
    public async getDirections(latitude: number, longitude: number, previousLatitude: number, previousLongitude: number, destination: string): Promise<string> {
        const payload = { latitude, longitude, previous_latitude: previousLatitude, previous_longitude: previousLongitude, destination };
        try {
            const response = await fetch(`${this.baseUrl}/get_directions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.message;
        } catch (error: any) {
            console.error("Error getting directions:", error);
            throw new Error(`Failed to get directions: ${error.message}`);
        }
    }

    /**
     * Converts latitude and longitude coordinates into a human-readable address.
     * @param latitude The latitude coordinate.
     * @param longitude The longitude coordinate.
     * @returns The formatted address as a string.
     */
    public async reverseGeocode(latitude: number, longitude: number): Promise<string> {
        const payload = { latitude, longitude };
        try {
            const response = await fetch(`${this.baseUrl}/reverse_geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.address;
        } catch (error: any) {
            console.error("Error with reverse geocode:", error);
            throw new Error(`Failed to perform reverse geocode: ${error.message}`);
        }
    }

    /**
     * Converts a street address into its corresponding latitude and longitude.
     * @param address The address string to geocode.
     * @returns An object containing the latitude and longitude.
     */
    public async geocode(address: string): Promise<{ latitude: number, longitude: number }> {
        const payload = { address };
        try {
            const response = await fetch(`${this.baseUrl}/geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { latitude: data.latitude, longitude: data.longitude };
        } catch (error: any) {
            console.error("Error with geocode:", error);
            throw new Error(`Failed to perform geocode: ${error.message}`);
        }
    }

    /**
     * Gets a URL for a static map image showing the user and a destination.
     * @param latitude The user's current latitude.
     * @param longitude The user's current longitude.
     * @param destination The key for the destination POI.
     * @returns A string containing the URL for the static map image.
     */
    // public async getStaticMapUrl(latitude: number, longitude: number, destination: string): Promise<string> {
    //     const payload = { latitude, longitude, destination };
    //     try {
    //         const response = await fetch(`${this.baseUrl}/get_static_map`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(payload)
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         return data.map_url;
    //     } catch (error: any) {
    //         console.error("Error getting static map URL:", error);
    //         throw new Error(`Failed to get static map URL: ${error.message}`);
    //     }
    // }
}
module.exports = { CampusGuideClient };
