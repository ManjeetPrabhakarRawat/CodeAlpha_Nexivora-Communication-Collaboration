# Nexivora

Nexivora is a modern all-in-one virtual communication platform designed for teams, students, developers, and collaborative groups. It combines high-quality multi-user video conferencing, real-time messaging, file sharing, and collaborative whiteboarding into a single, beautiful SaaS-style application.

## 🚀 Features
- **Video Conferencing:** Multi-user WebRTC peer-to-peer video calls with camera, microphone, and screen sharing controls.
- **Real-time Chat:** Instant messaging within meeting rooms.
- **Collaborative Whiteboard:** Draw, erase, and create shapes (rectangles, circles, lines) synchronously with other participants.
- **File Sharing:** Upload and download files during a meeting.
- **Secure Authentication:** JWT-based user authentication and protected routes.
- **Modern Dashboard:** View recent meetings, create new rooms, or join existing ones.
- **Responsive Design:** Beautiful dark-mode UI with glassmorphism elements that works across devices.

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router, Socket.IO Client.
- **Backend:** Node.js, Express, Socket.IO, WebRTC (Signaling), Multer.
- **Database:** MongoDB (Mongoose).

## 📦 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB URI

### 1. Database Setup
Ensure MongoDB is running locally on the default port `27017` or create a `.env` file in the `backend` folder and set your `MONGO_URI`.

### 2. Backend Setup
```bash
cd backend
npm install
# The .env file is already created, but verify it:
# PORT=5000
# MONGO_URI=mongodb://127.0.0.1:27017/nexivora
# JWT_SECRET=supersecretkey_change_in_production
# CLIENT_URL=http://localhost:5173

# Start the development server
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

### 4. Running the Application
Once both servers are running:
1. Open your browser and navigate to `http://localhost:5173`.
2. Register a new account.
3. You will be redirected to the Dashboard. Create a new meeting.
4. Allow browser permissions for Camera and Microphone.

### 5. Testing with Multiple Users
To test multi-user functionality (Video, Chat, Whiteboard):
1. Open a normal browser window and log in / create a meeting.
2. Open an **Incognito/Private window** (or a different browser).
3. Register a second account.
4. Copy the Meeting Room ID from the first window and join the meeting from the second window.
5. You should now see both video streams (or initials if video is disabled) and be able to chat, draw on the whiteboard, and share files.

## 📁 Architecture Highlights
- **`backend/src/sockets/index.ts`**: Handles WebRTC signaling (offers, answers, ICE candidates), chat message broadcasting, and whiteboard drawing synchronization.
- **`frontend/src/hooks/useWebRTC.ts`**: A custom React hook that abstracts the complexity of managing multiple `RTCPeerConnection` instances.
- **`frontend/src/components/Whiteboard.tsx`**: Uses the HTML5 Canvas API and Socket.IO for real-time collaborative drawing with multiple tools.
- **`frontend/src/components/FileSharing.tsx`**: Manages file uploads via Multer on the backend and broadcasts new file availability to all peers.

Enjoy collaborating on Nexivora!
