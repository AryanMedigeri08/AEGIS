**DOC 02 Application Flow**

*Screen-by-Screen User Journeys, State Transitions & Error Handling*

**2.1 Top-Level Application State Machine**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p>App Launch (index.tsx)</p>
<p>│</p>
<p>├── Session exists ──────────────────▶ HOME (tabs/home)</p>
<p>│</p>
<p>└── No session ──────────────────────▶ LOGIN</p>
<p>│</p>
<p>└── Credentials verified ──────▶ HOME (tabs/home)</p>
<p>│</p>
<p>┌───────────────────┴───────────────────────┐</p>
<p>│ │</p>
<p>[ Mark Attendance ] [ Register Face ]</p>
<p>│ │</p>
<p>LIVENESS CHALLENGE REGISTER</p>
<p>(4 active challenges) (form + camera + confirm)</p>
<p>│ │</p>
<p>┌──────┴──────┐ SUCCESS</p>
<p>│ │ │</p>
<p>PASSED FAILED HOME</p>
<p>│ │</p>
<p>VERIFY (face match) Retry / Cancel → HOME</p>
<p>│</p>
<p>┌──────┴──────┐</p>
<p>│ │</p>
<p>MATCH NO MATCH</p>
<p>│ │</p>
<p>ATTENDANCE SUCCESS Retry / Cancel → HOME</p>
<p>│</p>
<p>HOME (auto-redirect 8s)</p>
<p></p>
<p>Tab Bar: Home │ Attendance │ Sync │ Profile</p></td>
</tr>
</tbody>
</table>

**2.2 Screen Inventory**

| **Screen ID** | **Route** | **Screen Name** | **Access** | **Primary Action** |
|----|----|----|----|----|
| SCR-01 | `index.tsx` | Splash Screen | System | Auto-route based on session state |
| SCR-02 | `login.tsx` | Login | All users | Enter Employee ID + Password |
| SCR-03 | `(tabs)/home.tsx` | Home Dashboard | Authenticated | Quick actions: Mark Attendance, Register, Sync, Settings |
| SCR-04 | `liveness.tsx` | Liveness Challenge | All users | Complete 4 sequential challenges (Blink → Smile → Head Left → Head Right) |
| SCR-05 | `verify.tsx` | Face Verification | All users | Camera capture + MobileFaceNet embedding match |
| SCR-06 | `register.tsx` | User Registration | Admin/All | 4-step wizard: Details → Camera → Confirm → Success |
| SCR-07 | `attendance-success.tsx` | Attendance Confirmed | All users | Review result; auto-redirect to Home in 8s |
| SCR-08 | `(tabs)/attendance.tsx` | Attendance Log | Authenticated | View attendance history with sync status |
| SCR-09 | `(tabs)/sync.tsx` | Sync & Purge | Authenticated | Trigger sync; view pending/synced/failed counts |
| SCR-10 | `(tabs)/profile.tsx` | Profile & Settings | Authenticated | User info, logout, clear data |

**2.3 Authentication Flow (Primary Happy Path)**

| **Step** | **Screen** | **User Action** | **System Action** | **Next State** |
|----|----|----|----|----|
| 1 | SCR-03 Home | Tap 'Mark Attendance' | Navigate to Liveness screen | → SCR-04 Liveness |
| 2 | SCR-04 Liveness | Position face in camera | BlazeFace runs on each frame via frame processor; confidence > 0.7 triggers face detected state | → FACE_DETECTING → CHALLENGE_ACTIVE |
| 3 | SCR-04 Liveness | Perform Blink challenge | Iris Landmark model detects eyelid aperture; 8s timeout; up to 2 retries | → Blink passed |
| 4 | SCR-04 Liveness | Perform Smile challenge | Face Landmark (468-pt mesh) detects mouth landmark changes; 8s timeout | → Smile passed |
| 5 | SCR-04 Liveness | Perform Head Left challenge | Face Landmark detects leftward pose rotation; 8s timeout | → Head Left passed |
| 6 | SCR-04 Liveness | Perform Head Right challenge | Face Landmark detects rightward pose rotation; 8s timeout | → Head Right passed |
| 7 | SCR-04 Liveness | All 4 challenges passed | FASNet anti-spoof check (simulated); transition to Verify | → SCR-05 Verify |
| 8 | SCR-05 Verify | Tap 'Verify Identity' | BlazeFace detects face → MobileFaceNet generates 192-dim embedding → cosine similarity vs all enrolled users | → PROCESSING |
| 9a | SCR-05 Verify | Match found (score ≥ 0.55) | Display ResultCard with employee name, ID, and confidence score | → SUCCESS |
| 9b | SCR-05 Verify | No match | Display failure ResultCard with 'Try Again' / 'Cancel' options | → FAILURE |
| 10 | SCR-05 Verify (SUCCESS) | Tap 'Mark Attendance' | Write attendance log to AsyncStorage (syncStatus='pending'); navigate with params | → SCR-07 Attendance Success |
| 11 | SCR-07 Attendance Success | View confirmation (or wait 8s) | Display name, ID, timestamp, offline badge; auto-redirect countdown | → SCR-03 Home |

**Liveness Challenge Sub-States (SCR-04)**

The liveness screen uses a `LivenessState` enum with the following progression:

| **State** | **Entry Condition** | **System Behaviour** |
|----|----|----|
| `FACE_DETECTING` | Screen opened | BlazeFace runs on camera frames; looking for confidence > 0.7; auto-transitions when face detected (1.5s in simulated mode) |
| `CHALLENGE_ACTIVE` | Face detected | Current challenge shown via ChallengeCard; ProgressSteps indicates 1/4 through 4/4; 8s countdown per challenge |
| Challenge Passed | Gesture detected by ML model (or 85% pass rate in simulated mode) | 800ms delay → advance to next challenge; reset timer to 8s |
| Challenge Failed | Timeout or ML rejection (15% fail rate in simulated mode) | 1500ms delay → retry same challenge (up to 2 retries); after 3rd failure → RESULT_FAILURE |
| `FASNET_CHECK` | All 4 challenges passed | Simulated passive anti-spoof check (1.5s); 90% pass rate → RESULT_SUCCESS; 10% → RESULT_FAILURE |
| `RESULT_SUCCESS` | FASNet passed | Shield checkmark icon; 'Proceed to Verify' button → navigates to `/verify` |
| `RESULT_FAILURE` | 3rd retry failed OR spoof detected | ResultCard with 'Try Again' (restarts all challenges) or 'Cancel' (returns to Home) |

**Challenge Order (fixed sequence):**

1. **BLINK** — Iris Landmark model (`iris_landmark.tflite`) detects eyelid aperture
2. **SMILE** — Face Landmark model (`face_landmark.tflite`) detects mouth landmark changes
3. **HEAD_LEFT** — Face Landmark model detects leftward pose rotation
4. **HEAD_RIGHT** — Face Landmark model detects rightward pose rotation

**2.4 Enrollment Flow (Register Screen)**

The registration is a 4-step wizard within a single screen (`register.tsx`):

| **Step** | **UI State** | **User Action** | **System Action** |
|----|----|----|----|
| 1 | Employee Details Form | Enter Employee ID (required), Full Name (required), Department (optional); tap 'Next' | Validate uniqueness of Employee ID against AsyncStorage; if duplicate → inline error "This Employee ID already exists" |
| 2 | Camera Capture | Position face in oval guide; tap 'Extract Features' | On native: BlazeFace detects face (confidence > 0.7) → MobileFaceNet extracts 192-dim embedding from frame processor. In simulated mode: `mlService.generateEmbedding()` generates random 192-dim vector |
| 3 | Confirm Embedding | Review "Features Extracted (192 dimensions)" message; tap 'Confirm & Save' or 'Retake' | Generate UUID via `expo-crypto`; create User object with embedding; save to AsyncStorage via `storage.saveUser()` |
| 4 | Registration Success | View success confirmation with name and ID; tap 'Go to Dashboard' or 'Register Another' | Animated checkmark; 'Go to Dashboard' → `router.replace('/(tabs)/home')`; 'Register Another' → reset form to Step 1 |

**2.5 Sync & Purge Flow**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p>TRIGGER: User taps 'Sync Now' on SCR-09 Sync screen</p>
<p>│</p>
<p>├── Read attendance logs from AsyncStorage</p>
<p>│</p>
<p>├── Filter: syncStatus = 'pending'</p>
<p>│</p>
<p>├── No pending records? ──▶ Toast 'Already up to date' ──▶ EXIT</p>
<p>│</p>
<p>├── Check network via @react-native-community/netinfo</p>
<p>│</p>
<p>├── No connectivity? ──▶ Toast 'No internet' ──▶ EXIT</p>
<p>│</p>
<p>└── Simulate batch sync (mockSync service)</p>
<p>│</p>
<p>┌──────────┴──────────────────────────────────┐</p>
<p>│ Success │ Failure</p>
<p>│ │</p>
<p>│ • Update syncStatus = 'synced' │ • Update syncStatus = 'failed'</p>
<p>│ • Set syncedAt timestamp │ • Show error toast</p>
<p>│ • Generate receiptId (UUID) │ • Allow manual retry</p>
<p>│ • Show toast: 'X records synced' │</p>
<p>│ │</p>
<p>│ ── Purge ──</p>
<p>│ User taps 'Clear Synced Data'</p>
<p>│ storage.deleteSyncedLogs()</p>
<p>│ DELETE all logs WHERE syncStatus = 'synced'</p>
<p>│ Toast: 'X records purged from device'</p>
<p>└──────────────────────────────────────────────</p></td>
</tr>
</tbody>
</table>

**2.6 Complete Screen-to-Screen Navigation Map**

| **From Screen** | **Event / Action** | **To Screen** | **Condition** |
|----|----|----|----| 
| SCR-01 Splash | Session exists | SCR-03 Home | `storage.getSession()` returns valid session |
| SCR-01 Splash | No session | SCR-02 Login | Session is null |
| SCR-02 Login | Valid credentials submitted | SCR-03 Home | `router.replace('/(tabs)/home')` |
| SCR-03 Home | Tap 'Mark Attendance' | SCR-04 Liveness | Always |
| SCR-03 Home | Tap 'Register Face' | SCR-06 Register | Always |
| SCR-03 Home | Tap 'Sync Records' | SCR-09 Sync | Tab navigation |
| SCR-03 Home | Tap 'Settings' | SCR-10 Profile | Tab navigation |
| SCR-03 Home | Tap 'See All' (Recent Activity) | SCR-08 Attendance | Tab navigation |
| SCR-04 Liveness | All 4 challenges passed + FASNet check | SCR-05 Verify | `RESULT_SUCCESS` state |
| SCR-04 Liveness | 3rd failure or spoof detected | SCR-04 (RESULT_FAILURE) | In-screen failure state with retry/cancel |
| SCR-04 Liveness | Tap 'Back to Dashboard' | SCR-03 Home | `router.back()` |
| SCR-05 Verify | Match found → Tap 'Mark Attendance' | SCR-07 Attendance Success | Attendance log written to storage |
| SCR-05 Verify | No match → Tap 'Try Again' | SCR-05 Verify (CAPTURING) | Reset to camera state |
| SCR-05 Verify | Tap 'Cancel' | Previous screen | `router.back()` |
| SCR-07 Attendance Success | Tap 'Back to Dashboard' or 8s countdown | SCR-03 Home | `router.replace('/(tabs)/home')` |
| SCR-06 Register | Complete all 4 steps → 'Go to Dashboard' | SCR-03 Home | User saved to AsyncStorage |
| SCR-06 Register | Step 4 → 'Register Another' | SCR-06 Register (Step 1) | Form reset |
| SCR-06 Register | Tap 'X' close | Previous screen | `router.back()` |
| SCR-10 Profile | Tap 'Logout' | SCR-02 Login | `storage.clearSession()` |

**2.7 Error States & System Responses**

| **Error Condition** | **Screen** | **User-Facing Message** | **System Behaviour** |
|----|----|----|----| 
| No face detected during liveness | SCR-04 | 'Detecting face...' (overlay text) | BlazeFace continues scanning; no timeout in current implementation |
| Active liveness challenge timeout (8s) | SCR-04 | Challenge state → 'failed' | Retry same challenge; up to 2 retries; after 3rd failure → RESULT_FAILURE |
| FASNet spoof detected | SCR-04 | RESULT_FAILURE state displayed | ResultCard with 'Try Again' restarts all challenges from BLINK |
| No face match (score < 0.55) | SCR-05 | ResultCard with 'Face Not Recognised' | 'Try Again' resets to CAPTURING state; 'Cancel' returns to previous screen |
| Camera permission denied | SCR-05 / SCR-06 | 'Camera access is required for verification.' | Grant Permission button triggers `requestPermission()`; Cancel returns to Home |
| Duplicate Employee ID during enrollment | SCR-06 (Step 1) | 'This Employee ID already exists in the system.' | Inline error on Employee ID field; form submission blocked |
| ML model loading failure | N/A (service layer) | Console warning only | Falls back to simulated mode (`mlService.isSimulated = true`); random outputs for demo |
| Storage read/write error | Various | Alert dialog (if in enrollment) | Error logged to console; operation throws to caller for handling |
| Login failure | SCR-02 | 'Invalid credentials. Please try again.' | Inline error text displayed; form remains editable |

**2.8 Data Written Per Flow**

| **Flow** | **Storage Key** | **Key Fields Set** | **Sync Queued?** |
|----|----|----|----| 
| Successful Authentication | `@aegis/attendance_logs` | logId (UUID), userId, employeeId, fullName, timestamp, confidence, livenessScore, latitude, longitude, deviceId, syncStatus='pending', syncedAt=null, receiptId=null | Yes — syncStatus='pending' |
| User Enrollment | `@aegis/users` | userId (UUID), employeeId, fullName, department, enrolledAt, embedding (192-dim float32[]), embeddingVersion=1, isActive=true | No |
| Login Session | `@aegis/session` | employeeId, fullName, department, loggedInAt (Unix ms) | No |
| Sync Completed | `@aegis/attendance_logs` | syncStatus='synced', syncedAt (Unix ms), receiptId (UUID) | N/A — sync done |
| Purge Executed | `@aegis/attendance_logs` | DELETE all records WHERE syncStatus='synced' | No |
| Device ID Generated | `@aegis/device_id` | UUID string — generated once, persisted forever | No |

**2.9 Verify Screen States (SCR-05)**

The verify screen uses a `VerifyState` enum:

| **State** | **UI** | **Transition** |
|----|----|----|
| `CAPTURING` | Live camera feed with face oval overlay; 'Verify Identity' button | User taps button → PROCESSING; or native frame processor auto-detects and matches |
| `PROCESSING` | Camera feed with dark overlay; 'Running ML Model...' text | BlazeFace + MobileFaceNet run; if match → SUCCESS; if no match → FAILURE |
| `SUCCESS` | ResultCard: green variant, employee name, ID, confidence score, 'Mark Attendance' button | Tap 'Mark Attendance' → write log → navigate to Attendance Success |
| `FAILURE` | ResultCard: red variant, 'Try Again' / 'Cancel' buttons | 'Try Again' → CAPTURING; 'Cancel' → router.back() |

**2.10 Attendance Success Screen (SCR-07)**

| **Element** | **Detail** |
|----|----|
| Animated checkmark | Spring animation (scale 0 → 1.2 → 1.0) |
| Employee name & ID | Passed via route params |
| Timestamp | Formatted from Unix ms route param |
| Sync badge | Shows 'Offline' badge (warning color) |
| GPS row | 'Location unavailable' with location icon |
| Auto-redirect | 8-second countdown; navigates to Home on expiry |
| Manual action | 'Back to Dashboard' button → `router.replace('/(tabs)/home')` |

*--- End of Document ---*

DataLake AEGIS · Hackathon 7.0 · Team Recursive Rebels · June 2026
