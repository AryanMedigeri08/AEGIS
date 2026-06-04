**HACKATHON 7.0**

**Offline Facial Recognition & Liveness Detection**

DataLake AEGIS Module

Team: Recursive Rebels \| Submission Deadline: June 5, 2026

*PRD · Application Flow*

**DOC 01 Product Requirements Document**

*Functional & Non-Functional Requirements --- DataLake AEGIS*

**1.1 Project Overview**

DataLake AEGIS is an offline-first facial recognition and liveness detection module built for integration into the existing Datalake 3.0 React Native application. It enables secure, tamper-proof identity verification of field personnel in zero-network zones. All AI inference runs entirely on-device; attendance logs are stored locally in encrypted SQLite and synced to AWS only when connectivity is restored.

| **Attribute**       | **Value**                         |
|---------------------|-----------------------------------|
| Product Name        | DataLake AEGIS Module          |
| Version             | 1.0.0                             |
| Host Application    | Datalake 3.0 (React Native 0.73+) |
| Target Platforms    | Android 8.0+ / iOS 12+            |
| Min Device RAM      | 3 GB (no GPU required)            |
| Submission Deadline | June 5, 2026                      |
| Team                | Recursive Rebels                  |
| Hackathon           | Hackathon 7.0                     |

**1.2 Problem Statement**

Field personnel operating in remote areas --- construction sites, forests, rural zones --- with zero internet connectivity need a reliable, tamper-proof attendance system. Existing solutions depend on network connectivity, are trivially spoofable with a printed photograph, or require expensive dedicated hardware. A lightweight, entirely on-device face recognition system with active liveness detection is required that runs on mid-range mobile hardware under harsh outdoor lighting conditions.

**1.3 Goals & Success Metrics**

| **Goal** | **Measurement** | **Target** |
|----|----|----|
| Offline-only operation | Network calls during authentication | Zero --- no external calls at runtime |
| Face recognition accuracy | True Positive Rate on held-out test set | ≥ 95% |
| Liveness / anti-spoofing | Photo and video spoof rejection rate | ≥ 98% |
| End-to-end processing speed | Camera-to-result latency on target device | \< 1 second |
| ML model footprint | Combined model asset size (all models) | \< 20 MB total |
| Open-source compliance | Paid or proprietary dependencies | Zero |
| Device compatibility | Min hardware tier | 3 GB RAM, Android 8.0+ / iOS 12+ |

**1.4 User Personas**

**Field Worker --- Primary User**

- Uses Datalake 3.0 daily to mark attendance in remote outdoor locations with no internet.

- Works on a mid-range Android or iOS device with 3--4 GB RAM.

- Expects authentication to complete under 2 seconds with minimal deliberate interaction.

- Not technically proficient --- requires zero-training UX with clear visual and audio prompts.

- Often works under harsh outdoor lighting: direct sunlight, shadows, or low-light conditions.

**Administrator --- Secondary User**

- Responsible for enrolling new field workers into the system using 3--5 reference photos.

- Initiates or monitors sync operations when network connectivity is available.

- Has PIN-gated admin access within the app; may operate from office or in the field.

- Reviews attendance logs and manages deactivation of departed personnel.

**1.5 User Stories**

| **ID** | **As a\...** | **I want to\...** | **So that\...** |
|----|----|----|----|
| US-01 | Field Worker | Authenticate with a single front-camera interaction | I mark attendance without typing anything |
| US-02 | Field Worker | Authenticate with zero internet connection | My attendance is never blocked in remote areas |
| US-03 | Field Worker | Receive a clear liveness challenge (blink / smile / turn head) | I know the system is verifying my live presence |
| US-04 | Field Worker | See a specific failure message with a clear retry option | I know what went wrong and what to do next |
| US-05 | Admin | Register a new user with 3--5 reference photos | New personnel are enrolled in under 2 minutes |
| US-06 | Admin | Trigger a sync and see all pending records upload to the server | No attendance data is permanently lost |
| US-07 | Admin | See local records purged automatically after a confirmed sync | Device storage does not bloat over time |
| US-08 | System | Receive a match result + confidence score from AEGISModule in \< 1 s | Datalake 3.0 can proceed without blocking the user |

**1.6 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
|----|----|----|
| FR-01 | Detect and crop face from live camera frame using on-device YuNet model | P0 Must Have |
| FR-02 | Generate 512-dim face embedding via MobileFaceNet and compare against local user database using cosine similarity | P0 Must Have |
| FR-03 | Perform active liveness challenge (random selection: blink / smile / head turn) before recognition | P0 Must Have |
| FR-04 | Perform passive anti-spoofing via Mini-FASNet texture-analysis model | P1 Should Have |
| FR-05 | Execute all ML inference entirely offline --- no network calls at any point during authentication | P0 Must Have |
| FR-06 | Enroll new users by capturing 3--5 photos and computing an averaged, AES-256 encrypted embedding | P0 Must Have |
| FR-07 | Persist all attendance events in an encrypted local SQLite database | P0 Must Have |
| FR-08 | Sync pending records to AWS API Gateway when network is available; purge after server-confirmed receipt | P1 Should Have |
| FR-09 | Operate cross-platform on Android 8.0+ and iOS 12+ without GPU hardware | P0 Must Have |
| FR-10 | Expose AEGIS functionality to Datalake 3.0 via a typed React Native module API | P0 Must Have |
| FR-11 | Apply a 60-second authentication lockout after 3 consecutive failed attempts | P1 Should Have |
| FR-12 | Verify SHA-256 integrity of all model files on app launch; block auth if any hash mismatches | P2 Nice to Have |

**1.7 Non-Functional Requirements**

| **ID** | **Category** | **Requirement** |
|----|----|----|
| NFR-01 | Performance | End-to-end recognition + liveness pipeline completes in \< 1 second on a 3 GB RAM device with no GPU |
| NFR-02 | Model Size | Combined ML model assets (detection + recognition + liveness) total \< 20 MB on-disk |
| NFR-03 | Accuracy | Face recognition True Positive Rate \> 95% on diverse Indian demographics under varying outdoor lighting |
| NFR-04 | Security | Face embeddings stored as AES-256 encrypted binary blobs; raw camera frames are never written to disk |
| NFR-05 | Open Source | All third-party libraries and pre-trained models must be open-source under permissive licences (MIT / Apache 2.0) |
| NFR-06 | Privacy | No biometric image data stored on-device or transmitted; only encrypted embedding vectors |
| NFR-07 | Reliability | All recognition failures handled gracefully with defined error states; zero uncaught crashes in auth pipeline |
| NFR-08 | Hardware | Runs on CPU-only; no GPU acceleration required or assumed by any component |
| NFR-09 | Accessibility | All interactive elements meet 48 dp minimum touch target; audio prompts supplement visual liveness instructions |

**1.8 Module API Contract**

The AEGIS module exposes the following TypeScript interface to the Datalake 3.0 host application:

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p>// ── Core Methods</p>
<p>AEGISModule.authenticate(userId?: string): Promise&lt;AuthResult&gt;</p>
<p>AEGISModule.enroll(user: { employeeId: string; fullName: string; department?: string }): Promise&lt;EnrollResult&gt;</p>
<p>AEGISModule.syncPendingLogs(): Promise&lt;SyncResult&gt;</p>
<p>// ── Return Types</p>
<p>type AuthResult = {</p>
<p>matched : boolean;</p>
<p>userId : string | null;</p>
<p>employeeId : string | null;</p>
<p>confidence : number; // 0–1 cosine similarity score</p>
<p>livenessScore : number; // 0–1 FASNet confidence (-1 if passive FAS skipped)</p>
<p>timestamp : number; // Unix ms of authentication event</p>
<p>logId : string; // UUID of local attendance_logs entry</p>
<p>};</p>
<p>type EnrollResult = { success: boolean; userId: string; error?: string };</p>
<p>type SyncResult = { synced: number; failed: number; receiptId: string };</p></td>
</tr>
</tbody>
</table>

**1.9 Out of Scope**

- Multi-face detection in a single frame (single-person authentication only).

- Cloud-based recognition fallback --- all inference is offline by design.

- Voice recognition or multi-modal biometric authentication.

- Proprietary or paid ML services (AWS Rekognition, Azure Face API, etc.).

- Admin web dashboard --- mobile app interface only.

- Continuous background face monitoring --- explicit per-session trigger only.

**1.10 ML Model Details**

The AEGIS pipeline uses **four TFLite models** that run entirely on-device via `react-native-fast-tflite` (JSI-based TensorFlow Lite bindings). All models are bundled as static assets and loaded at app launch. Combined asset footprint: **~10.1 MB** (well within the < 20 MB budget).

| **#** | **Model File** | **Role in Pipeline** | **Architecture / Origin** | **Size** | **Licence** |
|----|----|----|----|----|-----|
| 1 | `mobilefacenet.tflite` | **Face Recognition** — generates a 192-dimensional embedding vector from a cropped face image; embeddings are compared via cosine similarity (threshold ≥ 0.55) for identity matching | MobileFaceNet (ArcFace loss, MobileNetV2 backbone) — lightweight face recognition model optimized for mobile inference | 4.99 MB | Apache 2.0 |
| 2 | `face_detection_front.tflite` | **Face Detection** — locates a face bounding box in the live camera frame; outputs confidence scores (threshold > 0.7) and bounding box coordinates; gates all downstream processing | MediaPipe BlazeFace (Front Camera variant) — SSD-based single-shot face detector designed for front-facing mobile cameras | 224 KB | Apache 2.0 |
| 3 | `face_landmark.tflite` | **Face Landmark / Mesh** — produces a 468-point 3D face mesh from the detected face region; used for active liveness challenges (smile detection via mouth landmarks, head turn via pose estimation) | MediaPipe Face Mesh — real-time face geometry estimation model | 2.33 MB | Apache 2.0 |
| 4 | `iris_landmark.tflite` | **Iris / Eye Tracking** — refines eye region from face landmarks to detect iris position and eyelid aperture; used for blink detection in active liveness challenges | MediaPipe Iris — iris and eye contour landmark model | 2.52 MB | Apache 2.0 |

**Pipeline Execution Order**

```
Camera Frame
    │
    ▼
┌──────────────────────────┐
│  1. Face Detection       │  face_detection_front.tflite
│     (BlazeFace)          │  → bounding box + confidence
└──────────┬───────────────┘
           │ face detected (score > 0.7)
           ▼
┌──────────────────────────┐
│  2. Face Landmark        │  face_landmark.tflite
│     (Face Mesh 468pt)    │  → 3D face mesh → smile / head-turn detection
└──────────┬───────────────┘
           │ active liveness challenges
           ▼
┌──────────────────────────┐
│  3. Iris Landmark        │  iris_landmark.tflite
│     (Iris Tracking)      │  → eyelid aperture → blink detection
└──────────┬───────────────┘
           │ all challenges passed
           ▼
┌──────────────────────────┐
│  4. Face Recognition     │  mobilefacenet.tflite
│     (MobileFaceNet)      │  → 192-dim embedding → cosine similarity match
└──────────────────────────┘
```

**Key Technical Notes**

- **Inference Runtime**: All models run via TensorFlow Lite on CPU (no GPU delegate required). Inference is executed synchronously on the camera frame processor thread using `model.runSync()`.
- **Embedding Dimensions**: MobileFaceNet produces 192-dimensional floating-point embedding vectors. Enrolled user embeddings are AES-256 encrypted before storage.
- **Match Threshold**: Cosine similarity threshold is set to **0.55** (tunable per deployment; typical range 0.4–0.6 for ArcFace-trained models).
- **Liveness Challenges**: Four randomized active challenges — **Blink**, **Smile**, **Head Left**, **Head Right** — each with an 8-second timeout and up to 2 retries before failure.
- **Anti-Spoofing**: Passive anti-spoofing via FASNet texture analysis is planned (FR-04, P1) but not yet integrated; the current pipeline relies on active liveness challenges for spoof rejection.
- **Fallback Mode**: On platforms without native TFLite support (e.g., web), the service falls back to a simulated mode with randomized outputs for development/demo purposes.

