# PartKeeper Architecture Documentation

This document provides a comprehensive overview of how the PartKeeper application works, including its architecture, data flow, components, and key design patterns.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Data Flow](#data-flow)
5. [Component Structure](#component-structure)
6. [Authentication Flow](#authentication-flow)
7. [Data Persistence](#data-persistence)
8. [API Routes](#api-routes)
9. [Key Design Patterns](#key-design-patterns)

---

## Overview

PartKeeper is a modern web application designed for managing quartet songs with per-voice YouTube parts and lyrics. The application uses a serverless architecture with a database-backed data layer, following Next.js App Router conventions and modern React patterns.

### Core Features

- **Song Management**: CRUD operations for songs with comprehensive metadata
- **Voice Parts**: Organize songs by voice parts (1st-tenor, 2nd-tenor, baritone, bass)
- **YouTube Integration**: Embedded YouTube videos for each voice part and reference videos
- **Lyrics Support**: Toggleable lyrics display for each song
- **Search Functionality**: Search across song titles, artists, and tags
- **Authentication**: Simple access code-based authentication
- **Mobile-First Design**: Responsive design optimized for all screen sizes

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Validation**: Zod 4.1.12

### Backend
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 6.17.1
- **API**: Next.js API Routes (App Router)
- **Serverless**: Vercel deployment

---

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │ Song Details │  │  Management  │      │
│  │    (page.tsx)│  │  ([id]/page) │  │  (manage/)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│                   ┌─────────▼─────────┐                      │
│                   │   API Routes      │                      │
│                   │  /api/songs       │                      │
│                   └─────────┬─────────┘                      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   Server (Next.js)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Repository Pattern                          │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │     PrismaSongsRepository                     │   │   │
│  │  └──────────────────┬───────────────────────────┘   │   │
│  │                     │                                │   │
│  │  ┌──────────────────▼───────────────────────────┐   │   │
│  │  │         Prisma Client                         │   │   │
│  │  └──────────────────┬───────────────────────────┘   │   │
│  └─────────────────────┼───────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                     Database (Supabase)                        │
│  ┌──────────────┐              ┌──────────────┐              │
│  │    Songs     │              │     Meta      │              │
│  │    Table     │              │     Table     │              │
│  └──────────────┘              └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/
│   │   └── songs/
│   │       └── route.ts          # CRUD API endpoints
│   ├── songs/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Song detail page (dynamic route)
│   │   └── manage/
│   │       └── page.tsx          # Song management page
│   ├── layout.tsx                # Root layout with auth wrapper
│   ├── page.tsx                  # Dashboard (home page)
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── Header.tsx                # Navigation header
│   ├── SongCard.tsx             # Song display card
│   ├── SongForm.tsx             # Add/edit song form
│   ├── YouTubePart.tsx          # YouTube video embed
│   ├── LyricBlock.tsx            # Toggleable lyrics
│   └── LoginGate.tsx             # Authentication gate
└── lib/                          # Utilities and core logic
    ├── auth.ts                   # Authentication utilities
    ├── schemas.ts                # Zod validation schemas
    ├── prisma.ts                 # Prisma client setup
    ├── storage.ts                # LocalStorage utilities
    ├── utils.ts                  # General utilities
    └── repos/                    # Repository pattern
        ├── songs-repo.ts         # Repository interface & factory
        └── prisma-songs-repo.ts  # Prisma implementation
```

---

## Data Flow

### 1. Reading Songs (Dashboard Load)

```
┌──────────┐
│ Browser  │
└────┬─────┘
     │ 1. GET /api/songs
     ▼
┌─────────────────┐
│  API Route      │
│  (route.ts)     │
└────┬────────────┘
     │ 2. createSongsRepository()
     ▼
┌──────────────────────┐
│ Repository Factory   │
│ (songs-repo.ts)      │
└────┬─────────────────┘
     │ 3. new PrismaSongsRepository()
     ▼
┌──────────────────────┐
│ Prisma Repository    │
│ (prisma-songs-repo)  │
└────┬─────────────────┘
     │ 4. prisma.song.findMany()
     ▼
┌──────────────────────┐
│  Supabase Database   │
└──────────────────────┘
     │ 5. Return songs data
     ▼
┌──────────────────────┐
│  Validation with     │
│  Zod (schemas.ts)    │
└────┬─────────────────┘
     │ 6. Return JSON response
     ▼
┌──────────────────────┐
│  Dashboard Component │
│  (page.tsx)          │
│  - Filters songs     │
│  - Renders SongCards│
└──────────────────────┘
```

### 2. Creating/Updating Songs

```
┌──────────────────┐
│  SongForm        │
│  Component       │
└────┬─────────────┘
     │ 1. User submits form
     ▼
┌──────────────────┐
│  POST/PUT        │
│  /api/songs      │
└────┬─────────────┘
     │ 2. Validate with Zod
     ▼
┌──────────────────┐
│  Repository      │
│  .create()       │
│  or .update()    │
└────┬─────────────┘
     │ 3. Save to database
     ▼
┌──────────────────┐
│  Prisma          │
│  .create()       │
│  or .update()    │
└────┬─────────────┘
     │ 4. Persist to Supabase
     ▼
┌──────────────────┐
│  Update Meta     │
│  table           │
└────┬─────────────┘
     │ 5. Return created/updated song
     ▼
┌──────────────────┐
│  Refresh UI      │
│  (reload songs)  │
└──────────────────┘
```

---

## Component Structure

### Core Components

#### 1. **Dashboard (`app/page.tsx`)**
- **Purpose**: Main landing page displaying all songs
- **Key Features**:
  - Fetches songs from `/api/songs` on mount
  - Implements client-side search filtering
  - Displays songs in a responsive grid
  - Shows loading and empty states

```typescript
// Key state management
const [songs, setSongs] = useState<Song[]>([])
const [searchQuery, setSearchQuery] = useState('')
const [isLoading, setIsLoading] = useState(true)

// Data fetching
useEffect(() => {
  async function loadSongs() {
    const response = await fetch('/api/songs')
    const data = await response.json()
    const validatedData = songsDataSchema.parse(data)
    setSongs(validatedData.songs)
  }
  loadSongs()
}, [])

// Search filtering (client-side)
const filteredSongs = useMemo(() => {
  return songs.filter(song =>
    song.title.toLowerCase().includes(query) ||
    song.artist?.toLowerCase().includes(query) ||
    song.tags?.some(tag => tag.toLowerCase().includes(query))
  )
}, [songs, searchQuery])
```

#### 2. **Song Details (`app/songs/[id]/page.tsx`)**
- **Purpose**: Display individual song with voice parts and lyrics
- **Key Features**:
  - Dynamic route based on song ID
  - Tab-based navigation for voice parts
  - YouTube video embedding
  - Toggleable lyrics display
  - Persistent tab preference (localStorage)

```typescript
// Tab management with persistence
const handleTabChange = (value: string) => {
  setActiveTab(value)
  if (song && value !== 'reference') {
    setStoredTab(song.id, value as Role)  // Persist preference
    window.location.hash = value          // Update URL hash
  }
}
```

#### 3. **Song Management (`app/songs/manage/page.tsx`)**
- **Purpose**: CRUD operations for songs
- **Key Features**:
  - Lists all songs in cards
  - Add/Edit/Delete functionality
  - Form validation
  - Real-time updates after operations

#### 4. **API Routes (`app/api/songs/route.ts`)**
- **Purpose**: Server-side API endpoints
- **Methods**:
  - `GET`: Fetch all songs
  - `POST`: Create new song
  - `PUT`: Update existing song
  - `DELETE`: Delete song by ID

```typescript
// Factory pattern for repository
const repo = createSongsRepository<Song>()

export async function GET() {
  const data = await repo.list()
  return NextResponse.json(data)
}
```

---

## Authentication Flow

### Authentication Architecture

The app uses a simple access code authentication system with localStorage persistence:

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │ 1. Enters access code
       ▼
┌──────────────┐
│  LoginGate   │
│  Component   │
└──────┬───────┘
       │ 2. authenticate(code)
       ▼
┌──────────────┐
│  auth.ts     │
│  - Compares  │
│  - Stores in │
│    localStorage
└──────┬───────┘
       │ 3. Sets AUTH_KEY in localStorage
       ▼
┌──────────────┐
│  App         │
│  Unlocked    │
└──────────────┘
```

### Implementation Details

**Authentication Utilities (`lib/auth.ts`)**:
```typescript
const AUTH_KEY = 'partkeeper:auth'

export function authenticate(accessCode: string): boolean {
  const expectedCode = process.env.NEXT_PUBLIC_ACCESS_CODE
  if (accessCode === expectedCode) {
    setStoredAuth(accessCode)
    return true
  }
  return false
}

export function isAuthenticated(): boolean {
  const storedCode = getStoredAuth()
  const expectedCode = process.env.NEXT_PUBLIC_ACCESS_CODE
  return storedCode === expectedCode
}
```

**LoginGate Component**:
- Wraps the entire app in `layout.tsx`
- Checks authentication status on mount
- Shows login form if not authenticated
- Uses client-side only (no server-side auth check)

**Key Points**:
- Authentication is client-side only (localStorage-based)
- Access code is stored in `NEXT_PUBLIC_ACCESS_CODE` environment variable
- No session management or server-side authentication
- Logout clears localStorage and redirects

---

## Data Persistence

### Database Schema (Prisma)

The application uses Prisma ORM with PostgreSQL (Supabase):

```prisma
model Song {
  id          String   @id @default(cuid())
  title       String
  artist      String?
  tags        String[] @default([])
  defaultRole String?  @map("default_role")
  parts       Json     // Voice parts stored as JSON
  lyrics      String?
  source      String?  // Reference video URL
  notes       String?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}

model Meta {
  id        String   @id @default("main")
  version   Int      @default(1)
  updatedAt DateTime @updatedAt
}
```

### Repository Pattern

The app implements the Repository pattern for data access abstraction:

**Interface (`lib/repos/songs-repo.ts`)**:
```typescript
export interface SongsRepository<TSong> {
  list(): Promise<SongsRepoRecord<TSong>>
  create(data: Omit<TSong, "id">): Promise<TSong>
  update(id: string, data: Omit<TSong, "id">): Promise<TSong>
  delete(id: string): Promise<void>
}
```

**Implementation (`lib/repos/prisma-songs-repo.ts`)**:
- `PrismaSongsRepository`: Implements all CRUD operations
- Uses Prisma client for database operations
- Handles data transformation between Prisma models and application models
- Updates Meta table after mutations

**Factory (`lib/repos/songs-repo.ts`)**:
```typescript
export function createSongsRepository<TSong>(): SongsRepository<TSong> {
  const { PrismaSongsRepository } = require('./prisma-songs-repo')
  return new PrismaSongsRepository()
}
```

### Data Validation

All data is validated using Zod schemas before persistence:

**Schemas (`lib/schemas.ts`)**:
```typescript
export const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  defaultRole: roleSchema.optional(),
  parts: z.record(roleSchema, z.string()),
  lyrics: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
})
```

**Validation Flow**:
1. Client-side: Form validation in `SongForm` component
2. API: Schema validation in API routes
3. Database: Prisma validates against schema

---

## API Routes

### Songs API (`app/api/songs/route.ts`)

#### GET `/api/songs`
- **Purpose**: Fetch all songs
- **Response**: `{ meta: {...}, songs: Song[] }`
- **Implementation**:
```typescript
export async function GET() {
  const repo = createSongsRepository<Song>()
  const data = await repo.list()
  return NextResponse.json(data)
}
```

#### POST `/api/songs`
- **Purpose**: Create a new song
- **Request Body**: `Omit<Song, 'id'>`
- **Response**: `Song` (with generated ID)
- **Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const newSong = await request.json()
  const created = await repo.create(newSong)
  return NextResponse.json(created)
}
```

#### PUT `/api/songs`
- **Purpose**: Update an existing song
- **Request Body**: `Song` (including ID)
- **Response**: Updated `Song`
- **Implementation**:
```typescript
export async function PUT(request: NextRequest) {
  const { id, ...updatedSong } = await request.json()
  const updated = await repo.update(id, updatedSong)
  return NextResponse.json(updated)
}
```

#### DELETE `/api/songs?id=...`
- **Purpose**: Delete a song by ID
- **Query Parameter**: `id` (song ID)
- **Response**: `{ success: true }`
- **Implementation**:
```typescript
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  await repo.delete(id!)
  return NextResponse.json({ success: true })
}
```

---

## Key Design Patterns

### 1. Repository Pattern

**Purpose**: Abstract data access layer from business logic

**Benefits**:
- Easy to switch data sources (file → database)
- Testable: Can mock repository implementations
- Single Responsibility: API routes don't need to know about Prisma

**Implementation**:
- Interface defines contract (`SongsRepository`)
- Concrete implementations (`PrismaSongsRepository`)
- Factory function creates appropriate instance

### 2. Schema Validation Pattern

**Purpose**: Type safety and runtime validation

**Benefits**:
- Catches errors at runtime
- Type inference from Zod schemas
- Single source of truth for data shape

**Usage**:
```typescript
// Define schema
const songSchema = z.object({ ... })
export type Song = z.infer<typeof songSchema>

// Validate at runtime
const validatedData = songSchema.parse(data)
```

### 3. Client-Server Separation

**Purpose**: Clear separation of concerns

**Client Components** (`'use client'`):
- UI components
- State management
- User interactions
- Browser-only APIs (localStorage)

**Server Components** (default):
- API routes
- Data fetching
- Database operations

### 4. Dynamic Route Pattern

**Purpose**: Handle variable URL segments

**Implementation**:
```typescript
// File: app/songs/[id]/page.tsx
export default function SongDetails() {
  const params = useParams()  // Get [id] from URL
  const songId = params.id
  // Fetch song by ID
}
```

### 5. Component Composition

**Purpose**: Reusable, composable UI components

**Example**:
- `SongCard` is used in Dashboard
- `YouTubePart` and `LyricBlock` are used in Song Details
- `Header` is shared across all pages

---

## Environment Configuration

### Required Environment Variables

```env
# Authentication
NEXT_PUBLIC_ACCESS_CODE=your-access-code

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # For migrations
```

### Build Process

1. **Development**: `npm run dev`
   - Runs Next.js dev server with Turbopack
   - Hot module replacement enabled

2. **Production Build**: `npm run build`
   - Generates Prisma client: `prisma generate`
   - Builds Next.js application
   - Optimizes bundles

3. **Production Start**: `npm start`
   - Runs production server
   - Serves optimized application

---

## State Management

### Client-Side State

The app uses React's built-in state management:

1. **Local Component State**: `useState` for component-specific state
2. **Server State**: Fetched via `useEffect` and stored in component state
3. **Persistent State**: localStorage for authentication and user preferences

### No Global State Management

- No Redux, Zustand, or Context API for global state
- Each component manages its own state
- Data is fetched fresh on mount when needed
- Form state is managed locally in components

---

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/songs')
  if (!response.ok) {
    throw new Error('Failed to load songs')
  }
  const data = await response.json()
  // ...
} catch (error) {
  console.error('Failed to load songs:', error)
  // Show error state to user
}
```

### Server-Side Error Handling

```typescript
export async function GET() {
  try {
    const data = await repo.list()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading songs:', error)
    return NextResponse.json(
      { error: 'Failed to read songs' },
      { status: 500 }
    )
  }
}
```

---

## Performance Optimizations

### 1. Code Splitting
- Next.js automatically code-splits by route
- Components loaded on-demand

### 2. Client-Side Filtering
- Search filtering happens in browser (no API calls)
- Uses `useMemo` to prevent unnecessary recalculations

### 3. Prisma Client Reuse
- Prisma client is reused via singleton pattern
- Prevents connection pool exhaustion

### 4. Image Optimization
- Next.js Image component (if used)
- YouTube embeds use iframe (lazy-loaded by browser)

---

## Security Considerations

### Current Security Model

1. **Authentication**: Simple access code (client-side only)
2. **No Server-Side Auth**: API routes don't verify authentication
3. **Environment Variables**: Sensitive data in `.env.local` (not committed)

### Recommendations for Production

- Add server-side authentication verification
- Implement rate limiting on API routes
- Add CORS protection if needed
- Sanitize user inputs (currently validated with Zod)
- Consider JWT tokens for more secure authentication

---

## Future Enhancements

### Potential Improvements

1. **Server-Side Authentication**
   - Verify auth tokens on API routes
   - Session management

2. **Advanced Search**
   - Full-text search in database
   - Filter by tags, roles, etc.

3. **User Management**
   - Multiple users
   - User-specific song libraries
   - Sharing capabilities

4. **Offline Support**
   - Service workers
   - Local caching

5. **Analytics**
   - Track popular songs
   - Usage statistics

---

## Conclusion

PartKeeper is built with modern web technologies following Next.js best practices. The architecture emphasizes:

- **Separation of Concerns**: Clear client/server boundaries
- **Type Safety**: TypeScript + Zod validation
- **Maintainability**: Repository pattern, component composition
- **Scalability**: Database-backed, serverless architecture
- **User Experience**: Mobile-first, responsive design

The codebase is structured to be easily extensible and maintainable, with clear patterns and conventions throughout.

