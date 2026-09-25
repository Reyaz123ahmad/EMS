# Phase 3C API Test Matrix & UI Screen Mapping

## 1. Face Registration Endpoints (`/api/v1/face`)

| Method | Endpoint | Description | Access Control | Full Payload Sample | Expected Output | UI Screen |
|---|---|---|---|---|---|---|
| `POST` | `/register` | Enroll employee face (512-dim embedding) | `HR_ADMIN`, `COMPANY_ADMIN` | `{ "employeeId": "uuid", "photo": "data:image/jpeg;base64,...", "livenessScore": 0.96 }` | `201 Created` with encrypted vector | `RegisterFacePage.jsx` |
| `PUT` | `/update` | Update enrolled face | `HR_ADMIN`, `COMPANY_ADMIN` | `{ "employeeId": "uuid", "photo": "data:image/jpeg;base64,...", "livenessScore": 0.95 }` | `200 OK` | `RegisterFacePage.jsx` |
| `DELETE` | `/delete` | Reset enrolled face | `HR_ADMIN`, `COMPANY_ADMIN` | `{ "employeeId": "uuid", "reason": "Administrative reset" }` | `200 OK` | `FaceStatusPage.jsx` |
| `POST` | `/verify` | Cosine similarity check | `EMPLOYEE`+ | `{ "employeeId": "uuid", "photo": "data:image/jpeg;base64,..." }` | `200 OK` (score >= 0.85) | `AttendancePage.jsx` |
| `GET` | `/status/:employeeId` | Face enrollment status | `EMPLOYEE`+ | None | `200 OK` | `FaceStatusPage.jsx` |
| `GET` | `/with-face` | List enrolled employees | `HR_MANAGER`+ | `?page=1&limit=10&search=John` | `200 OK` (paginated) | `FaceStatusPage.jsx` |
| `GET` | `/without-face` | List pending employees | `HR_MANAGER`+ | `?page=1&limit=10` | `200 OK` (paginated) | `BulkRegisterFacePage.jsx` |
| `POST` | `/bulk-register` | Batch enrollment | `HR_ADMIN`, `COMPANY_ADMIN` | `{ "employeeIds": ["uuid1", "uuid2"] }` | `200 OK` (success/failed stats) | `BulkRegisterFacePage.jsx` |
| `GET` | `/stats` | Face telemetry stats | `HR_MANAGER`+ | None | `200 OK` (percentage coverage) | `FaceStatsPage.jsx` |
| `GET` | `/export` | Export encrypted vectors | `COMPANY_ADMIN`, `SUPER_ADMIN` | None | `200 OK` (encrypted backup) | Admin Console |

---

## 2. Finger Attendance Endpoints (`/api/v1/finger`)

| Method | Endpoint | Description | Access Control | Full Payload Sample | Expected Output | UI Screen |
|---|---|---|---|---|---|---|
| `POST` | `/enroll` | Enroll fingerprint template | `HR_MANAGER`+ | `{ "employeeId": "uuid", "fingerIndex": 1, "template": "base64", "templateFormat": "ISO", "deviceId": "uuid" }` | `201 Created` | `FingerEnrollmentPage.jsx` |
| `DELETE` | `/enroll/:employeeId/:fingerIndex` | Delete fingerprint | `HR_MANAGER`+ | None | `200 OK` | `FingerEnrollmentPage.jsx` |
| `GET` | `/enroll/:employeeId` | List enrolled fingers | `EMPLOYEE`+ | None | `200 OK` | `FingerEnrollmentPage.jsx` |
| `POST` | `/punch` | Hardware push punch | Device Auth (`x-api-key`) | `{ "employeeId": "uuid", "fingerIndex": 1, "punchType": "CHECK_IN", "verification": "FINGERPRINT", "punchedAt": "2026-09-25T15:00:00Z" }` | `201 Created` | Biometric Terminals |
| `POST` | `/punch/:id/process` | Reprocess punch | `HR_ADMIN`, `COMPANY_ADMIN` | None | `200 OK` | `FingerPunchesPage.jsx` |
| `POST` | `/sync/:deviceId` | Synchronize templates | `HR_ADMIN`, `COMPANY_ADMIN` | None | `200 OK` | `FingerDevicePage.jsx` |
| `GET` | `/punches` | List finger punches | `HR_MANAGER`+ | `?page=1&limit=10` | `200 OK` | `FingerPunchesPage.jsx` |
| `GET` | `/stats` | Fingerprint stats | `HR_MANAGER`+ | None | `200 OK` | `FingerDevicePage.jsx` |

---

## 3. Advanced Security & Zero-Trust Endpoints (`/api/v1/security`)

| Method | Endpoint | Description | Access Control | Full Payload Sample | Expected Output | UI Screen |
|---|---|---|---|---|---|---|
| `POST` | `/attest` | Hardware token attestation | `EMPLOYEE`+ | `{ "deviceId": "android-uuid", "attestationToken": "play_integrity_token", "platform": "android", "isRooted": false, "isEmulator": false }` | `200 OK` | Mobile App / Web SDK |
| `POST` | `/validate-ip` | IP whitelist check | `EMPLOYEE`+ | `{ "ipAddress": "192.168.1.15" }` | `200 OK` | `SecuritySettingsPage.jsx` |
| `POST` | `/detect-vpn` | VPN / proxy detection | `EMPLOYEE`+ | `{ "ipAddress": "10.8.0.1" }` | `200 OK` | Attendance Ingestion |
| `GET` | `/security-score` | Tenant security score | `HR_ADMIN`+ | `?employeeId=uuid` | `200 OK` (0-100 score + grade) | `SecurityDashboardPage.jsx` |
| `PUT` | `/security-settings` | Update policy settings | `COMPANY_ADMIN` | `{ "securityLevel": "HIGH", "blockVpn": true, "blockRootedDevices": true, "ipWhitelistEnabled": false, "allowedIpRanges": ["192.168.1.0/24"] }` | `200 OK` | `SecuritySettingsPage.jsx` |
| `GET` | `/dashboard` | Command center feed | `HR_ADMIN`+ | None | `200 OK` | `SecurityDashboardPage.jsx` |
| `POST` | `/fraud-signals/:id/review` | Review fraud incident | `HR_ADMIN`, `COMPANY_ADMIN` | `{ "action": "APPROVE", "notes": "Verified authentic via HR phone confirmation" }` | `200 OK` | `FraudSignalsPage.jsx` |
