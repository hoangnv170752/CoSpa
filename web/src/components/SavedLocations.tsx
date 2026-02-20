import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Navigation, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { LocationReviews } from './LocationReviews';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  rating: number;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  savedAt: string;
  type: string;
}

export const SavedLocations: React.FC = () => {
  const { user } = useUser();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (user?.id) {
      fetchSavedLocations();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchSavedLocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-locations/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      // Demo data for testing
      setLocations([
        {
          id: '1',
          name: 'Highlands Coffee - Hoàn Kiếm',
          address: '54 Tràng Tiền, Hoàn Kiếm, Hà Nội',
          rating: 4.5,
          imageUrl: 'https://cdn.xanhsm.com/2025/02/13cba011-cafe-sang-sai-gon-4.jpg',
          coordinates: { lat: 21.0245, lng: 105.8412 },
          savedAt: new Date().toISOString(),
          type: 'Cafe'
        },
        {
          id: '2',
          name: 'Toong Coworking - Lê Duẩn',
          address: '123 Lê Duẩn, Đống Đa, Hà Nội',
          rating: 4.8,
          imageUrl: 'https://cdn.xanhsm.com/2025/02/13cba011-cafe-sang-sai-gon-4.jpg',
          coordinates: { lat: 21.0167, lng: 105.8449 },
          savedAt: new Date().toISOString(),
          type: 'Coworking'
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (locationId: string, locationName: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa "${locationName}" khỏi danh sách đã lưu?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-locations/${user?.id}/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocations(locations.filter(loc => loc.id !== locationId));
      }
    } catch (error) {
      console.error('Error removing location:', error);
      setLocations(locations.filter(loc => loc.id !== locationId));
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Heart className="text-pink-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Địa điểm đã lưu</h2>
            <p className="text-sm text-gray-500">{locations.length} địa điểm</p>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      {locations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-200">
                <img
                  src={location.imageUrl}
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  {location.rating}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{location.name}</h3>
                    <div className="flex items-start gap-1.5 text-sm text-gray-600">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{location.address}</span>
                    </div>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium mb-3">
                  {location.type}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowReviews(true);
                    }}
                    className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    Xem đánh giá
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openInMaps(location.coordinates.lat, location.coordinates.lng)}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <Navigation size={14} />
                      Chỉ đường
                    </button>
                    <button
                      onClick={() => handleRemove(location.id, location.name)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto mb-3 text-gray-300" />
          {!user ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vui lòng đăng nhập
              </h3>
              <p className="text-gray-500 mb-4">
                Đăng nhập để xem và quản lý các địa điểm đã lưu của bạn
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có địa điểm nào được lưu
              </h3>
              <p className="text-gray-500 mb-4">
                Bắt đầu lưu các địa điểm yêu thích của bạn để dễ dàng truy cập sau này
              </p>
            </>
          )}
        </div>
      )}

      {/* Reviews Modal */}
      {selectedLocation && (
        <LocationReviews
          siteId={selectedLocation.id}
          isOpen={showReviews}
          onClose={() => {
            setShowReviews(false);
            setSelectedLocation(null);
          }}
          locationName={selectedLocation.name}
        />
      )}
    </div>
  );
};
