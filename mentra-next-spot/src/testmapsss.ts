import { getDirections, reverseGeocode, geocode } from '../../src/mapsss';

async function runTests() {
    // You must replace 'YOUR_API_KEY_HERE' in maps.ts with a valid Google Maps API key
    // if (typeof GOOGLE_API_KEY === 'undefined' || GOOGLE_API_KEY === 'YOUR_API_KEY_HERE') {
    //     console.error("Please replace 'YOUR_API_KEY_HERE' in maps.ts with your actual API key.");
    //     return;
    // }

    const userLat = 42.3601;
    const userLon = -71.0917;
    const destination = "library";

    try {
        console.log("--- Testing getDirections ---");
        const directions = await getDirections(userLat, userLon, destination);
        console.log("Directions:", directions);

        console.log("\n--- Testing reverseGeocode ---");
        const address = await reverseGeocode(userLat, userLon);
        console.log("Address:", address);

        console.log("\n--- Testing geocode ---");
        const coords = await geocode("Massachusetts Institute of Technology");
        console.log("MIT Coordinates:", coords);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTests();