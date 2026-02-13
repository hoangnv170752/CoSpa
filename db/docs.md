# Database Design - CoSpa

## Overview
CoSpa là hệ thống quản lý và tìm kiếm địa điểm dựa trên vị trí địa lý, cho phép người dùng khám phá các địa điểm xung quanh.

---

## 1. Users (Người dùng)

Quản lý thông tin người dùng của hệ thống.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID người dùng |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `username` | VARCHAR(100) | UNIQUE | Tên người dùng |
| `full_name` | VARCHAR(255) | | Họ và tên |
| `avatar_url` | TEXT | | URL ảnh đại diện |
| `phone_number` | VARCHAR(20) | | Số điện thoại |
| `clerk_id` | VARCHAR(255) | UNIQUE | ID từ Clerk authentication |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |
| `last_login` | TIMESTAMP | | Lần đăng nhập cuối |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_clerk_id` on `clerk_id`

---

## 2. Sites (Địa điểm)

Lưu trữ thông tin chi tiết về các địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID địa điểm |
| `name` | VARCHAR(255) | NOT NULL | Tên địa điểm |
| `type` | VARCHAR(100) | | Loại hình (cafe, restaurant, shop, etc.) |
| `brand` | VARCHAR(255) | | Thương hiệu / chuỗi |
| `old_address` | TEXT | | Địa chỉ cũ (lịch sử) |
| `new_address` | TEXT | | Địa chỉ mới |
| `num_address` | VARCHAR(100) | | Số nhà / đường |
| `ward` | VARCHAR(100) | | Phường / Xã |
| `district` | VARCHAR(100) | | Quận / Huyện |
| `city` | VARCHAR(100) | | Tỉnh / Thành phố |
| `area` | VARCHAR(100) | | Khu vực |
| `link_google` | TEXT | | Link Google Maps |
| `link_web` | TEXT | | Website / Mạng xã hội |
| `thumbnail_url` | TEXT | | URL ảnh đại diện |
| `lat` | DECIMAL(10, 8) | NOT NULL | Vĩ độ |
| `lng` | DECIMAL(11, 8) | NOT NULL | Kinh độ |
| `note` | TEXT | | Ghi chú |
| `phone_number` | VARCHAR(20) | | Số điện thoại |
| `rating` | DECIMAL(2, 1) | CHECK (rating >= 0 AND rating <= 5) | Điểm rating (0-5) |
| `review_count` | INTEGER | DEFAULT 0 | Số lượng review |
| `query_source` | VARCHAR(100) | | Nguồn dữ liệu |
| `place_id` | VARCHAR(255) | UNIQUE | Google Place ID |
| `data_id` | VARCHAR(255) | | Data ID từ nguồn khác |
| `created_by` | UUID | FOREIGN KEY → Users(id) | Người tạo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Đã xác minh |

**Indexes:**
- `idx_sites_location` on `lat, lng` (Spatial index)
- `idx_sites_type` on `type`
- `idx_sites_city` on `city`
- `idx_sites_place_id` on `place_id`
- `idx_sites_rating` on `rating`

---

## 3. Categories (Danh mục)

Phân loại các địa điểm theo danh mục.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID danh mục |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Tên danh mục |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | Slug URL-friendly |
| `description` | TEXT | | Mô tả |
| `icon` | VARCHAR(50) | | Icon name |
| `parent_id` | UUID | FOREIGN KEY → Categories(id) | Danh mục cha |
| `order` | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái |

**Indexes:**
- `idx_categories_slug` on `slug`
- `idx_categories_parent` on `parent_id`

---

## 4. Site_Categories (Liên kết địa điểm - danh mục)

Bảng trung gian liên kết nhiều-nhiều giữa Sites và Categories.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `category_id` | UUID | FOREIGN KEY → Categories(id) | ID danh mục |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Unique Constraint:** `(site_id, category_id)`

**Indexes:**
- `idx_site_categories_site` on `site_id`
- `idx_site_categories_category` on `category_id`

---

## 5. Reviews (Đánh giá)

Lưu trữ đánh giá của người dùng về địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID đánh giá |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `rating` | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Điểm đánh giá (1-5) |
| `comment` | TEXT | | Nội dung đánh giá |
| `images` | JSON | | Mảng URL ảnh |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái |

**Unique Constraint:** `(site_id, user_id)` - Mỗi user chỉ review 1 lần cho 1 site

**Indexes:**
- `idx_reviews_site` on `site_id`
- `idx_reviews_user` on `user_id`
- `idx_reviews_rating` on `rating`

---

## 6. Favorites (Yêu thích)

Lưu trữ danh sách địa điểm yêu thích của người dùng.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian thêm |

**Unique Constraint:** `(user_id, site_id)`

**Indexes:**
- `idx_favorites_user` on `user_id`
- `idx_favorites_site` on `site_id`

---

## 7. Check_Ins (Check-in)

Lưu trữ lịch sử check-in của người dùng tại các địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID check-in |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `lat` | DECIMAL(10, 8) | | Vĩ độ check-in |
| `lng` | DECIMAL(11, 8) | | Kinh độ check-in |
| `note` | TEXT | | Ghi chú |
| `images` | JSON | | Mảng URL ảnh |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian check-in |

**Indexes:**
- `idx_checkins_user` on `user_id`
- `idx_checkins_site` on `site_id`
- `idx_checkins_created` on `created_at`

---

## 8. Site_Images (Ảnh địa điểm)

Lưu trữ nhiều ảnh cho mỗi địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID ảnh |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `url` | TEXT | NOT NULL | URL ảnh |
| `caption` | VARCHAR(255) | | Mô tả ảnh |
| `uploaded_by` | UUID | FOREIGN KEY → Users(id) | Người upload |
| `order` | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian upload |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái |

**Indexes:**
- `idx_site_images_site` on `site_id`
- `idx_site_images_order` on `site_id, order`

---

## 9. Search_History (Lịch sử tìm kiếm)

Lưu trữ lịch sử tìm kiếm của người dùng.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `query` | VARCHAR(255) | NOT NULL | Từ khóa tìm kiếm |
| `lat` | DECIMAL(10, 8) | | Vĩ độ tìm kiếm |
| `lng` | DECIMAL(11, 8) | | Kinh độ tìm kiếm |
| `filters` | JSON | | Bộ lọc áp dụng |
| `results_count` | INTEGER | | Số kết quả |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tìm kiếm |

**Indexes:**
- `idx_search_history_user` on `user_id`
- `idx_search_history_created` on `created_at`

---

## Relationships

### One-to-Many
- `Users` → `Sites` (created_by)
- `Users` → `Reviews`
- `Users` → `Check_Ins`
- `Users` → `Site_Images` (uploaded_by)
- `Users` → `Search_History`
- `Sites` → `Reviews`
- `Sites` → `Check_Ins`
- `Sites` → `Site_Images`
- `Categories` → `Categories` (parent_id - self-referencing)

### Many-to-Many
- `Sites` ↔ `Categories` (through `Site_Categories`)
- `Users` ↔ `Sites` (through `Favorites`)

---

## 10. Chat_Conversations (Cuộc hội thoại)

Lưu trữ các cuộc hội thoại chat của người dùng.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID cuộc hội thoại |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `title` | VARCHAR(255) | | Tiêu đề cuộc hội thoại |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái |

**Indexes:**
- `idx_chat_conversations_user` on `user_id`
- `idx_chat_conversations_created` on `created_at`

---

## 11. Chat_Messages (Tin nhắn chat)

Lưu trữ các tin nhắn trong cuộc hội thoại.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID tin nhắn |
| `conversation_id` | UUID | FOREIGN KEY → Chat_Conversations(id) | ID cuộc hội thoại |
| `role` | VARCHAR(20) | NOT NULL | Vai trò (user/assistant) |
| `content` | TEXT | NOT NULL | Nội dung tin nhắn |
| `metadata` | JSON | | Metadata (intent, entities, etc.) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Indexes:**
- `idx_chat_messages_conversation` on `conversation_id`
- `idx_chat_messages_created` on `created_at`

---

## 12. Chat_Search_Results (Kết quả tìm kiếm từ chat)

Lưu trữ kết quả tìm kiếm được trả về trong chat.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID |
| `message_id` | UUID | FOREIGN KEY → Chat_Messages(id) | ID tin nhắn |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `rank` | INTEGER | | Thứ tự hiển thị |
| `relevance_score` | DECIMAL(5, 4) | | Điểm liên quan (0-1) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Indexes:**
- `idx_chat_search_message` on `message_id`
- `idx_chat_search_site` on `site_id`

---

## 13. Advertising_Plans (Gói quảng cáo)

Định nghĩa các gói quảng cáo có sẵn.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID gói |
| `name` | VARCHAR(100) | NOT NULL | Tên gói (Basic, Premium, Enterprise) |
| `description` | TEXT | | Mô tả gói |
| `duration_days` | INTEGER | NOT NULL | Số ngày hiệu lực |
| `price` | DECIMAL(10, 2) | NOT NULL | Giá gói |
| `features` | JSON | | Tính năng (priority_boost, featured_badge, etc.) |
| `max_sites` | INTEGER | | Số địa điểm tối đa |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Indexes:**
- `idx_advertising_plans_active` on `is_active`

---

## 14. Site_Advertisements (Quảng cáo địa điểm)

Lưu trữ thông tin quảng cáo của từng địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID quảng cáo |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `plan_id` | UUID | FOREIGN KEY → Advertising_Plans(id) | ID gói quảng cáo |
| `owner_id` | UUID | FOREIGN KEY → Users(id) | ID chủ sở hữu |
| `start_date` | TIMESTAMP | NOT NULL | Ngày bắt đầu |
| `end_date` | TIMESTAMP | NOT NULL | Ngày kết thúc |
| `status` | VARCHAR(20) | NOT NULL | Trạng thái (active, expired, cancelled) |
| `priority_boost` | INTEGER | DEFAULT 0 | Độ ưu tiên hiển thị |
| `is_featured` | BOOLEAN | DEFAULT FALSE | Hiển thị nổi bật |
| `impressions` | INTEGER | DEFAULT 0 | Số lần hiển thị |
| `clicks` | INTEGER | DEFAULT 0 | Số lần click |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

**Indexes:**
- `idx_site_ads_site` on `site_id`
- `idx_site_ads_status` on `status`
- `idx_site_ads_dates` on `start_date, end_date`
- `idx_site_ads_owner` on `owner_id`

---

## 15. Payments (Thanh toán)

Lưu trữ lịch sử thanh toán.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID thanh toán |
| `advertisement_id` | UUID | FOREIGN KEY → Site_Advertisements(id) | ID quảng cáo |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người thanh toán |
| `amount` | DECIMAL(10, 2) | NOT NULL | Số tiền |
| `currency` | VARCHAR(3) | DEFAULT 'VND' | Loại tiền tệ |
| `payment_method` | VARCHAR(50) | | Phương thức (card, bank_transfer, momo, etc.) |
| `transaction_id` | VARCHAR(255) | UNIQUE | ID giao dịch từ payment gateway |
| `status` | VARCHAR(20) | NOT NULL | Trạng thái (pending, completed, failed, refunded) |
| `metadata` | JSON | | Thông tin bổ sung |
| `paid_at` | TIMESTAMP | | Thời gian thanh toán |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Indexes:**
- `idx_payments_user` on `user_id`
- `idx_payments_advertisement` on `advertisement_id`
- `idx_payments_status` on `status`
- `idx_payments_transaction` on `transaction_id`

---

## 16. Contact_Requests (Yêu cầu liên hệ)

Lưu trữ yêu cầu liên hệ từ người dùng đến địa điểm (có tính phí).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID yêu cầu |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `message` | TEXT | | Nội dung liên hệ |
| `contact_info` | JSON | | Thông tin liên hệ (phone, email) |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Trạng thái (pending, contacted, completed) |
| `fee_charged` | DECIMAL(10, 2) | | Phí thu (nếu có) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `responded_at` | TIMESTAMP | | Thời gian phản hồi |

**Indexes:**
- `idx_contact_requests_user` on `user_id`
- `idx_contact_requests_site` on `site_id`
- `idx_contact_requests_status` on `status`

---

## 17. Site_Notes (Ghi chú cá nhân)

Lưu trữ ghi chú cá nhân của người dùng về các địa điểm.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | ID ghi chú |
| `user_id` | UUID | FOREIGN KEY → Users(id) | ID người dùng |
| `site_id` | UUID | FOREIGN KEY → Sites(id) | ID địa điểm |
| `session_id` | VARCHAR(255) | | Session ID (cho người dùng chưa đăng nhập) |
| `title` | VARCHAR(255) | | Tiêu đề ghi chú |
| `content` | TEXT | NOT NULL | Nội dung ghi chú |
| `tags` | JSON | | Tags/nhãn (wifi, quiet, outdoor, etc.) |
| `visit_date` | DATE | | Ngày ghé thăm |
| `rating_personal` | INTEGER | CHECK (rating_personal >= 1 AND rating_personal <= 5) | Đánh giá cá nhân (1-5) |
| `is_private` | BOOLEAN | DEFAULT TRUE | Riêng tư hay công khai |
| `images` | JSON | | Mảng URL ảnh đính kèm |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

**Indexes:**
- `idx_site_notes_user` on `user_id`
- `idx_site_notes_site` on `site_id`
- `idx_site_notes_session` on `session_id`
- `idx_site_notes_created` on `created_at`

**Notes:**
- Hỗ trợ cả user đã đăng nhập (`user_id`) và chưa đăng nhập (`session_id`)
- Session-based notes lưu trong browser localStorage
- Tags giúp tổ chức và tìm kiếm ghi chú
- Personal rating riêng biệt với public rating
- Images cho phép user lưu ảnh riêng của họ

---

## Relationships (Updated)

### One-to-Many
- `Users` → `Sites` (created_by)
- `Users` → `Reviews`
- `Users` → `Check_Ins`
- `Users` → `Site_Images` (uploaded_by)
- `Users` → `Search_History`
- `Users` → `Chat_Conversations`
- `Users` → `Site_Advertisements` (owner_id)
- `Users` → `Payments`
- `Users` → `Contact_Requests`
- `Users` → `Site_Notes`
- `Sites` → `Reviews`
- `Sites` → `Check_Ins`
- `Sites` → `Site_Images`
- `Sites` → `Site_Advertisements`
- `Sites` → `Chat_Search_Results`
- `Sites` → `Contact_Requests`
- `Sites` → `Site_Notes`
- `Categories` → `Categories` (parent_id - self-referencing)
- `Chat_Conversations` → `Chat_Messages`
- `Chat_Messages` → `Chat_Search_Results`
- `Advertising_Plans` → `Site_Advertisements`
- `Site_Advertisements` → `Payments`

### Many-to-Many
- `Sites` ↔ `Categories` (through `Site_Categories`)
- `Users` ↔ `Sites` (through `Favorites`)

---

## Notes

### Chat-Based Search Features
- Sử dụng NLP để phân tích intent và entities từ tin nhắn người dùng
- Lưu trữ context cuộc hội thoại để cải thiện kết quả tìm kiếm
- Tracking relevance score để tối ưu thuật toán ranking
- Metadata trong Chat_Messages lưu thông tin như: detected_intent, extracted_filters, user_location

### Personal Note-Taking Features
- **Session-based notes**: Users không cần đăng nhập, notes lưu theo session_id
- **Rich content**: Title, content, tags, personal rating, visit date
- **Photo attachments**: Users có thể đính kèm ảnh riêng
- **Privacy control**: Notes mặc định là private, có thể share nếu muốn
- **Tagging system**: Tổ chức notes theo tags (wifi, quiet, outdoor, good-coffee, etc.)
- **Personal vs Public rating**: Rating cá nhân riêng biệt với rating công khai
- **Quick access**: Xem lại notes khi search lại địa điểm đó
- **Export/Sync**: Có thể export notes hoặc sync khi đăng nhập sau

### Advertising & Monetization
- **Priority Boost**: Địa điểm quảng cáo xuất hiện cao hơn trong kết quả tìm kiếm
- **Featured Badge**: Hiển thị badge "Nổi bật" hoặc "Sponsored"
- **Impressions & Clicks**: Tracking để tính phí theo CPM/CPC nếu cần
- **Contact Fee**: Thu phí khi người dùng yêu cầu liên hệ trực tiếp với địa điểm
- **Flexible Plans**: Hỗ trợ nhiều gói quảng cáo với tính năng khác nhau

### Spatial Queries
- Sử dụng PostGIS extension cho PostgreSQL để tối ưu spatial queries
- Index spatial cho `lat, lng` trong bảng Sites
- Hỗ trợ tìm kiếm địa điểm trong bán kính

### Performance Optimization
- Index trên các trường thường xuyên query (email, place_id, location)
- Partition bảng lớn như Check_Ins, Search_History, Chat_Messages theo thời gian
- Cache rating và review_count trong bảng Sites
- Cache impressions và clicks trong Site_Advertisements

### Data Integrity
- Cascade delete cho các bảng liên quan khi xóa User hoặc Site
- Trigger để tự động cập nhật `updated_at`
- Trigger để cập nhật `rating` và `review_count` trong Sites khi có review mới
- Trigger để cập nhật `status` trong Site_Advertisements khi hết hạn
- Trigger để tính toán impressions/clicks

### Security
- Hash passwords nếu không dùng Clerk
- Validate coordinates (lat: -90 to 90, lng: -180 to 180)
- Sanitize user input để tránh SQL injection
- Encrypt sensitive payment information
- Rate limiting cho Contact_Requests để tránh spam

### Business Logic
- Tự động expire quảng cáo khi `end_date` qua
- Tính phí liên hệ dựa trên gói quảng cáo của địa điểm
- Tracking ROI cho chủ địa điểm (impressions, clicks, contacts)
- Email notification khi quảng cáo sắp hết hạn
