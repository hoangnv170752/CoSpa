import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <MapPin size={80} className="mx-auto text-indigo-600 mb-4" />
          <h1 className="text-8xl font-bold text-gray-900 mb-2">404</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto rounded-full mb-6"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Trang không tồn tại
        </h2>
        <p className="text-gray-600 mb-2">
          Đường dẫn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Có thể bạn đã nhập sai địa chỉ hoặc trang đã được di chuyển.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Home size={20} />
            Về trang chủ
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200"
          >
            Về CoSpa
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Cần hỗ trợ? Liên hệ với chúng tôi:</p>
          <div className="flex gap-4 justify-center mt-2">
            <a href="https://zalo.me/0354530616" className="text-indigo-600 hover:underline">
              Zalo
            </a>
            <span>•</span>
            <a href="mailto:hoang.nv.ral@gmail.com" className="text-indigo-600 hover:underline">
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
