import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Map as MapIcon, X, Locate, Info, Heart, MapPin, Crown } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { MapComponent } from './components/MapComponent';
import { ChatBubble } from './components/ChatBubble';
import { LocationCard } from './components/LocationCard';
import { ConversationDropdown } from './components/ConversationDropdown';
import { UpgradeModal } from './components/UpgradeModal';
import { sendMessageToGemini } from './services/geminiService';
import { createConversation, getUserConversations, deleteConversation, updateConversationTitle, getConversationMessages, Conversation } from './services/conversationService';
import { Message, LocationData, Coordinates } from './types';
import 'leaflet/dist/leaflet.css';

// Default center: Hanoi Opera House
const DEFAULT_CENTER: Coordinates = { lat: 21.0254, lng: 105.8564 };

function App() {
  const { user, isLoaded } = useUser();
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
  const [chatWidth, setChatWidth] = useState(50);
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Supported cities with coordinates
  const cities = [
    { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Quảng Ninh', lat: 21.0064, lng: 107.2925 },
    { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
    { name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297 }
  ];

  const [isResizing, setIsResizing] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return localStorage.getItem('cospa_conversation_id');
  });
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('cospa_user_id');
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Rate limiting for unauthenticated users
  const DAILY_LIMIT = 3;
  const STORAGE_KEY = 'cospa_request_count';
  const DATE_KEY = 'cospa_request_date';

  // Check and initialize rate limit on mount
  useEffect(() => {
    if (isLoaded && !user) {
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem(DATE_KEY);
      const storedCount = localStorage.getItem(STORAGE_KEY);

      if (storedDate !== today) {
        // New day, reset count
        localStorage.setItem(DATE_KEY, today);
        localStorage.setItem(STORAGE_KEY, '0');
        setRequestCount(0);
        setIsLimitReached(false);
      } else {
        // Same day, load count
        const count = parseInt(storedCount || '0');
        setRequestCount(count);
        setIsLimitReached(count >= DAILY_LIMIT);
      }
    }
  }, [isLoaded, user]);

  const checkRateLimit = (): boolean => {
    if (user) return true; // Authenticated users have no limit

    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(DATE_KEY);
    
    // Reset if new day
    if (storedDate !== today) {
      localStorage.setItem(DATE_KEY, today);
      localStorage.setItem(STORAGE_KEY, '0');
      setRequestCount(0);
      setIsLimitReached(false);
      return true;
    }

    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    
    if (count >= DAILY_LIMIT) {
      setIsLimitReached(true);
      return false;
    }

    return true;
  };

  const incrementRequestCount = () => {
    if (user) return; // Don't count for authenticated users

    const newCount = requestCount + 1;
    setRequestCount(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
    
    if (newCount >= DAILY_LIMIT) {
      setIsLimitReached(true);
    }
  };

  // Sync user data to backend when user signs in
  useEffect(() => {
    if (isLoaded && user) {
      syncUserToBackend(user);
    }
  }, [isLoaded, user]);

  const syncUserToBackend = async (clerkUser: any) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          full_name: clerkUser.fullName,
          avatar_url: clerkUser.imageUrl,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ User sync failed:', response.status, errorText);
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Store user_id for conversation tracking
      setUserId(result.user_id);
      localStorage.setItem('cospa_user_id', result.user_id);
      
      // Fetch existing conversations
      const existingConvs = await getUserConversations(result.user_id);
      setConversations(existingConvs);
      
      // Auto-create first conversation only if no conversations exist and no stored conversation_id
      if (existingConvs.length === 0 && !conversationId) {
        try {
          const newConvId = await createConversation(result.user_id);
          setConversationId(newConvId);
          localStorage.setItem('cospa_conversation_id', newConvId);
          // Refresh conversations list
          const updated = await getUserConversations(result.user_id);
          setConversations(updated);
        } catch (error: any) {
          console.error('❌ Failed to create conversation:', error);
          if (error.message.includes('giới hạn')) {
            alert('Bạn đã đạt giới hạn 3 cuộc hội thoại. Vui lòng xóa cuộc hội thoại cũ.');
          }
        }
      } else if (existingConvs.length > 0 && !conversationId) {
        // Use the most recent conversation
        setConversationId(existingConvs[0].id);
        localStorage.setItem('cospa_conversation_id', existingConvs[0].id);
      }
    } catch (error) {
      console.error('❌ Failed to sync user:', error);
    }
  };

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
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (conversationId && userId) {
        const conversationMessages = await getConversationMessages(conversationId);
        
        if (conversationMessages.length > 0) {
          setMessages(conversationMessages);
          
          const allLocations: LocationData[] = [];
          conversationMessages.forEach(msg => {
            if (msg.relatedLocations && msg.relatedLocations.length > 0) {
              allLocations.push(...msg.relatedLocations);
            }
          });
          
          if (allLocations.length > 0) {
            setLocations(allLocations);
            setMapCenter(allLocations[allLocations.length - 1].coordinates);
          }
        }
      }
    };
    
    loadMessages();
  }, [conversationId, userId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check rate limit for unauthenticated users
    if (!checkRateLimit()) {
      const limitMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Bạn đã sử dụng hết ${DAILY_LIMIT} lượt tìm kiếm miễn phí trong ngày hôm nay. Vui lòng đăng nhập để tiếp tục sử dụng không giới hạn! 🔐`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

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
      // Increment request count for unauthenticated users
      incrementRequestCount();
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Send user location to API for location filtering
      const { reply, locations: newLocations } = await sendMessageToGemini(
        userMessage.content, 
        history,
        mapCenter, // Pass current map center as user location
        conversationId || undefined, // Pass conversation ID if user is authenticated
        userId || undefined // Pass user ID if authenticated
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

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = "Xin lỗi, hiện tại mình đang gặp sự cố kết nối.";
      
      // Check if it's a conversation limit error
      if (error.message && error.message.includes('giới hạn')) {
        errorContent = error.message;
        
        // Offer to create new conversation if limit reached
        if (error.message.includes('10 tin nhắn') && userId) {
          const createNew = confirm('Cuộc hội thoại đã đạt giới hạn 10 tin nhắn. Tạo cuộc hội thoại mới?');
          if (createNew) {
            try {
              const newConvId = await createConversation(userId);
              setConversationId(newConvId);
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'Xin chào! Mình là CoSpa, trợ lý giúp bạn tìm kiếm không gian làm việc và quán cafe tốt nhất tại Việt Nam. Bạn đang tìm một chỗ yên tĩnh ở Hà Nội, hay một quán cafe sôi động ở Sài Gòn?',
                timestamp: Date.now()
              }]);
              setLoading(false);
              return; // Exit early, don't show error message
            } catch (convError: any) {
              if (convError.message.includes('giới hạn 3')) {
                errorContent = 'Bạn đã đạt giới hạn 3 cuộc hội thoại.\n\nVui lòng liên hệ admin để nâng cấp tài khoản và sử dụng không giới hạn cuộc hội thoại.';
              }
            }
          }
        }
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
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

  const handleSaveLocation = async (locationId: string) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để lưu địa điểm');
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-locations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          site_id: locationId,
        }),
      });

      if (response.ok) {
        console.log('✅ Location saved successfully');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleCitySelect = (city: { name: string; lat: number; lng: number }) => {
    setMapCenter({ lat: city.lat, lng: city.lng });
    setShowCityFilter(false);
  };

  const handleSelectConversation = async (id: string) => {
    setConversationId(id);
    localStorage.setItem('cospa_conversation_id', id);
    
    // Load messages from selected conversation
    const conversationMessages = await getConversationMessages(id);
    
    if (conversationMessages.length > 0) {
      setMessages(conversationMessages);
      
      // Extract and set locations from messages
      const allLocations: LocationData[] = [];
      conversationMessages.forEach(msg => {
        if (msg.relatedLocations && msg.relatedLocations.length > 0) {
          allLocations.push(...msg.relatedLocations);
        }
      });
      
      if (allLocations.length > 0) {
        setLocations(allLocations);
        setMapCenter(allLocations[allLocations.length - 1].coordinates);
      }
    } else {
      // No messages, show welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Mình là CoSpa, trợ lý giúp bạn tìm kiếm không gian làm việc và quán cafe tốt nhất tại Việt Nam. Bạn đang tìm một chỗ yên tĩnh ở Hà Nội, hay một quán cafe sôi động ở Sài Gòn?',
        timestamp: Date.now()
      }]);
    }
  };

  const handleCreateConversation = async () => {
    if (!userId) return;
    try {
      const newConvId = await createConversation(userId);
      setConversationId(newConvId);
      localStorage.setItem('cospa_conversation_id', newConvId);
      // Refresh conversations list
      const updated = await getUserConversations(userId);
      setConversations(updated);
      // Reset messages
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Mình là CoSpa, trợ lý giúp bạn tìm kiếm không gian làm việc và quán cafe tốt nhất tại Việt Nam. Bạn đang tìm một chỗ yên tĩnh ở Hà Nội, hay một quán cafe sôi động ở Sài Gòn?',
        timestamp: Date.now()
      }]);
    } catch (error: any) {
      if (error.message.includes('giới hạn')) {
        alert('Bạn đã đạt giới hạn 3 cuộc hội thoại.\n\nVui lòng liên hệ admin để nâng cấp tài khoản và sử dụng không giới hạn cuộc hội thoại.');
      }
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const success = await deleteConversation(id);
    if (success && userId) {
      // Refresh conversations list
      const updated = await getUserConversations(userId);
      setConversations(updated);
      // If deleted current conversation, switch to another or create new
      if (id === conversationId) {
        if (updated.length > 0) {
          handleSelectConversation(updated[0].id);
        } else {
          setConversationId(null);
          localStorage.removeItem('cospa_conversation_id');
        }
      }
    }
  };

  const handleUpdateConversationTitle = async (id: string, title: string) => {
    const success = await updateConversationTitle(id, title);
    if (success && userId) {
      // Refresh conversations list
      const updated = await getUserConversations(userId);
      setConversations(updated);
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
    <div className="flex flex-col h-screen bg-white overflow-hidden touch-pan-y">
      
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-3 sm:px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg sm:text-xl text-indigo-600">
           <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm sm:text-base">C</div>
           <span className="hidden xs:inline">CoSpa</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            <Crown size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nâng cấp</span>
          </button>
          <Link 
            to="/saved" 
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Heart size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Đã lưu</span>
          </Link>
          {/* <Link 
            to="/wifi" 
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <MapIcon size={16} />
            <span className="hidden sm:inline">WiFi</span>
          </Link> */}
          <Link 
            to="/about" 
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Info size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Giới thiệu</span>
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium">
                Đăng nhập
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <ConversationDropdown
              conversations={conversations}
              currentConversationId={conversationId}
              onSelect={handleSelectConversation}
              onCreate={handleCreateConversation}
              onDelete={handleDeleteConversation}
              onUpdateTitle={handleUpdateConversationTitle}
            />
            <UserButton afterSignOutUrl="/about" />
          </SignedIn>
          <button 
            onClick={() => setShowMapMobile(!showMapMobile)} 
            className="lg:hidden p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            title={showMapMobile ? "Xem Chat" : "Xem Bản đồ"}
          >
            {showMapMobile ? <X size={20} /> : <MapIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div 
          className={`flex flex-col ${showMapMobile ? 'hidden lg:flex' : 'flex'}`}
          style={{ width: window.innerWidth >= 1024 ? `${chatWidth}%` : '100%' }}
        >
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-50 scroll-smooth overscroll-contain">
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
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLimitReached ? "Đã hết lượt tìm kiếm hôm nay. Vui lòng đăng nhập..." : "Hỏi về địa điểm (ví dụ: 'Coworking space ở Hà Nội có cà phê ngon')..."}
              className="w-full bg-slate-100 text-slate-800 rounded-2xl pl-4 sm:pl-5 pr-12 sm:pr-14 py-3 sm:py-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none shadow-sm disabled:opacity-50"
              rows={1}
              style={{ minHeight: '48px' }}
              disabled={isLimitReached}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || isLimitReached}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl p-3 transition-colors shadow-sm flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-2">
             <span>CoSpa có thể chưa thoả mãn hết yêu cầu của bạn, nhớ kiểm tra lại thông tin nha.</span>
             {!user && isLoaded && (
               <span className={`font-medium ${isLimitReached ? 'text-red-500' : requestCount >= DAILY_LIMIT - 1 ? 'text-orange-500' : 'text-slate-500'}`}>
                 • {requestCount}/{DAILY_LIMIT} lượt miễn phí
               </span>
             )}
          </div>
        </div>
      </div>

      {/* Resizable Divider - Desktop only (>= 1024px) */}
      <div 
        className="hidden lg:block w-1 bg-gray-200 hover:bg-indigo-400 cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-100 opacity-0 group-hover:opacity-50 transition-opacity"></div>
      </div>

      {/* Map Area */}
      <div 
        className={`border-l border-gray-200 relative ${showMapMobile ? 'flex flex-col flex-1' : 'hidden lg:flex lg:flex-col'}`}
        style={{ width: window.innerWidth >= 1024 ? `${100 - chatWidth}%` : '100%' }}
      >
        <div className="flex-1 relative bg-slate-100">
          <MapComponent 
            locations={locations} 
            center={mapCenter} 
            onLocationSelect={(loc) => {
              setMapCenter(loc.coordinates);
            }}
            onSaveLocation={handleSaveLocation}
          />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-row gap-2">
             {/* City Filter */}
             <div className="relative">
               <button 
                 onClick={() => setShowCityFilter(!showCityFilter)}
                 className="bg-white p-2 rounded shadow-md text-slate-600 hover:text-indigo-600 flex items-center gap-2 min-w-[140px]"
                 title="Chọn thành phố"
               >
                 <MapPin size={20} />
                 <span className="text-sm font-medium">Thành phố</span>
               </button>
               
               {showCityFilter && (
                 <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden">
                   {cities.map((city) => (
                     <button
                       key={city.name}
                       onClick={() => handleCitySelect(city)}
                       className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm"
                     >
                       <MapPin size={16} className="text-indigo-600" />
                       <span className="font-medium text-gray-700">{city.name}</span>
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* My Location Button */}
             <button 
               onClick={() => {
                 navigator.geolocation.getCurrentPosition(p => 
                   setMapCenter({ lat: p.coords.latitude, lng: p.coords.longitude })
                 );
               }}
               className="bg-white p-2 rounded shadow-md text-slate-600 hover:text-indigo-600"
               title="Vị trí của tôi"
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
                         {loc.imageUrl && loc.imageUrl.trim() !== '' && (
                           <img src={loc.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                         )}
                         <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white shadow-black drop-shadow-md">{loc.name}</span>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}

export default App;
