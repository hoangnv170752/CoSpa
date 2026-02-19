import React from 'react';
import { Link } from 'react-router-dom';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { WiFiScanner } from '../components/WiFiScanner';

export const WiFiPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition-colors">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">C</div>
              CoSpa
            </Link>
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    Đăng nhập
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/about" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WiFiScanner />
      </div>
    </div>
  );
};
