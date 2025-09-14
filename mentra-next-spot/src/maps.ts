// CampusGuideClient.ts
// Adapter for the Python Flask backend. Provides async functions for API endpoints.

const defaultBaseUrl = "http://127.0.0.1:5001"; // change per user

export async function getDirections(
  latitude: number,
  longitude: number,
  previousLatitude: number,
  previousLongitude: number,
  destination: string,
  baseUrl: string = defaultBaseUrl
): Promise<string> {
  const payload = { latitude, longitude, previous_latitude: previousLatitude, previous_longitude: previousLongitude, destination };
  try {
    const response = await fetch(`${baseUrl}/get_directions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  baseUrl: string = defaultBaseUrl
): Promise<string> {
  const payload = { latitude, longitude };
  try {
    const response = await fetch(`${baseUrl}/reverse_geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function geocode(
  address: string,
  baseUrl: string = defaultBaseUrl
): Promise<{ latitude: number; longitude: number }> {
  const payload = { address };
  try {
    const response = await fetch(`${baseUrl}/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

// Example of the static map if you want it later:
// export async function getStaticMapUrl(
//   latitude: number,
//   longitude: number,
//   destination: string,
//   baseUrl: string = defaultBaseUrl
// ): Promise<string> {
//   const payload = { latitude, longitude, destination };
//   try {
//     const response = await fetch(`${baseUrl}/get_static_map`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.map_url;
//   } catch (error: any) {
//     console.error("Error getting static map URL:", error);
//     throw new Error(`Failed to get static map URL: ${error.message}`);
//   }
// }
