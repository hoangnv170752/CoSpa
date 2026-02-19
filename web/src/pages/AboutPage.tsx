import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Users, Shield, Zap, Phone, Mail, Crown } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { UpgradeModal } from '../components/UpgradeModal';

export const AboutPage: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
              >
                <Crown size={16} />
                Nâng cấp
              </button>
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Khám phá không gian làm việc
            <span className="block text-indigo-600 mt-2">hoàn hảo cho bạn</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            CoSpa giúp bạn tìm kiếm và khám phá các quán cafe, coworking space và địa điểm làm việc tốt nhất tại Việt Nam thông qua trợ lý AI thông minh.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Bắt đầu ngay
            <Sparkles size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Tại sao chọn CoSpa?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Sparkles className="text-indigo-600" size={32} />}
            title="Trợ lý AI thông minh"
            description="Chat với AI để tìm địa điểm phù hợp với nhu cầu của bạn. Không cần tìm kiếm phức tạp, chỉ cần nói những gì bạn muốn."
          />
          <FeatureCard
            icon={<MapPin className="text-indigo-600" size={32} />}
            title="Bản đồ tương tác"
            description="Xem vị trí các địa điểm trên bản đồ, tìm kiếm theo khu vực và nhận gợi ý dựa trên vị trí hiện tại của bạn."
          />
          <FeatureCard
            icon={<Users className="text-indigo-600" size={32} />}
            title="Đánh giá cộng đồng"
            description="Đọc review từ cộng đồng, xem rating và hình ảnh thực tế từ những người đã ghé thăm."
          />
          <FeatureCard
            icon={<Shield className="text-indigo-600" size={32} />}
            title="Thông tin chính xác"
            description="Dữ liệu được cập nhật thường xuyên, đảm bảo thông tin về giờ mở cửa, địa chỉ và tiện ích luôn chính xác."
          />
          <FeatureCard
            icon={<Zap className="text-indigo-600" size={32} />}
            title="Tìm kiếm nhanh chóng"
            description="Kết quả tìm kiếm tức thì với AI, giúp bạn tiết kiệm thời gian và tìm được địa điểm phù hợp ngay lập tức."
          />
          <FeatureCard
            icon={<MapPin className="text-indigo-600" size={32} />}
            title="Lưu yêu thích"
            description="Lưu các địa điểm yêu thích, tạo danh sách riêng và quản lý lịch sử tìm kiếm của bạn."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">4000+</div>
              <div className="text-indigo-100">Địa điểm</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4</div>
              <div className="text-indigo-100">Thành phố</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-indigo-100">Người dùng đầu tiên</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA & Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-16">
        <div className="bg-white rounded-3xl shadow-xl p-12">
          {/* CTA Part */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sẵn sàng tìm không gian làm việc lý tưởng?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Bắt đầu trò chuyện với trợ lí ảo CoSpa của chúng tôi và khám phá những địa điểm tuyệt vời ngay hôm nay.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Khám phá ngay
              <Sparkles size={20} />
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-12"></div>

          {/* Contact Part */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Liên lạc để hỗ trợ
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng hỗ trợ và lắng nghe các ý kiến phản hồi từ bạn. Liên hệ với chúng tôi qua Zalo hoặc Email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://zalo.me/84354530616"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl min-w-[240px] justify-center"
              >
                <Phone size={20} />
              </a>
              <a
                href="mailto:hoang.nv.ral@gmail.com"
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl min-w-[240px] justify-center"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">C</div>
              CoSpa
            </div>
            <div className="text-gray-400 text-sm">
              © 2026 CoSpa. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};
