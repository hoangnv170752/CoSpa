import React from 'react';
import { Star, MapPin, Navigation, Phone, ExternalLink, Coffee, Briefcase, Building, BookOpen } from 'lucide-react';
import { LocationData } from '../types';

interface LocationCardProps {
  location: LocationData;
  onClick: () => void;
  compact?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onClick, compact = false }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'Cafe': return <Coffee size={14} />;
      case 'Coworking': return <Briefcase size={14} />;
      case 'Office': return <Building size={14} />;
      case 'Library': return <BookOpen size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  if (compact) {
    // Used inside map popups
    return (
      <div className="w-64 bg-white rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
        <div className="h-24 overflow-hidden relative">
           <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
           {location.isSponsored && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              AD
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-slate-800 text-sm truncate">{location.name}</h3>
          <div className="flex items-center text-xs text-slate-500 mt-1">
             <Star size={12} className="text-amber-400 fill-amber-400 mr-1" />
             <span className="font-medium mr-1">{location.rating}</span>
             <span>({location.reviewCount})</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">{location.address}</p>
        </div>
      </div>
    );
  }

  // Full card for chat stream
  return (
    <div 
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row w-full mb-3"
    >
      <div className="relative md:w-1/3 h-32 md:h-auto overflow-hidden">
        <img 
          src={location.imageUrl} 
          alt={location.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        {location.isSponsored && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            Sponsored
          </span>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center">
           {getIcon(location.type)}
           <span className="ml-1">{location.type}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-slate-900 text-lg">{location.name}</h3>
            <span className="text-indigo-600 font-medium text-xs bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
              {location.distance} away
            </span>
          </div>
          
          <div className="flex items-center mt-1 mb-2">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold ml-1 text-slate-800">{location.rating}</span>
            <span className="text-xs text-slate-500 ml-1">({location.reviewCount} reviews)</span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {location.description || location.address}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {location.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors">
            <Navigation size={14} /> Directions
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
            <ExternalLink size={14} /> Details
          </button>
        </div>
      </div>
    </div>
  );
};
