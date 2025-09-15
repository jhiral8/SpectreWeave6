# SpectreWeave5 Development Commands

## Development Server
```bash
npm run dev          # Start development server (usually http://localhost:3000 or 3001)
```

## Build and Production
```bash
npm run build        # Create production build
npm run start        # Start production server
```

## Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
```

## Testing
```bash
npm run test:a11y    # Run accessibility tests with Playwright
npm run test:a11y:ui # Run accessibility tests with UI
npm run test:a11y:report # Show accessibility test report
```

## Development URLs
- **Main App**: http://localhost:3001 (or 3000)
- **Demo Editor**: http://localhost:3001/demo-room
- **AI Health Check**: http://localhost:3001/api/ai/health
- **AI Test Endpoint**: http://localhost:3001/api/test/ai-endpoints

## Environment Setup
- Copy `.env` file with proper API keys for AI services
- Supabase, Ably, and AI provider credentials configured
- TipTap collaboration secret configured

## Windows-Specific Notes
- Use `cd "C:\path\with spaces"` for paths with spaces
- Git commands work normally on Windows
- PowerShell and Command Prompt both supported