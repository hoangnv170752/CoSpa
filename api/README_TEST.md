# API Testing Examples

## Quick Test with cURL

### Test 1: User in Hanoi (near Hoan Kiem Lake)

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm coworking space gần Hồ Gươm, Hà Nội",
    "history": [],
    "user_location": {
      "lat": 21.0285,
      "lng": 105.8542
    }
  }'
```

**Expected Result:** Only locations in Hanoi, within 30km radius, clustered within 20km of each other.

---

### Test 2: User in Ho Chi Minh City (District 1)

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm quán cafe làm việc ở Quận 1, TP.HCM",
    "history": [],
    "user_location": {
      "lat": 10.7769,
      "lng": 106.7009
    }
  }'
```

**Expected Result:** Only locations in Ho Chi Minh City, no Hanoi locations mixed in.

---

### Test 3: User in Hanoi Cau Giay District

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm chỗ học yên tĩnh, có wifi mạnh ở Cầu Giấy",
    "history": [],
    "user_location": {
      "lat": 21.0278,
      "lng": 105.7826
    }
  }'
```

---

### Test 4: With Conversation History

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Có chỗ nào mở cửa muộn không?",
    "history": [
      {
        "role": "user",
        "content": "Tìm coworking ở Hoàn Kiếm"
      },
      {
        "role": "assistant",
        "content": "Mình tìm thấy một số coworking space ở Hoàn Kiếm..."
      }
    ],
    "user_location": {
      "lat": 21.0285,
      "lng": 105.8542
    }
  }'
```

---

### Test 5: Without User Location

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm coworking space ở Hà Nội",
    "history": []
  }'
```

**Expected Result:** AI will ask for specific ward/district location.

---

## Using the Test Script

Make the script executable and run:

```bash
chmod +x test_api.sh
./test_api.sh
```

This will run all test cases automatically.

---

## Key Coordinates for Testing

### Hanoi Locations:
- **Hoan Kiem Lake**: `21.0285, 105.8542`
- **Cau Giay District**: `21.0278, 105.7826`
- **Dong Da District**: `21.0122, 105.8255`
- **Ba Dinh District**: `21.0333, 105.8189`

### Ho Chi Minh City Locations:
- **District 1**: `10.7769, 106.7009`
- **District 3**: `10.7860, 106.6834`
- **Binh Thanh**: `10.8142, 106.7012`
- **Thao Dien (District 2)**: `10.8030, 106.7366`

---

## Expected Response Format

```json
{
  "reply": "AI response in Vietnamese or English...",
  "locations": [
    {
      "id": "uuid",
      "name": "Location Name",
      "type": "coworking space",
      "brand": "Brand Name",
      "rating": 4.5,
      "review_count": 100,
      "address": "Full address",
      "distance": "2.5 km",
      "lat": 21.0285,
      "lng": 105.8542,
      "phone_number": "+84 xxx xxx xxx",
      "link_google": "https://maps.google.com/...",
      "link_web": "https://...",
      "thumbnail_url": "https://...",
      "amenities": ["wifi", "meeting rooms", "quiet space"],
      "isSponsored": false,
      "description": "Description..."
    }
  ]
}
```

---

## Validation Checks

✅ **Distance Validation:**
- All locations within 30km from user
- All locations within 20km of each other
- No mixing of different cities

✅ **Coordinate Validation:**
- All locations have valid lat/lng
- Coordinates are in Vietnam range

✅ **Response Quality:**
- AI responds in same language as user
- Specific location details mentioned
- Budget and amenities considered
