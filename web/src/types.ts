export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  id: string;
  name: string;
  type: 'Cafe' | 'Coworking' | 'Office' | 'Library';
  brand?: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance: string;
  imageUrl: string;
  coordinates: Coordinates;
  amenities: string[];
  isSponsored?: boolean;
  isOpen?: boolean;
  description?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  relatedLocations?: LocationData[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentLocations: LocationData[];
}
