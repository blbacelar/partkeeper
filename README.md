# PartKeeper

A mobile-first web app for tracking quartet songs with per-voice YouTube parts and lyrics.

## Features

- **Authentication**: Simple access code-based login
- **Song Library**: Browse and search through your quartet song collection
- **Per-Voice Parts**: YouTube embeds for each voice part (1st-tenor, 2nd-tenor, baritone, bass)
- **Lyrics**: Toggleable lyrics display for each song
- **Mobile-First**: Optimized for mobile devices with thumb-friendly UI
- **Tab Memory**: Remembers your last selected voice part per song
- **Deep Linking**: Direct links to specific voice parts (e.g., `#bass`)
- **Search**: Client-side search across song titles, artists, and tags

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Zod** for data validation
- **Framer Motion** for animations
- **Lucide React** for icons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and set your access code:
   ```
   NEXT_PUBLIC_ACCESS_CODE=your-secret-code
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Data Structure

Songs are stored in `/public/data/songs.json` with the following schema:

```typescript
{
  meta: { version: number, updatedAt: string },
  songs: Array<{
    id: string,
    title: string,
    artist?: string,
    tags?: string[],
    defaultRole?: "1st-tenor"|"2nd-tenor"|"baritone"|"bass",
    parts: Record<"1st-tenor"|"2nd-tenor"|"baritone"|"bass", string>,
    lyrics?: string,
    source?: string,
    notes?: string,
    updatedAt?: string
  }>
}
```

## Usage

1. **Login**: Enter the access code to access the app
2. **Browse Songs**: View all available songs on the dashboard
3. **Search**: Use the search bar to find specific songs
4. **Select a Song**: Click on any song card to view details
5. **Choose Voice Part**: Use the tabs to switch between voice parts
6. **Watch & Learn**: Play YouTube videos and toggle lyrics as needed

## Features in Detail

### Authentication
- Simple access code authentication
- Session persistence with localStorage
- Automatic logout functionality

### Song Management
- Responsive card-based song library
- Real-time search across titles, artists, and tags
- Song details with metadata display

### Voice Parts
- Tabbed interface for each voice part
- YouTube video embeds with lazy loading
- Toggleable lyrics display
- Smooth animations between tabs

### Mobile Optimization
- Touch-friendly interface
- Responsive design for all screen sizes
- Optimized for thumb navigation
- Sticky header for easy access

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── lib/                # Utilities and schemas
└── public/data/        # Static data files
```

### Key Components
- `LoginGate`: Authentication wrapper
- `Header`: Sticky navigation header
- `SongCard`: Song library item
- `YouTubePart`: Video player component
- `LyricBlock`: Toggleable lyrics display

## Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform** (Vercel, Netlify, etc.)

3. **Set environment variables** in your deployment platform:
   - `NEXT_PUBLIC_ACCESS_CODE`: Your secret access code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.