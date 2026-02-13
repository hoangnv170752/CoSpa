import React, { useState, useEffect, useRef } from 'react';
import { Send, Map as MapIcon, X, Locate } from 'lucide-react';
import { MapComponent } from './components/MapComponent';
import { ChatBubble } from './components/ChatBubble';
import { LocationCard } from './components/LocationCard';
import { sendMessageToGemini } from './services/geminiService';
import { Message, LocationData, Coordinates } from './types';
import 'leaflet/dist/leaflet.css';

// Default center: Hanoi Opera House
const DEFAULT_CENTER: Coordinates = { lat: 21.0254, lng: 105.8564 };

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Mình là CoSpa, trợ lý giúp bạn tìm kiếm không gian làm việc và quán cafe tốt nhất tại Việt Nam. Bạn đang tìm một chỗ yên tĩnh ở Hà Nội, hay một quán cafe sôi động ở Sài Gòn?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [chatWidth, setChatWidth] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Request Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Geolocation error (using default):", error)
      );
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Send user location to API for location filtering
      const { reply, locations: newLocations } = await sendMessageToGemini(
        userMessage.content, 
        history,
        mapCenter // Pass current map center as user location
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        relatedLocations: newLocations.length > 0 ? newLocations : undefined
      };

      setMessages(prev => [...prev, botMessage]);

      if (newLocations.length > 0) {
        setLocations(newLocations);
        // Center map on the first result
        setMapCenter(newLocations[0].coordinates);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to the service right now.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLocationSelect = (loc: LocationData) => {
    setMapCenter(loc.coordinates);
    if (window.innerWidth < 768) {
        setShowMapMobile(true);
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newChatWidth = (e.clientX / containerWidth) * 100;
    
    // Limit between 30% and 70%
    if (newChatWidth >= 30 && newChatWidth <= 70) {
      setChatWidth(newChatWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">C</div>
           CoSpa
        </div>
        <button 
          onClick={() => setShowMapMobile(!showMapMobile)} 
          className="md:hidden p-2 rounded-full bg-slate-100 text-slate-600"
        >
          {showMapMobile ? <X size={20} /> : <MapIcon size={20} />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div 
          className={`flex flex-col ${showMapMobile ? 'hidden md:flex' : 'flex'}`}
          style={{ width: window.innerWidth >= 768 ? `${chatWidth}%` : '100%' }}
        >
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatBubble message={msg} />
                
                {/* Render cards inside the stream if associated with the message */}
                {msg.relatedLocations && msg.relatedLocations.length > 0 && (
                  <div className="ml-12 md:ml-14 mb-8 grid gap-4 grid-cols-1 md:grid-cols-2">
                    {msg.relatedLocations.map(loc => (
                       <LocationCard key={loc.id} location={loc} onClick={() => handleLocationSelect(loc)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex w-full mb-6 justify-start">
                 <div className="ml-3 flex items-center space-x-2 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for a place (e.g., 'Coworking space in Hanoi with good coffee')..."
              className="w-full bg-slate-100 text-slate-800 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none shadow-sm"
              rows={1}
              style={{ minHeight: '56px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl p-3 transition-colors shadow-sm flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-400">
             AI can make mistakes. Check important info.
          </div>
        </div>
      </div>

      {/* Resizable Divider - Desktop only */}
      <div 
        className="hidden md:block w-1 bg-gray-200 hover:bg-indigo-400 cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-100 opacity-0 group-hover:opacity-50 transition-opacity"></div>
      </div>

      {/* Map Area */}
      <div 
        className={`border-l border-gray-200 relative ${showMapMobile ? 'flex flex-col flex-1' : 'hidden md:flex md:flex-col'}`}
        style={{ width: window.innerWidth >= 768 ? `${100 - chatWidth}%` : '100%' }}
      >
        <div className="flex-1 relative bg-slate-100">
          <MapComponent 
            locations={locations} 
            center={mapCenter} 
            onLocationSelect={(loc) => {
              setMapCenter(loc.coordinates);
            }} 
          />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
             <button 
               onClick={() => {
                 navigator.geolocation.getCurrentPosition(p => 
                   setMapCenter({ lat: p.coords.latitude, lng: p.coords.longitude })
                 );
               }}
               className="bg-white p-2 rounded shadow-md text-slate-600 hover:text-indigo-600"
               title="My Location"
             >
               <Locate size={20} />
             </button>
          </div>

          {/* Quick List Overlay on Map (Mobile) */}
          {locations.length > 0 && (
             <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-white/50 md:hidden">
                <p className="text-xs font-bold text-slate-500 mb-1">Showing {locations.length} results</p>
                <div className="flex overflow-x-auto gap-2 pb-1">
                   {locations.map(loc => (
                      <div key={loc.id} className="flex-shrink-0 w-32 h-20 bg-slate-200 rounded overflow-hidden relative" onClick={() => setMapCenter(loc.coordinates)}>
                         <img src={loc.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                         <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white shadow-black drop-shadow-md">{loc.name}</span>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
        </div>
      </div>

    </div>
  );
}

export default App;
