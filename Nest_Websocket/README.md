# ChatApp — Full-Stack Real-Time Chat

A production-ready real-time chat application built with **NestJS** + **React 19**, featuring WebSocket-powered messaging, JWT authentication, and a WhatsApp-style UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, MUI, Zustand, TanStack Query, Socket.IO Client |
| **Backend** | NestJS, TypeScript, Socket.IO, Passport JWT, Prisma ORM |
| **Database** | PostgreSQL |
| **Infra** | Docker, Docker Compose, Nginx |

---

## Features

- **Authentication** — Register, Login, JWT access tokens, bcrypt password hashing
- **Real-Time Messaging** — WebSocket-powered, instant delivery
- **Typing Indicators** — Live "typing..." status shown to recipients
- **Read Receipts** — Double-tick (delivered / read) with blue ticks on read
- **Online Presence** — Real-time online/offline status + last seen
- **Message History** — Paginated message loading from PostgreSQL
- **Auto Reconnect** — Socket.IO reconnects automatically on drop
- **Responsive UI** — WhatsApp-style layout, works on mobile + desktop

---

## Project Structure

```
Nest_Websocket/
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── auth/              # JWT + Local auth, guards, strategies
│   │   ├── users/             # User management + online status
│   │   ├── chat/              # Conversations + messages REST API
│   │   ├── websocket/         # Socket.IO gateway (all WS events)
│   │   ├── prisma/            # PrismaService (global)
│   │   ├── common/            # Decorators, filters, interceptors
│   │   ├── config/            # App configuration
│   │   └── app.module.ts
│   ├── prisma/
│   │   └── schema.prisma      # DB schema
│   └── Dockerfile
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── api/               # Axios API clients (auth, users, chat)
│   │   ├── components/        # All UI components
│   │   ├── layouts/           # ChatLayout (main shell)
│   │   ├── pages/             # LoginPage, RegisterPage
│   │   ├── routes/            # ProtectedRoute
│   │   ├── socket/            # Socket.IO service singleton
│   │   ├── store/             # Zustand stores (auth, chat, user)
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Theme, helpers (date formatting etc.)
│   └── Dockerfile
└── docker-compose.yml
```

---

## Setup — Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally  
  **or** Docker & Docker Compose

---

### Option A — Docker (Recommended)

```bash
# Clone / enter the project
cd Nest_Websocket

# Start all services (PostgreSQL, pgAdmin, Backend, Frontend)
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:3000/api |
| pgAdmin | http://localhost:5050 (admin@chatapp.com / admin) |

---

### Option B — Manual

**1. Backend**

```bash
cd backend

# Install dependencies
npm install

# Copy env and configure
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET in .env

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Start in dev mode (hot reload)
npm run start:dev
```

Backend runs at: `http://localhost:3000/api`

---

**2. Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env
# Edit VITE_API_URL and VITE_SOCKET_URL if needed

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## REST API

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/profile` | Get current user | JWT |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users` | List all users | JWT |
| GET | `/api/users/search?q=name` | Search users | JWT |
| GET | `/api/users/:id` | Get user by ID | JWT |

### Conversations & Messages

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/conversations` | Get my conversations | JWT |
| POST | `/api/conversations` | Create or get conversation | JWT |
| GET | `/api/conversations/:id/messages` | Get messages | JWT |
| POST | `/api/messages` | Send a message | JWT |
| PATCH | `/api/messages/:id/read` | Mark message as read | JWT |

---

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ conversationId }` | Join a conversation room |
| `leave_chat` | `{ conversationId }` | Leave a conversation room |
| `send_message` | `{ conversationId, content }` | Send a message |
| `typing_start` | `{ conversationId }` | Start typing indicator |
| `typing_stop` | `{ conversationId }` | Stop typing indicator |
| `mark_read` | `{ conversationId }` | Mark conversation as read |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `message_received` | `Message` | New message from someone else |
| `message_sent` | `Message` | Confirmation of your sent message |
| `user_online` | `{ userId }` | A user came online |
| `user_offline` | `{ userId, lastSeen }` | A user went offline |
| `typing` | `{ userId, conversationId, isTyping }` | Typing indicator |
| `message_read` | `{ conversationId, readBy }` | Message was read |
| `conversation_updated` | `{ conversationId, lastMessage }` | Conversation updated |

---

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hashed
  avatar    String?
  isOnline  Boolean  @default(false)
  lastSeen  DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Conversation {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ConversationParticipant {
  id             String
  conversationId String
  userId         String
}

model Message {
  id             String        @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  status         MessageStatus @default(SENT)  // SENT | DELIVERED | READ
  isRead         Boolean       @default(false)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

---

## Running Tests

### Backend

```bash
cd backend
npm test                 # Unit tests
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests
```

### Frontend

```bash
cd frontend
npm test                 # Run with Vitest
npm run test:ui          # Visual test UI
npm run test:coverage    # Coverage report
```

---

## Environment Variables

### Backend (`.env`)

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatapp?schema=public
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Architecture Highlights

- **NestJS Modules** — Each feature (auth, users, chat, websocket) is fully encapsulated with its own module, controller, service, DTOs, and guards
- **Global Prisma Module** — `PrismaService` is registered globally; no need to import per-module
- **JWT WS Auth** — The Socket.IO gateway validates the JWT on `handleConnection`; invalid tokens are immediately disconnected
- **Multi-tab Support** — `userId → Set<socketIds>` in the gateway tracks all browser tabs per user; offline is only broadcast when the last tab disconnects
- **Zustand + React Query** — React Query owns server state (API calls), Zustand owns client-side real-time state (WS messages, typing, presence)
- **Responsive layout** — Sidebar hides on mobile when a chat is open (WhatsApp mobile pattern)

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT with configurable secret and expiry
- Helmet middleware for HTTP security headers
- Rate limiting via `@nestjs/throttler` (100 req/min per IP)
- CORS restricted to `FRONTEND_URL`
- `ValidationPipe` with `whitelist: true` strips unknown properties
- Global exception filter prevents leaking stack traces

---

## License

MIT
