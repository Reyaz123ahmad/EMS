# Phase 3B API Testing & UI Mapping Documentation

## Overview
Phase 3B provides full support for employee identity card generation, tamper-proof cryptographic QR code issuance with HMAC-SHA256 signatures, print-ready PDF card badge rendering, physical card assignment (RFID/NFC), biometric device management with secure API keys, and push-based punch ingestion.

---

## 1. Biometric Cards API Endpoints

### 1.1 Generate QR Card Badge
- **Method / Path:** `POST /api/v1/biometric/cards/generate`
- **Auth:** JWT (HR_ADMIN, HR_MANAGER, COMPANY_ADMIN, SUPER_ADMIN)
- **Feature Required:** `attendance.card`
- **Full Payload:**
```json
{
  "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cardType": "QR",
  "expiresAt": "2027-12-31T23:59:59.000Z"
}
```
- **Response (201 Created):**
```json
{
  "status": "ok",
  "message": "Card generated successfully with QR and PDF badge",
  "data": {
    "id": "card_uuid",
    "cardNumber": "EMP0001",
    "cardType": "QR",
    "qrUrl": "https://res.cloudinary.com/.../qr_EMP0001.png",
    "pdfUrl": "https://res.cloudinary.com/.../card_EMP0001.pdf",
    "qrSignature": "3f98a28e8...",
    "regenerationCount": 0,
    "isActive": true,
    "expiresAt": "2027-12-31T23:59:59.000Z"
  }
}
```
- **UI Screen:** `/biometric/cards/generate`

---

### 1.2 Assign Physical Card (RFID / NFC)
- **Method / Path:** `POST /api/v1/biometric/cards/assign`
- **Auth:** JWT (HR_ADMIN, HR_MANAGER, COMPANY_ADMIN, SUPER_ADMIN)
- **Feature Required:** `attendance.card`
- **Full Payload:**
```json
{
  "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cardNumber": "RFID-887722",
  "cardType": "RFID",
  "expiresAt": "2028-01-01T00:00:00.000Z"
}
```
- **Response (201 Created):**
```json
{
  "status": "ok",
  "message": "Physical card assigned successfully",
  "data": {
    "id": "card_uuid",
    "cardNumber": "RFID-887722",
    "cardType": "RFID",
    "isActive": true
  }
}
```

---

### 1.3 Regenerate QR Code
- **Method / Path:** `POST /api/v1/biometric/cards/:id/regenerate`
- **Auth:** JWT (HR_ADMIN, COMPANY_ADMIN, SUPER_ADMIN)
- **Response (200 OK):**
```json
{
  "status": "ok",
  "message": "QR code and badge regenerated successfully",
  "data": {
    "id": "card_uuid",
    "regenerationCount": 1,
    "qrUrl": "https://res.cloudinary.com/.../new_qr.png"
  }
}
```

---

### 1.4 Deactivate Card
- **Method / Path:** `POST /api/v1/biometric/cards/:id/deactivate`
- **Auth:** JWT (HR_ADMIN, COMPANY_ADMIN, SUPER_ADMIN)
- **Full Payload:**
```json
{
  "reason": "Lost card reported by employee"
}
```
- **Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Card deactivated successfully",
  "data": {
    "id": "card_uuid",
    "isActive": false,
    "deactivationReason": "Lost card reported by employee"
  }
}
```

---

### 1.5 Public QR Verification
- **Method / Path:** `POST /api/v1/biometric/cards/verify-qr`
- **Auth:** Public (No token required)
- **Full Payload:**
```json
{
  "qrData": "{\"v\":1,\"employeeId\":\"...\",\"companyId\":\"...\",\"cardNumber\":\"EMP0001\",\"issuedAt\":\"...\",\"expiresAt\":\"...\",\"signature\":\"...\"}"
}
```
- **Response (200 OK):**
```json
{
  "status": "ok",
  "message": "QR Code verified successfully",
  "data": {
    "valid": true,
    "employee": {
      "name": "Jane Doe",
      "employeeCode": "EMP-001",
      "department": "Engineering"
    },
    "card": {
      "cardNumber": "EMP0001",
      "isActive": true
    }
  }
}
```
- **UI Screen:** `/verify-qr` (Public terminal)

---

## 2. Card Attendance Scan API

### 2.1 Card Scan Attendance Punch
- **Method / Path:** `POST /api/v1/attendance/card-scan`
- **Auth:** JWT (EMPLOYEE, MANAGER, HR_MANAGER, HR_ADMIN, COMPANY_ADMIN, SUPER_ADMIN)
- **Feature Required:** `attendance.card`
- **Full Payload:**
```json
{
  "qrData": "{\"v\":1,\"employeeId\":\"...\",\"companyId\":\"...\",\"cardNumber\":\"EMP0001\",\"issuedAt\":\"...\",\"expiresAt\":\"...\",\"signature\":\"...\"}",
  "operation": "CHECK_IN",
  "breakType": "SHORT",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "accuracy": 8,
    "source": "gps",
    "timestamp": 1727280000000
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 ...",
    "platform": "Win32",
    "isMockLocation": false
  },
  "remarks": "On-site card attendance scan"
}
```
- **Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Card attendance scanned and processed successfully",
  "data": {
    "id": "attendance_uuid",
    "attendanceMethod": "CARD",
    "cardNumber": "EMP0001",
    "checkInAt": "2026-09-25T14:30:00.000Z",
    "status": "PRESENT"
  }
}
```

---

## 3. Biometric Devices API

### 3.1 Create Device
- **Method / Path:** `POST /api/v1/biometric/devices`
- **Auth:** JWT (HR_ADMIN, COMPANY_ADMIN, SUPER_ADMIN)
- **Feature Required:** `attendance.finger`
- **Full Payload:**
```json
{
  "name": "Main Entrance Fingerprint Reader",
  "serialNumber": "ZKT-BIO-2026-X1",
  "deviceType": "FINGERPRINT",
  "ipAddress": "192.168.1.150",
  "port": 4370
}
```
- **Response (201 Created):**
```json
{
  "status": "ok",
  "message": "Biometric device registered successfully. Secure API key generated.",
  "data": {
    "id": "device_uuid",
    "name": "Main Entrance Fingerprint Reader",
    "serialNumber": "ZKT-BIO-2026-X1",
    "apiKey": "ems_dev_9a8b7c6d5e...",
    "isActive": true,
    "isOnline": false
  }
}
```

---

### 3.2 Device Push Attendance Punch
- **Method / Path:** `POST /api/v1/biometric/push`
- **Auth:** Device Header: `x-api-key: ems_dev_...`
- **Full Payload:**
```json
{
  "cardNumber": "EMP0001",
  "punchType": "AUTO",
  "verification": "FINGERPRINT",
  "punchedAt": "2026-09-25T14:35:00.000Z",
  "rawPayload": {
    "firmware": "v3.2.1",
    "quality": 98
  }
}
```
- **Response (201 Created):**
```json
{
  "status": "ok",
  "message": "Punch received and recorded successfully",
  "data": {
    "received": true,
    "punchId": "punch_uuid",
    "processed": true
  }
}
```

---

## 4. UI Screen Mapping Matrix

| Route | Page Component | Allowed Roles | Core Functionality |
|---|---|---|---|
| `/biometric/cards` | `CardListPage.jsx` | HR_ADMIN, HR_MANAGER, COMPANY_ADMIN | Search, filter, view cards, download PDFs, regenerate QR |
| `/biometric/cards/generate` | `GenerateCardPage.jsx` | HR_ADMIN, HR_MANAGER, COMPANY_ADMIN | Form + Live Badge preview + PDF generation |
| `/biometric/cards/:id` | `CardDetailPage.jsx` | HR_ADMIN, HR_MANAGER, COMPANY_ADMIN, EMPLOYEE | Full badge preview, cryptographic audit, actions |
| `/biometric/devices` | `DeviceListPage.jsx` | HR_ADMIN, COMPANY_ADMIN | Device list, live heartbeat, API key generator modal |
| `/biometric/devices/:id` | `DeviceDetailPage.jsx` | HR_ADMIN, COMPANY_ADMIN | Real-time punch feed, reprocess failed punches |
| `/attendance` | `AttendancePage.jsx` | ALL | Punch terminal with integrated camera QR scanner |
| `/verify-qr` | `VerifyQRPage.jsx` | PUBLIC | Zero-auth camera QR verification terminal |
