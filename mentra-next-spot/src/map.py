import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import googlemaps
import os
import math

app = Flask(__name__)
CORS(app)

# MUST RUN FIRST TO SET OF FLASK
# Use a dictionary to store the campus points of interest (POIs)
# These are fixed locations on your campus map.
CAMPUS_POIS = {
    "library": {"latitude": 42.3653, "longitude": -71.0906},
    "cafe": {"latitude": 42.3622, "longitude": -71.0898},
    "gym": {"latitude": 42.3592, "longitude": -71.0924},
    "main_gate": {"latitude": 42.3597, "longitude": -71.0928}
}

# Use your actual API key here.
# Make sure the Geocoding API and Directions API are enabled in your Google Cloud Console.
gmaps_api_key = ""
gmaps = googlemaps.Client(key=gmaps_api_key)

def calculate_bearing(lat1, lon1, lat2, lon2):
    """
    Calculates the compass bearing (in degrees) from point 1 to point 2.
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    d_lon = lon2 - lon1
    
    y = math.sin(d_lon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(d_lon)
    
    bearing = math.atan2(y, x)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return bearing

@app.route('/get_directions', methods=['POST'])
def get_directions():
    """
    This endpoint calculates a route from the user's current location to a campus POI
    and returns the first instruction of the route.
    """
    try:
        data = request.get_json()
        user_lat = data['latitude']
        user_lon = data['longitude']
        destination_key = data['destination']

        print(f"Request received for directions to {destination_key} from IP: {request.remote_addr}")

        if destination_key not in CAMPUS_POIS:
            return jsonify({"error": "Destination not found."}), 400

        dest_lat = CAMPUS_POIS[destination_key]['latitude']
        dest_lon = CAMPUS_POIS[destination_key]['longitude']

        print(f"Calculating directions from ({user_lat}, {user_lon}) to {destination_key}...")

        # Call the Google Maps Directions API
        directions_result = gmaps.directions(
            (user_lat, user_lon),
            (dest_lat, dest_lon),
            mode="walking"
        )
        
        # Check if directions were found
        if not directions_result or not directions_result[0]['legs'][0]['steps']:
            return jsonify({"error": "No walking directions found for this route."}), 404

        # Extract the first step of the first leg of the journey
        first_step = directions_result[0]['legs'][0]['steps'][0]
        instruction = first_step['html_instructions']
        distance = first_step['distance']['text']

        # Clean up the HTML instructions for display
        clean_instruction = instruction.replace("<b>", "").replace("</b>", "")

        message = f"{clean_instruction} for {distance}."
        print(f"Successfully calculated directions: {message}")
        
        return jsonify({"message": message})

    except Exception as e:
        print(f"Error during directions API call: {e}")
        return jsonify({"error": f"Directions API Error: {str(e)}"}), 500


@app.route('/reverse_geocode', methods=['POST'])
def reverse_geocode():
    """
    This endpoint uses the Google Maps Geocoding API to convert coordinates into a human-readable address.
    It now attempts to extract and display the place name before the address.
    """
    try:
        data = request.get_json()
        lat = data['latitude']
        lon = data['longitude']

        print(f"Attempting reverse geocode for coordinates: ({lat}, {lon})")

        # Use the Google Maps Geocoding API to get the address
        geocode_result = gmaps.reverse_geocode((lat, lon))

        if geocode_result:
            formatted_address = geocode_result[0]['formatted_address']
            
            # Look for a more specific place name in the address components
            place_name = None
            for component in geocode_result[0]['address_components']:
                if 'point_of_interest' in component['types'] or 'establishment' in component['types'] or 'named_place' in component['types']:
                    place_name = component['long_name']
                    break
            
            if place_name:
                address_string = place_name
            else:
                address_string = formatted_address

            print(f"Successfully reverse geocoded to: {address_string}")
            return jsonify({"address": address_string})
        else:
            return jsonify({"error": "No address found for these coordinates."}), 404
            
    except Exception as e:
        print(f"Error during reverse geocode: {e}")
        return jsonify({"error": f"Google Maps API Error: {str(e)}"}), 500


@app.route('/geocode', methods=['POST'])
def geocode():
    """
    This endpoint converts a street address into its corresponding latitude and longitude.
    """
    try:
        data = request.get_json()
        address = data['address']

        print(f"Attempting to geocode address: {address}")

        # Use the Google Maps Geocoding API to get coordinates
        geocode_result = gmaps.geocode(address)

        if geocode_result:
            location = geocode_result[0]['geometry']['location']
            print(f"Successfully geocoded to: ({location['lat']}, {location['lng']})")
            return jsonify({"latitude": location['lat'], "longitude": location['lng']})
        else:
            return jsonify({"error": "No coordinates found for this address."}), 404
            
    except Exception as e:
        print(f"Error during geocode: {e}")
        return jsonify({"error": f"Geocoding API Error: {str(e)}"}), 500


@app.route('/get_static_map', methods=['POST'])
def get_static_map():
    """
    This endpoint generates a URL for a static map image.
    """
    try:
        data = request.get_json()
        user_lat = data['latitude']
        user_lon = data['longitude']
        destination_key = data['destination']

        if destination_key not in CAMPUS_POIS:
            return jsonify({"error": "Destination not found."}), 400

        dest_lat = CAMPUS_POIS[destination_key]['latitude']
        dest_lon = CAMPUS_POIS[destination_key]['longitude']

        # Define map parameters
        map_size = "600x400"
        map_zoom = 15
        markers = [
            # User's current location
            googlemaps.maps.Marker(location=(user_lat, user_lon), color='red', label='A'),
            # Destination location
            googlemaps.maps.Marker(location=(dest_lat, dest_lon), color='blue', label='B')
        ]

        # Generate the static map URL
        map_url = f"https://maps.googleapis.com/maps/api/staticmap?center={user_lat},{user_lon}&zoom={map_zoom}&size={map_size}&markers=color:red%7Clabel:A%7C{user_lat},{user_lon}&markers=color:blue%7Clabel:B%7C{dest_lat},{dest_lon}&key={gmaps_api_key}"
        
        return jsonify({"map_url": map_url})

    except Exception as e:
        return jsonify({"error": f"Static Maps API Error: {str(e)}"}), 500

if __name__ == '__main__':
    # To run this, save the file as app.py and run `flask run` in your terminal.
    # The default host is 127.0.0.1 and port 5000.
    app.run(host='127.0.0.1', port=5001)
