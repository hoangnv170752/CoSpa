import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Box } from '@mui/material';
import AnimatedButton from '../components/AnimatedButton';
import RippleMarker from '../components/RippleMarker';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const Dashboard: React.FC = () => {
  const defaultCoordinates: [number, number] = [21.0285, 105.8542];
  const [userLocation, setUserLocation] = useState<[number, number]>(defaultCoordinates);

  useEffect(() => {
    const savedLat = localStorage.getItem('userLat');
    const savedLng = localStorage.getItem('userLng');
    
    if (savedLat && savedLng) {
      setUserLocation([parseFloat(savedLat), parseFloat(savedLng)]);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: [number, number] = [
              position.coords.latitude,
              position.coords.longitude
            ];
            setUserLocation(newLocation);
            localStorage.setItem('userLat', position.coords.latitude.toString());
            localStorage.setItem('userLng', position.coords.longitude.toString());
            console.log('Location granted:', position.coords);
          },
          (error) => {
            console.log('Location permission denied or error:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    }
  }, []);

  const handleFindAroundMe = () => {
    console.log('Finding places around me...');
  };

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RippleMarker 
          position={userLocation}
          popupText="Vị trí của bạn"
        />
      </MapContainer>

      <Box sx={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}>
        <AnimatedButton
          defaultText="Tìm quanh tôi"
          sentText="Đã tìm thấy!"
          icon={<MyLocationIcon />}
          onClick={handleFindAroundMe}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
