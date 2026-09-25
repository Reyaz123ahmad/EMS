# Phase 3A API Test Report: Multi-Layer Biometric Attendance & Security Engine

## 1. System Overview
Phase 3A delivers the core Biometric Attendance Engine for the Mindstocs EMS SaaS platform. It integrates:
1. **Interactive 3D Depth & Gesture Liveness Layer** (Anti-deepfake, 2D photograph spoof detection).
2. **128-D Cosine Facial Vector Matcher** (75% minimum similarity threshold against enrolled profile embedding).
3. **Haversine GPS Geofencing** (Calculates radial distance to assigned office branch; restricts punches outside geofence radius).
4. **Device Integrity Attestation & Mock GPS Detector** (Detects fake location providers, spoofed frameworks, and untrusted hardware).
5. **Shift Rules & Late Arrival Computation** (Late arrival calculation, net worked hours, overtime accumulation, break limits).
6. **Break Management** (`BREAK_START`, `BREAK_END` with active session tracking).
7. **Audit Trail & Fraud Signal Incident Review System** (`OUT_OF_GEOFENCE`, `MOCK_LOCATION`, `GPS_ACCURACY_LOW`, `FACE_MISMATCH`).

---

## 2. API Endpoints & Payloads

### 2.1 POST /api/v1/attendance/check-in
- **Access**: `EMPLOYEE`, `MANAGER`, `HR_MANAGER`, `HR_ADMIN`, `COMPANY_ADMIN`
- **Features Required**: `attendance` (with active subscription)
- **Full Payload Example**:
```json
{
  "mode": "face",
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "accuracy": 10,
    "source": "gps",
    "timestamp": 1700000000000
  },
  "deviceInfo": {
    "deviceId": "device-abc-123",
    "isMockLocation": false,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "platform": "Win32",
    "osVersion": "11",
    "appVersion": "2.0.0"
  },
  "cardNumber": null,
  "remarks": "Morning shift check-in",
  "livenessScore": 0.95
}
```

### 2.2 POST /api/v1/attendance/check-out
- **Access**: `EMPLOYEE`, `MANAGER`, `HR_MANAGER`, `HR_ADMIN`, `COMPANY_ADMIN`
- **Full Payload Example**:
```json
{
  "mode": "face",
  "photo": "data:image/jpeg;base64,...",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "accuracy": 8,
    "source": "gps"
  },
  "deviceInfo": {
    "deviceId": "device-abc-123",
    "isMockLocation": false
  },
  "remarks": "Shift finished"
}
```

### 2.3 POST /api/v1/attendance/break-start
- **Full Payload Example**:
```json
{
  "mode": "face",
  "breakType": "TEA_BREAK",
  "deviceInfo": { "deviceId": "device-abc-123" },
  "remarks": "15 min coffee break"
}
```

### 2.4 POST /api/v1/attendance/break-end
- **Full Payload Example**:
```json
{
  "mode": "face",
  "deviceInfo": { "deviceId": "device-abc-123" },
  "remarks": "Resuming work"
}
```

### 2.5 GET /api/v1/attendance/today
- **Access**: All authenticated employees & managers
- **Response**: Today's active attendance log, breaks list, `isCheckedIn` boolean, `isOnBreak` boolean.

### 2.6 GET /api/v1/attendance/logs
- **Access**: `HR_MANAGER`, `HR_ADMIN`, `COMPANY_ADMIN`, `SUPER_ADMIN`
- **Query Filters**: `page`, `limit`, `startDate`, `endDate`, `status`, `employeeId`, `departmentId`, `branchId`, `search`.

### 2.7 GET /api/v1/attendance/monthly-summary
- **Query Params**: `month`, `year`, `departmentId`, `branchId`.

### 2.8 GET /api/v1/attendance/stats
- **Query Params**: `date` (ISO string).

### 2.9 POST /api/v1/attendance-security/liveness/challenge
- **Payload**: `{ "employeeId": "uuid" }`
- **Response**: `{ "challengeId": "uuid", "challengeType": "BLINK", "expiresIn": 30 }`

### 2.10 POST /api/v1/attendance-security/liveness/verify
- **Payload**: `{ "employeeId": "uuid", "challengeId": "uuid", "livenessScore": 0.94 }`
- **Response**: `{ "passed": true, "score": 0.94 }`

### 2.11 GET /api/v1/attendance/fraud-signals & POST /api/v1/attendance/fraud-signals/:id/review
- **Access**: `HR_ADMIN`, `COMPANY_ADMIN`, `SUPER_ADMIN`

---

## 3. Test Cases & Execution Matrix

| Test ID | Endpoint | Test Scenario | Input Payload Summary | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | `POST /attendance-security/liveness/challenge` | Active challenge generation | `{ employeeId }` | `200 OK`, `challengeId` & `challengeType` | **PASS** |
| **TC-02** | `POST /attendance-security/liveness/verify` | Interactive gesture score verification | `{ challengeId, livenessScore: 0.95 }` | `200 OK`, `passed: true` | **PASS** |
| **TC-03** | `POST /attendance/check-in` | Full payload check-in within geofence | All fields: `mode`, `photo`, `location`, `deviceInfo`, `cardNumber` | `200 OK`, `status: PRESENT / LATE` | **PASS** |
| **TC-04** | `POST /attendance/check-in` | Duplicate punch on same calendar day | Valid check-in payload | `400 Bad Request`, `already checked in` | **PASS** |
| **TC-05** | `POST /attendance/break-start` | Initiate shift break session | `{ breakType: "TEA_BREAK" }` | `200 OK`, `breakStartAt` timestamp | **PASS** |
| **TC-06** | `POST /attendance/break-end` | Conclude break & record net duration | `{ deviceInfo }` | `200 OK`, `totalBreakMinutes` calculated | **PASS** |
| **TC-07** | `POST /attendance/check-out` | Geofence perimeter breach | Bangalore GPS coords vs Delhi Branch | `403 Forbidden`, `Location verification failed` | **PASS** |
| **TC-08** | `POST /attendance/check-out` | Mock GPS Location Tampering | `{ deviceInfo: { isMockLocation: true } }` | `403 Forbidden`, `Mock location detected` | **PASS** |
| **TC-09** | `POST /attendance/check-out` | Full payload shift conclusion | Valid GPS inside office radius | `200 OK`, `totalWorkedMinutes`, `overtimeMinutes` | **PASS** |
| **TC-10** | `GET /attendance/today` | Fetch active employee today state | Auth Header | `200 OK`, `attendance` & `breaks` | **PASS** |
| **TC-11** | `GET /attendance/logs` | Query logs with date range and status filters | `?page=1&limit=20` | `200 OK`, paginated logs | **PASS** |
| **TC-12** | `GET /attendance/monthly-summary` | Aggregated monthly attendance stats | `?month=9&year=2026` | `200 OK`, `present`, `absent`, `late`, `overtime` | **PASS** |
| **TC-13** | `GET /attendance/stats` | Executive punctuality & attendance rates | `?date=2026-09-25` | `200 OK`, `attendanceRate`, `punctualityRate` | **PASS** |
| **TC-14** | `GET /attendance/fraud-signals` | List security violation alerts | `HR_ADMIN` token | `200 OK`, `signals` list | **PASS** |
| **TC-15** | `POST /attendance/fraud-signals/:id/review`| Review & resolve security alert | `{ status: "RESOLVED", reviewNotes }` | `200 OK`, `reviewed: true` | **PASS** |
| **TC-16** | `POST /attendance/check-in` | Unauthorized request without JWT | Missing Bearer token | `401 Unauthorized` | **PASS** |

---

## 4. UI Field to API Mapping

| UI Component | User Facing Field | API Payload Key | Validation Rule |
| :--- | :--- | :--- | :--- |
| `ModeSelector.jsx` | Mode selection button | `mode` | One of `['face', 'card', 'finger']` |
| `CameraCapture.jsx` | Live snapshot frame | `photo` | Base64 JPEG Data URL string |
| `GeoLocation.jsx` | GPS latitude | `location.lat` | Decimal number between -90 and 90 |
| `GeoLocation.jsx` | GPS longitude | `location.lng` | Decimal number between -180 and 180 |
| `GeoLocation.jsx` | Satellite accuracy | `location.accuracy` | Number in meters (≤ 50m required) |
| `LivenessCheck.jsx`| Gesture verification score | `livenessScore` | Float between 0.0 and 1.0 (≥ 0.75 passes) |
| Device telemetry | Hardware & platform info | `deviceInfo` | `{ deviceId, isMockLocation, ipAddress, userAgent }` |
| `AttendancePage.jsx`| Optional remarks | `remarks` | Max 500 characters string |
| `AttendancePage.jsx`| RFID Smart Card tap | `cardNumber` | Alphanumeric card string |
