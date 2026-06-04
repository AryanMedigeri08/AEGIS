<p align="center">
  <h1 align="center">🛡️ DataLake AEGIS</h1>
  <p align="center">
    <strong>Offline Facial Recognition & Liveness Detection Module</strong>
  </p>
  <p align="center">
    <em>Hackathon 7.0 · Team Recursive Rebels</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React_Native-0.85-61DAFB?style=flat-square&logo=react" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo_SDK-56-000020?style=flat-square&logo=expo" alt="Expo SDK" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TFLite-On_Device-FF6F00?style=flat-square&logo=tensorflow" alt="TFLite" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</p>

---

## 📋 Overview

DataLake AEGIS is an **offline-first** facial recognition and liveness detection module built for integration into the Datalake 3.0 React Native application. It enables secure, tamper-proof identity verification of field personnel in **zero-network zones**.

All AI inference runs **entirely on-device** — no cloud calls, no internet required at authentication time. Attendance logs are stored locally in encrypted storage and synced to AWS only when connectivity is restored.

### ✨ Key Highlights

| Feature | Description |
|---------|-------------|
| 🔒 **100% Offline** | Zero network calls during authentication |
| 🧠 **4 On-Device ML Models** | Face detection, recognition, landmark tracking & iris analysis |
| 🎭 **Active Liveness** | Blink, smile, and head-turn challenges to prevent spoofing |
| ⚡ **< 1s Latency** | Camera-to-result pipeline optimized for mid-range devices |
| 📱 **Cross-Platform** | Android 8.0+ and iOS 12+ on 3 GB RAM, no GPU required |
| 🔐 **AES-256 Encrypted** | Face embeddings encrypted at rest; raw frames never stored |

---

## 🧠 ML Pipeline

The authentication pipeline uses **4 TFLite models** (~10.1 MB total) executed sequentially via `react-native-fast-tflite`:

| # | Model | Purpose | Size |
|---|-------|---------|------|
| 1 | **BlazeFace** (`face_detection_front.tflite`) | Face detection — bounding box + confidence score | 224 KB |
| 2 | **Face Mesh** (`face_landmark.tflite`) | 468-point 3D face mesh — smile & head-turn detection | 2.33 MB |
| 3 | **Iris Landmark** (`iris_landmark.tflite`) | Iris & eyelid tracking — blink detection | 2.52 MB |
| 4 | **MobileFaceNet** (`mobilefacenet.tflite`) | Face recognition — 192-dim embedding + cosine similarity | 4.99 MB |

```
Camera Frame → Face Detection → Face Landmark → Iris Tracking → Face Recognition
                 (BlazeFace)     (Face Mesh)      (Iris)         (MobileFaceNet)
                  ↓ bbox          ↓ gestures       ↓ blink        ↓ 192-dim embedding
                  gate            liveness          liveness       identity match
```

All models are open-source (Apache 2.0) and run on CPU via TensorFlow Lite — no GPU delegate required.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.85 + Expo SDK 56 |
| Navigation | Expo Router (file-based routing) |
| Camera | `react-native-vision-camera` v5 |
| ML Inference | `react-native-fast-tflite` (JSI TFLite bindings) |
| Frame Processing | `react-native-worklets` |
| Animations | `react-native-reanimated` v4 |
| Storage | `@react-native-async-storage/async-storage` |
| Networking | `@react-native-community/netinfo` |
| Encryption | `expo-crypto` (AES-256 for embeddings) |
| Language | TypeScript 6.0 |

---

## 📁 Project Structure

```
faceauth/
├── src/
│   ├── app/                        # Screens (Expo Router file-based routing)
│   │   ├── (tabs)/                 # Tab navigator screens
│   │   │   ├── _layout.tsx         # Tab bar layout
│   │   │   ├── home.tsx            # Dashboard — quick auth, stats
│   │   │   ├── attendance.tsx      # Attendance log viewer
│   │   │   ├── sync.tsx            # Cloud sync management
│   │   │   └── profile.tsx         # User profile & settings
│   │   ├── _layout.tsx             # Root navigator layout
│   │   ├── index.tsx               # Splash / entry screen
│   │   ├── login.tsx               # PIN-based admin login
│   │   ├── liveness.tsx            # Active liveness challenge screen
│   │   ├── verify.tsx              # Face recognition verification
│   │   ├── register.tsx            # New user enrollment (3-5 photos)
│   │   └── attendance-success.tsx  # Attendance confirmation
│   ├── components/                 # Reusable UI components
│   │   ├── ChallengeCard.tsx       # Liveness challenge instructions
│   │   ├── FaceOvalOverlay.tsx     # Camera face guide overlay
│   │   ├── GlassCard.tsx           # Glassmorphic card component
│   │   ├── PrimaryButton.tsx       # Primary action button
│   │   ├── SecondaryButton.tsx     # Secondary action button
│   │   ├── ProgressSteps.tsx       # Multi-step progress indicator
│   │   ├── ResultCard.tsx          # Success/failure result display
│   │   ├── ConnectivityBadge.tsx   # Online/offline status badge
│   │   ├── SyncStatusBanner.tsx    # Sync progress banner
│   │   ├── TextInput.tsx           # Styled text input
│   │   └── SkeletonLoader.tsx      # Loading skeleton placeholder
│   ├── services/                   # Business logic & ML
│   │   ├── mlService.ts            # ML model loading, inference, embedding comparison
│   │   ├── storage.ts              # Encrypted local storage (users, logs)
│   │   ├── connectivity.ts         # Network state monitoring
│   │   └── mockSync.ts             # Simulated cloud sync for demo
│   ├── assets/
│   │   └── models/                 # TFLite model files (~10.1 MB)
│   │       ├── mobilefacenet.tflite
│   │       ├── face_detection_front.tflite
│   │       ├── face_landmark.tflite
│   │       └── iris_landmark.tflite
│   ├── constants/                  # Theme, colors, design tokens
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript type definitions
│   └── web-stubs/                  # Web platform mock stubs for native modules
├── assets/                         # App icons, splash screen images
├── app.json                        # Expo configuration
├── babel.config.js                 # Babel config (Reanimated plugin)
├── metro.config.js                 # Metro bundler config (TFLite asset support)
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies & scripts
└── LICENSE                         # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Android Studio** with SDK 24+ (for Android builds)
- **Xcode** 15+ (for iOS builds, macOS only)
- A physical device is recommended for camera and ML inference testing

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/faceauth.git
cd faceauth

# Install dependencies
npm install
```

### Running on Android

```bash
# Start the development build on a connected Android device
npx expo run:android
```

### Running on iOS

```bash
# Start the development build on an iOS simulator or device
npx expo run:ios
```

### Running on Web (Demo Mode)

```bash
# Web runs in simulated mode — ML models are mocked
npx expo start --web
```

> [!NOTE]
> The web build runs in simulated mode with randomized ML outputs since TFLite requires native JSI bindings. Use a physical device for real ML inference.

---

## 🔐 Authentication Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Face Detection  │────▶│ Liveness Challenge│────▶│  Face Recognition │────▶│   Result Logged  │
│   (BlazeFace)    │     │  (Blink/Smile/    │     │  (MobileFaceNet)  │     │  (AES-256 + UUID)│
│                  │     │   Head Turn)      │     │                   │     │                  │
└─────────────────┘     └──────────────────┘     └───────────────────┘     └──────────────────┘
```

1. **Face Detection** — Camera opens, BlazeFace detects a face in the live frame
2. **Liveness Challenge** — User completes 4 randomized challenges (blink, smile, head left, head right) with 8-second timeouts
3. **Face Recognition** — MobileFaceNet generates a 192-dim embedding, compared against enrolled users via cosine similarity (threshold ≥ 0.55)
4. **Result** — Match result with confidence score; attendance logged locally with encrypted timestamp and UUID

---

## 👤 User Enrollment

Administrators can register new field workers by:

1. Entering employee ID and full name
2. Capturing 3–5 reference photos from the front camera
3. The system computes averaged face embeddings and stores them AES-256 encrypted

---

## 📡 Offline-First Architecture

- **Zero network calls** during the entire authentication pipeline
- Attendance events stored in encrypted local storage with UUID log IDs
- When connectivity is restored, pending records sync to AWS API Gateway
- Successfully synced records are purged from local storage to prevent bloat

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Product Description Document](./Product%20description%20document.md) | Full PRD — requirements, user stories, API contract, ML model details |
| [App Flow](./App%20flow.md) | Screen-by-screen application flow and state machine documentation |

---

## 👥 Team

**Recursive Rebels** — Hackathon 7.0

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

All ML models are licensed under Apache 2.0 (MediaPipe, MobileFaceNet).
