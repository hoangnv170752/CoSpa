import { LocationData, Coordinates } from "../types";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  userLocation?: Coordinates
): Promise<{ reply: string; locations: LocationData[] }> => {
  
  try {
    // Transform history to API format
    const apiHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.parts[0]?.text || ''
    }));

    // Call FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        history: apiHistory,
        user_location: userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng
        } : null
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to match our LocationData type
    const transformedLocations: LocationData[] = data.locations.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      brand: loc.brand,
      rating: loc.rating,
      reviewCount: loc.review_count,
      address: loc.address,
      distance: loc.distance,
      coordinates: {
        lat: loc.lat,
        lng: loc.lng
      },
      amenities: loc.amenities || [],
      isSponsored: loc.isSponsored || false,
      isOpen: true, // Default to open
      description: loc.description,
      imageUrl: loc.thumbnail_url || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      phoneNumber: loc.phone_number,
      linkGoogle: loc.link_google,
      linkWeb: loc.link_web
    }));

    return {
      reply: data.reply,
      locations: transformedLocations
    };

  } catch (error) {
    console.error("API Error:", error);
    return {
      reply: "Xin lỗi, hiện tại mình đang gặp sự cố kết nối. Vui lòng thử lại sau.",
      locations: []
    };
  }
};
