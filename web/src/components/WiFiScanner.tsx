import React, { useState } from 'react';
import { Wifi, Lock, Search, Crown, Loader2, Copy, Check } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface WiFiNetwork {
  ssid: string;
  signal: number;
  security: string;
  password?: string;
  available: boolean;
}

export const WiFiScanner: React.FC = () => {
  const { user } = useUser();
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [copiedSSID, setCopiedSSID] = useState<string | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Check if user has premium (you can customize this based on your Clerk metadata)
  const isPremium = user?.publicMetadata?.premium === true;

  const handleScan = async () => {
    // if (!isPremium) {
    //   alert('Chức năng này chỉ dành cho tài khoản Premium. Vui lòng nâng cấp!');
    //   return;
    // }

    setIsScanning(true);
    
    try {
      // Call API to scan WiFi networks
      const response = await fetch(`${API_BASE_URL}/api/wifi/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan WiFi networks');
      }

      const data = await response.json();
      setNetworks(data.networks || []);
    } catch (error) {
      console.error('Error scanning WiFi:', error);
      // Demo data for testing
      setNetworks([
        { ssid: 'Highlands Coffee', signal: 85, security: 'WPA2', password: 'highland2024', available: true },
        { ssid: 'The Coffee House', signal: 72, security: 'WPA2', password: 'coffee@123', available: true },
        { ssid: 'Starbucks_Guest', signal: 65, security: 'WPA2', password: 'starbucks2024', available: true },
        { ssid: 'Phuc Long Tea', signal: 58, security: 'WPA2', password: 'phuclong@wifi', available: true },
        { ssid: 'Cong Caphe', signal: 45, security: 'WPA2', password: 'congcaphe123', available: true },
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const copyPassword = (ssid: string, password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedSSID(ssid);
    setTimeout(() => setCopiedSSID(null), 2000);
  };

  const getSignalColor = (signal: number) => {
    if (signal >= 70) return 'text-green-600';
    if (signal >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalBars = (signal: number) => {
    const bars = Math.ceil(signal / 25);
    return (
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 ${bar <= bars ? getSignalColor(signal) : 'bg-gray-300'}`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Wifi className="text-indigo-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">WiFi Scanner</h2>
            <p className="text-sm text-gray-500">Dò mật khẩu WiFi quán cafe</p>
          </div>
        </div>
        {isPremium && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold">
            <Crown size={14} />
            Premium
          </div>
        )}
      </div>

      {/* Premium Gate */}
      {false && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6 border border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Nâng cấp lên Premium để sử dụng
              </h3>
              <p className="text-gray-600 mb-4">
                Tính năng dò mật khẩu WiFi giúp bạn kết nối internet miễn phí tại các quán cafe, coworking space. 
                Chỉ dành cho thành viên Premium!
              </p>
              <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                Nâng cấp ngay - 99.000đ/tháng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Button */}
      {true && (
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Đang quét mạng WiFi...
            </>
          ) : (
            <>
              <Search size={20} />
              Quét WiFi xung quanh
            </>
          )}
        </button>
      )}

      {/* Networks List */}
      {networks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Tìm thấy {networks.length} mạng WiFi
          </h3>
          {networks.map((network, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Wifi className="text-indigo-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{network.ssid}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{network.security}</span>
                      <span>•</span>
                      <span>Tín hiệu: {network.signal}%</span>
                    </div>
                  </div>
                </div>
                {getSignalBars(network.signal)}
              </div>

              {network.password && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Lock size={16} className="text-gray-400" />
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {network.password}
                      </span>
                    </div>
                    <button
                      onClick={() => copyPassword(network.ssid, network.password!)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      {copiedSSID === network.ssid ? (
                        <>
                          <Check size={14} />
                          Đã copy
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isPremium && networks.length === 0 && !isScanning && (
        <div className="text-center py-12 text-gray-500">
          <Wifi size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Nhấn "Quét WiFi" để tìm mạng xung quanh</p>
        </div>
      )}
    </div>
  );
};
