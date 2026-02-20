import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData, Coordinates } from '../types';
import { LocationCard } from './LocationCard';

// Fix for default Leaflet markers in React
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker for "Sponsored" or selected locations
const SponsoredIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #f59e0b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

interface MapComponentProps {
  locations: LocationData[];
  center: Coordinates;
  onLocationSelect: (loc: LocationData) => void;
  onSaveLocation?: (locationId: string) => void;
}

// Helper to update map view when props change
const MapUpdater: React.FC<{ center: Coordinates; locations: LocationData[] }> = ({ center, locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      // Nếu có locations, fit bounds để hiển thị tất cả markers
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(l => [l.coordinates.lat, l.coordinates.lng]));
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.5 });
      } else {
        // Nếu không có locations, chỉ center vào vị trí hiện tại
        map.flyTo([center.lat, center.lng], 13, { duration: 1.5 });
      }
    } catch (error) {
      console.error('MapUpdater error:', error);
      // Fallback: setView không có animation
      map.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng, locations.length, map]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ locations, center, onLocationSelect, onSaveLocation }) => {
  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={13} 
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} locations={locations} />

      <Marker position={[center.lat, center.lng]} icon={L.divIcon({
        className: 'user-marker',
        html: `<div class="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg relative"><div class="absolute -inset-2 bg-indigo-600 rounded-full opacity-20 animate-ping"></div></div>`,
        iconSize: [16, 16]
      })}>
        <Popup>Bạn đang ở đây</Popup>
      </Marker>

      {locations.map((loc) => (
        <Marker 
          key={loc.id} 
          position={[loc.coordinates.lat, loc.coordinates.lng]}
          icon={loc.isSponsored ? SponsoredIcon : DefaultIcon}
          eventHandlers={{
            click: () => onLocationSelect(loc)
          }}
        >
          <Popup className="custom-popup p-0 rounded-lg overflow-hidden border-0">
             <LocationCard 
               location={loc} 
               onClick={() => onLocationSelect(loc)} 
               compact 
               onSave={onSaveLocation}
             />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
