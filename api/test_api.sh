#!/bin/bash

# CoSpa API Test Script
# Test chat endpoint with user location

echo "=========================================="
echo "CoSpa API - Chat Test with User Location"
echo "=========================================="
echo ""

# API endpoint
API_URL="http://localhost:8000/api/chat"

# Test 1: User in Hanoi (near Hoan Kiem Lake)
echo "Test 1: User in Hanoi - Finding coworking near Hoan Kiem"
echo "--------------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm coworking space gần Hồ Gươm, Hà Nội",
    "history": [],
    "user_location": {
      "lat": 21.0285,
      "lng": 105.8542
    }
  }' | jq '.'

echo ""
echo ""

# Test 2: User in Ho Chi Minh City (District 1)
echo "Test 2: User in HCMC - Finding cafe in District 1"
echo "--------------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm quán cafe làm việc ở Quận 1",
    "history": [],
    "user_location": {
      "lat": 10.7769,
      "lng": 106.7009
    }
  }' | jq '.'

echo ""
echo ""

# Test 3: User in Hanoi (Cau Giay district)
echo "Test 3: User in Hanoi Cau Giay - Finding quiet study space"
echo "--------------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm chỗ học yên tĩnh, có wifi mạnh",
    "history": [
      {
        "role": "user",
        "content": "Xin chào"
      },
      {
        "role": "assistant",
        "content": "Chào bạn! Mình là CoSpa, trợ lý tìm kiếm không gian làm việc. Bạn đang ở khu vực nào và cần tìm loại không gian như thế nào?"
      }
    ],
    "user_location": {
      "lat": 21.0278,
      "lng": 105.7826
    }
  }' | jq '.'

echo ""
echo ""

# Test 4: Without user location
echo "Test 4: Without user location - General query"
echo "--------------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm coworking space ở Hà Nội",
    "history": []
  }' | jq '.'

echo ""
echo "=========================================="
echo "Tests completed!"
echo "=========================================="
