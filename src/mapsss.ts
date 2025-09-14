// WARNING: This code exposes your API key and is not recommended for production.
// It is a security vulnerability because anyone can view your key in the source code.



const DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";
const GEOCODE_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const GOOGLE_API_KEY = process.env.GOOGLEAPI; // <-- THIS IS A SECURITY VULNERABILITY
const CAMPUS_POIS = {
  "library": { latitude: 42.3653, longitude: -71.0906 },
  "cafe": { latitude: 42.3622, longitude: -71.0898 },
  "gym": { latitude: 42.3592, longitude: -71.0924 },
  "main_gate": { latitude: 42.3597, longitude: -71.0928 },
  "Great Dome": { latitude: 42.3597, longitude: -71.0921 }
};
// 3 functions: getDirections, go from #s to address, address to #s
// need to get location, using mentra api!!!
/**
 * Gets a single direction instruction for a walking route between two points.
 * @param latitude The user's current latitude.
 * @param longitude The user's current longitude.
 * @param destination The key for the destination POI (e.g., "library", "cafe").
 * @returns A string containing the first direction instruction.
 */
export async function getDirections(
  latitude: number,
  longitude: number,
  destination: keyof typeof CAMPUS_POIS
): Promise<string> {
  const destCoords = CAMPUS_POIS[destination];
  if (!destCoords) {
    throw new Error("Destination not found.");
  }

  const origin = `${latitude},${longitude}`;
  const destString = `${destCoords.latitude},${destCoords.longitude}`;

  const requestUrl = `${DIRECTIONS_API_URL}?origin=${origin}&destination=${destString}&mode=walking&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(requestUrl);
    const data = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const firstStep = data.routes[0].legs[0].steps[0];
      console.log(firstStep);
      const htmlInstruction = firstStep.html_instructions;
      const distance = firstStep.distance.text;

      // Regular expression to extract the main instruction and the parenthetical details
      const match = htmlInstruction.match(/<b>(.*?)<\/b>(.*)/);
      let instructionText = "Head straight"; // Default instruction
      if (match && match.length > 2) {
          const boldText = match[1];
          const divText = match[2].replace(/<[^>]*>?/gm, '').trim();
          instructionText = `Head ${boldText} (${divText.toLowerCase()})`;
      } else {
          // If the simple regex fails, fall back to stripping all tags
          instructionText = htmlInstruction.replace(/<[^>]*>?/gm, '').trim();
      }
      return `${instructionText} for ${distance}.`;
    } else {
      throw new Error(data.error_message || "API error: No valid route found.");
    }
  } catch (error: any) {
    console.error("Error with direct API call for directions:", error);
    throw new Error(`Failed to get directions: ${error}`);
  }
}

/**
 * Converts latitude and longitude coordinates into a human-readable address.
 * @param latitude The latitude coordinate.
 * @param longitude The longitude coordinate.
 * @returns The formatted address as a string.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const requestUrl = `${GEOCODE_API_URL}?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(requestUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      // Find a more specific place name if available, otherwise use the formatted address
      const placeName = data.results[0].address_components.find(
        (component: any) => component.types.includes('point_of_interest') || component.types.includes('establishment')
      )?.long_name;

      if (placeName) {
        return placeName;
      }
      return data.results[0].formatted_address;
    } else {
      throw new Error(data.error_message || "API error: No address found.");
    }
  } catch (error: any) {
    console.error("Error with direct API call for reverse geocode:", error);
    throw new Error(`Failed to perform reverse geocode: ${error}`);
  }
}

/**
 * Converts a street address into its corresponding latitude and longitude.
 * @param address The address string to geocode.
 * @returns An object containing the latitude and longitude.
 */
export async function geocode(
  address: string
): Promise<{ latitude: number, longitude: number }> {
  const requestUrl = `${GEOCODE_API_URL}?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(requestUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    } else {
      throw new Error(data.error_message || "API error: No coordinates found.");
    }
  } catch (error: any) {
    console.error("Error with direct API call for geocode:", error);
    throw new Error(`Failed to perform geocode: ${error}`);
  }
}

export async function textDirections(
  latitude: number,
  longitude: number,
  destination: keyof typeof CAMPUS_POIS
): Promise<string> {

  const dir = getDirections(latitude, longitude, destination)
  return `Going to ${destination}, Directions: ${dir}`

}

export async function textDescription(
  destination: keyof typeof CAMPUS_POIS
): Promise<string> {

  
  return `Here is ${destination}, `

}

