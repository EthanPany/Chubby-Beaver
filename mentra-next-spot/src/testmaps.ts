import { getDirections, reverseGeocode, geocode } from "./maps";

async function test() {
  const dir = await getDirections(42.36, -71.09, 42.35, -71.1, "library");
  console.log("Directions:", dir);

  const addr = await reverseGeocode(42.36, -71.09);
  console.log("Address:", addr);

  const coords = await geocode("77 Massachusetts Ave, Cambridge, MA");
  console.log("Coordinates:", coords);
}

test()