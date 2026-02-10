import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import './RippleMarker.css';

interface RippleMarkerProps {
  position: [number, number];
  popupText?: string;
}

const RippleIcon = () => (
  <div className="ripple-container">
    <div className="ripple"></div>
    <div className="ripple"></div>
    <div className="ripple"></div>
    <div className="ripple"></div>
    <div className="marker-pin"></div>
  </div>
);

const RippleMarker: React.FC<RippleMarkerProps> = ({ position, popupText }) => {
  const customIcon = L.divIcon({
    html: ReactDOMServer.renderToString(<RippleIcon />),
    className: 'custom-ripple-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={position} icon={customIcon}>
      {popupText && <Popup>{popupText}</Popup>}
    </Marker>
  );
};

export default RippleMarker;
