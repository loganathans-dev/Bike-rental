import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RoutingMachine = ({ shopCoords, customerCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!shopCoords || !customerCoords) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(shopCoords[0], shopCoords[1]),
        L.latLng(customerCoords[0], customerCoords[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      show: false, // Hide the itinerary panel
      createMarker: () => null // Use standard markers instead of routing machine's default markers
    }).addTo(map);

    const routingContainer = routingControl.getContainer();
    if (routingContainer) {
      routingContainer.style.display = 'none';
    }

    return () => map.removeControl(routingControl);
  }, [map, shopCoords, customerCoords]);

  return null;
};

// Geocoding helper using Nominatim (OpenStreetMap)
const geocodeAddress = async (address) => {
  if (!address) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

const LocationMap = ({ shopAddress, customerAddress, shopCoords: propShopCoords, customerCoords: propCustomerCoords }) => {
  const [shopCoords, setShopCoords] = useState(propShopCoords || null);
  const [customerCoords, setCustomerCoords] = useState(propCustomerCoords || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // If props coordinates are provided, just use them directly
    if (propShopCoords && propCustomerCoords) {
      setShopCoords(propShopCoords);
      setCustomerCoords(propCustomerCoords);
      setLoading(false);
      return;
    }

    const fetchCoords = async () => {
      setLoading(true);
      
      let sCoords = propShopCoords;
      if (!sCoords && shopAddress) {
        sCoords = await geocodeAddress(shopAddress);
        if (sCoords && !propCustomerCoords && customerAddress) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
      }

      let cCoords = propCustomerCoords;
      if (!cCoords && customerAddress) {
        cCoords = await geocodeAddress(customerAddress);
      }
      
      if (isMounted) {
        setShopCoords(sCoords);
        setCustomerCoords(cCoords);
        setLoading(false);
      }
    };
    
    fetchCoords();
    
    return () => { isMounted = false; };
  }, [shopAddress, customerAddress, propShopCoords, propCustomerCoords]);

  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm animate-pulse">Loading map & routes...</p>
        </div>
      </div>
    );
  }

  if (!shopCoords && !customerCoords) {
    return (
      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 text-sm">Could not find exact coordinates for the provided locations.</p>
      </div>
    );
  }

  // Default center: shop > customer > India
  const center = shopCoords || customerCoords || [20.5937, 78.9629]; 

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 z-0 relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {shopCoords && (
          <Marker position={shopCoords}>
            <Popup>
              <div className="text-sm font-bold text-gray-800">Shop Location</div>
              <div className="text-xs text-gray-600 mt-1">{shopAddress}</div>
            </Popup>
          </Marker>
        )}
        
        {customerCoords && (
          <Marker position={customerCoords}>
            <Popup>
              <div className="text-sm font-bold text-blue-800">Customer Location</div>
              <div className="text-xs text-blue-600 mt-1">{customerAddress}</div>
            </Popup>
          </Marker>
        )}
        
        {shopCoords && customerCoords && (
          <RoutingMachine shopCoords={shopCoords} customerCoords={customerCoords} />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
