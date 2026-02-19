import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold">Nâng cấp từ Freemium lên Premium</h2>
          </div>
          <p className="text-indigo-100">Mở khóa tất cả tính năng với chỉ 99.000đ</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quyền lợi Premium:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Không giới hạn hội thoại</p>
                  <p className="text-sm text-gray-600">Tạo và lưu trữ không giới hạn cuộc hội thoại</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Cập nhật workspace mới</p>
                  <p className="text-sm text-gray-600">Nhận thông báo về địa điểm mới ngay khi cập nhật</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Ưu tiên hỗ trợ</p>
                  <p className="text-sm text-gray-600">Được hỗ trợ ưu tiên qua Zalo/Email</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Tính năng mới sớm</p>
                  <p className="text-sm text-gray-600">Trải nghiệm tính năng mới trước người dùng khác</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <p className="text-gray-600 mb-2">Chỉ với</p>
            <p className="text-5xl font-bold text-indigo-600 mb-2">99.000đ</p>
            <p className="text-gray-600">Sử dụng trọn đời - Không phí ẩn</p>
          </div>

          {/* Payment Instructions */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Hướng dẫn thanh toán:
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Quét mã QR bên dưới để chuyển khoản <strong>99.000đ</strong></li>
                <li>Nội dung chuyển khoản: <strong className="text-indigo-600">COSPA [Email đăng ký của bạn]</strong></li>
                <li>Sau khi chuyển khoản, chụp ảnh bill và gửi cho admin qua Zalo/Email</li>
                <li>Tài khoản sẽ được nâng cấp trong vòng 24h</li>
              </ol>
            </div>
          </div>

          {/* QR Codes */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Banking QR - International */}
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Nâng cấp quốc tế
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <img 
                  src="/buy-me-qr-code.png" 
                  alt="International Payment QR Code" 
                  className="w-full max-w-[300px] mx-auto rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Quét mã QR để chuyển khoản</p>
              </div>
            </div>

            {/* ZaloPay QR - Vietnam Banking */}
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Ngân hàng Việt Nam
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <img 
                  src="/zalopay.png" 
                  alt="Vietnam Banking QR Code" 
                  className="w-full max-w-[300px] mx-auto rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Quét mã QR bằng ZaloPay</p>
              </div>
            </div>
          </div>

          {/* B2B Service Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 italic">
              Hỗ trợ triển khai giải pháp cho doanh nghiệp.
              <br />
              Liên hệ để được tư vấn chi tiết.
            </p>
          </div>

          {/* Contact Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <h4 className="font-bold text-gray-900 mb-3 text-center">Liên hệ hỗ trợ:</h4>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://zalo.me/84354530616"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Zalo
              </a>
              <a
                href="mailto:hoang.nv.ral@gmail.com"
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
