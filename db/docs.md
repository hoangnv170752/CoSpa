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

## Notes

### Spatial Queries
- Sử dụng PostGIS extension cho PostgreSQL để tối ưu spatial queries
- Index spatial cho `lat, lng` trong bảng Sites
- Hỗ trợ tìm kiếm địa điểm trong bán kính

### Performance Optimization
- Index trên các trường thường xuyên query (email, place_id, location)
- Partition bảng lớn như Check_Ins, Search_History theo thời gian
- Cache rating và review_count trong bảng Sites

### Data Integrity
- Cascade delete cho các bảng liên quan khi xóa User hoặc Site
- Trigger để tự động cập nhật `updated_at`
- Trigger để cập nhật `rating` và `review_count` trong Sites khi có review mới

### Security
- Hash passwords nếu không dùng Clerk
- Validate coordinates (lat: -90 to 90, lng: -180 to 180)
- Sanitize user input để tránh SQL injection
