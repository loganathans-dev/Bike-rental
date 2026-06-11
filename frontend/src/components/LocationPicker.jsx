import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

const MapEvents = ({ setPosition, handleLocationChange }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      handleLocationChange(e.latlng);
    },
  });
  return null;
};

const LocationPicker = ({ initialPosition, onLocationSelect, onAddressSelect }) => {
  // Default to a central location (e.g., center of India) if no initial position
  const defaultPos = { lat: 20.5937, lng: 78.9629 };
  const [position, setPosition] = useState(initialPosition || defaultPos);
  const markerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      setPosition(initialPosition);
    }
  }, [initialPosition?.lat, initialPosition?.lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name && onAddressSelect) {
        onAddressSelect({
          fullAddress: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || '',
          state: data.address?.state || '',
          pincode: data.address?.postcode || ''
        });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  const handleLocationChange = (newPos) => {
    if (onLocationSelect) onLocationSelect(newPos);
    reverseGeocode(newPos.lat, newPos.lng);
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          handleLocationChange(newPos);
        }
      },
    }),
    [onLocationSelect, onAddressSelect],
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          setSuggestions(data);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSuggestion = (place) => {
    const newPos = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    setPosition(newPos);
    setSearchQuery(place.display_name);
    setShowDropdown(false);
    
    if (onLocationSelect) onLocationSelect(newPos);
    if (onAddressSelect) {
      // Trigger a reverse geocode of this exact point to get structured address data
      reverseGeocode(newPos.lat, newPos.lng);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative">
      <div className="relative w-full" style={{ zIndex: 1000 }}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search location or drag pin on map..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(suggestions.length > 0) setShowDropdown(true); }}
            className="w-full pl-9 p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
          />
          {isSearching && <Loader2 className="absolute right-3 w-4 h-4 text-purple-500 animate-spin" />}
        </div>
        
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
            {suggestions.map((place, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(place)}
                className="w-full text-left px-4 py-3 text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 border-b border-gray-50 last:border-0 transition-colors"
              >
                {place.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 relative z-0">
        <MapContainer center={position} zoom={initialPosition?.lat ? 14 : 5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater position={position} />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
          >
            <Popup minWidth={90}>
              <span className="text-sm font-semibold">Exact Pin Location</span>
            </Popup>
          </Marker>
          <MapEvents setPosition={setPosition} handleLocationChange={handleLocationChange} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;
