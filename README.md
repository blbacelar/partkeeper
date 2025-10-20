# PartKeeper 🎵

A modern, mobile-first web application for managing quartet songs with per-voice YouTube parts and lyrics. Built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

- **🎼 Song Management**: Add, edit, and delete songs with comprehensive metadata
- **🎭 Voice Parts**: Organize songs by voice parts (1st-tenor, 2nd-tenor, baritone, bass)
- **📺 YouTube Integration**: Embed YouTube videos for each voice part and reference videos
- **📝 Lyrics Support**: Toggleable lyrics for each song
- **🔍 Smart Search**: Search across song titles, artists, and tags
- **📱 Mobile-First**: Responsive design optimized for all screen sizes
- **🔐 Access Control**: Simple access code authentication
- **💾 Data Persistence**: File-based storage with API abstraction for easy database migration

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Validation**: Zod
- **Authentication**: LocalStorage-based access code
- **Data**: JSON file storage with repository pattern

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/blbacelar/partkeeper.git
   cd partkeeper
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and configure your setup:
   
   **For file-based storage (default):**
   ```env
   NEXT_PUBLIC_ACCESS_CODE=your-secret-code
   NEXT_PUBLIC_SONGS_BACKEND=file
   SONGS_FILE_PATH=public/data/songs.json
   ```
   
   **For database storage (Prisma):**
   ```env
   NEXT_PUBLIC_ACCESS_CODE=your-secret-code
   NEXT_PUBLIC_SONGS_BACKEND=prisma
   DATABASE_URL="postgresql://username:password@localhost:5432/partkeeper"
   ```

  4. **Set up database (if using Prisma)**
     
     **For Supabase (Recommended):**
     1. Create a new project at [supabase.com](https://supabase.com)
     2. Go to Settings → Database to get your connection string
     3. Update your `.env.local` with the Supabase connection details:
        ```env
        NEXT_PUBLIC_SONGS_BACKEND=prisma
        DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
        DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
        ```
     4. Run the database setup commands:
        ```bash
        # Generate Prisma client
        npm run db:generate
         
        # Push schema to database
        npm run db:push
         
        # Seed with existing songs
        npm run db:seed
        ```
     
     **For local PostgreSQL:**
     ```bash
     # Generate Prisma client
     npm run db:generate
     
     # Push schema to database
     npm run db:push
     
     # Seed with existing songs
     npm run db:seed
     ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Authentication
- Enter the access code you set in `NEXT_PUBLIC_ACCESS_CODE`
- The app will remember your authentication in localStorage

### Managing Songs
1. **Dashboard**: View all your songs in a responsive grid
2. **Add Songs**: Click "Manage Songs" → "Add New Song"
3. **Edit Songs**: Click the "Edit" button on any song card
4. **Delete Songs**: Click the trash icon on any song card

### Song Details
- **Voice Parts**: Switch between different voice parts using tabs
- **Reference Video**: Watch the main reference video
- **Lyrics**: Toggle lyrics on/off for each voice part
- **Navigation**: Use browser back button or click the app name

### Search
- Use the search bar to find songs by title, artist, or tags
- Search is case-insensitive and searches across all fields

## 📁 Project Structure

```
partkeeper/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/songs/         # API routes for CRUD operations
│   │   ├── songs/[id]/        # Song detail pages
│   │   └── songs/manage/      # Song management page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Header.tsx        # Navigation header
│   │   ├── SongCard.tsx      # Song display card
│   │   ├── SongForm.tsx      # Add/edit song form
│   │   ├── YouTubePart.tsx   # YouTube video embed
│   │   └── LyricBlock.tsx    # Toggleable lyrics
│   └── lib/                  # Utilities and schemas
│       ├── schemas.ts        # Zod validation schemas
│       ├── auth.ts           # Authentication utilities
│       └── repos/            # Data repository pattern
├── public/data/              # JSON data storage
└── components.json           # shadcn/ui configuration
```

## 🎵 Song Data Schema

Songs are stored in JSON format with the following structure:

```typescript
{
  "meta": {
    "version": number,
    "updatedAt": string
  },
  "songs": Array<{
    "id": string,
    "title": string,
    "artist"?: string,
    "tags"?: string[],
    "defaultRole"?: "1st-tenor" | "2nd-tenor" | "baritone" | "bass",
    "parts": {
      "1st-tenor": string,    // YouTube URL
      "2nd-tenor": string,    // YouTube URL
      "baritone": string,     // YouTube URL
      "bass": string          // YouTube URL
    },
    "lyrics"?: string,
    "source"?: string,        // Reference video URL
    "notes"?: string,
    "updatedAt"?: string
  }>
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ACCESS_CODE` | Access code for authentication | Required |
| `NEXT_PUBLIC_SONGS_BACKEND` | Backend type (`file` or `database`) | `file` |
| `SONGS_FILE_PATH` | Path to songs JSON file | `public/data/songs.json` |

### Database Migration

The app uses a repository pattern for data access. To migrate to a database:

1. Create a new repository implementation in `src/lib/repos/`
2. Update the `createSongsRepository` function
3. Set `NEXT_PUBLIC_SONGS_BACKEND=database` in your environment

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_ACCESS_CODE`: Your secret access code
   - `NEXT_PUBLIC_SONGS_BACKEND`: `file`
   - `SONGS_FILE_PATH`: `public/data/songs.json`
3. **Deploy**: Vercel will automatically deploy on every push to main

### Manual Deployment

```bash
npm run build
npm start
```

## 🎨 Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Components use shadcn/ui with Tailwind CSS

### Adding Components
```bash
npx shadcn-ui@latest add [component-name]
```

### Authentication
- Modify `src/lib/auth.ts` to change authentication logic
- Update `src/components/LoginGate.tsx` for UI changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

---

**PartKeeper** - Keep your quartet songs organized and accessible! 🎵