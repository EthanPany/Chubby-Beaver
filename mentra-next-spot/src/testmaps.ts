// This file is for testing the CampusGuideClient class.
// It is not part of the main application.

import { CampusGuideClient } from './maps';

async function runTests() {
    const client = new CampusGuideClient();
    const userLat = 42.3601;
    const userLon = -71.0917;
    const prevLat = 42.3602;
    const prevLon = -71.0916;
    const destination = "library";

    try {
        console.log("--- Testing Directions API ---");
        const directions = await client.getDirections(userLat, userLon, prevLat, prevLon, destination);
        console.log("Directions:", directions);

        console.log("\n--- Testing Reverse Geocode API ---");
        const address = await client.reverseGeocode(userLat, userLon);
        console.log("Address:", address);

        console.log("\n--- Testing Geocode API ---");
        const coords = await client.geocode("Massachusetts Institute of Technology");
        console.log("MIT Coordinates:", coords);

    } catch (error: any) {
        console.error("Test failed:", error);
    }
}

runTests();
