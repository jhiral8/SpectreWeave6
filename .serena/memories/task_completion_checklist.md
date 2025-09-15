# SpectreWeave5 Task Completion Checklist

## Before Marking Any Task Complete

### 1. Code Quality Checks
```bash
# Run these commands to ensure code quality
npm run lint        # Check for linting errors
npm run lint:fix    # Fix auto-fixable linting issues  
npm run format      # Format code with Prettier
```

### 2. Build Verification
```bash
# Ensure the application builds successfully
npm run build       # Must complete without errors
```

### 3. Development Testing
```bash
# Start development server and verify functionality
npm run dev         # Should start without errors

# Test key endpoints manually or via curl:
# - Home page: http://localhost:3001/
# - Editor: http://localhost:3001/demo-room
# - AI health: http://localhost:3001/api/ai/health
# - AI test: http://localhost:3001/api/test/ai-endpoints
```

### 4. AI Services Validation
- **Gemini**: Should be working (✅ confirmed)
- **Databricks**: Should be working (✅ confirmed)  
- **Azure**: Requires credential update (❌ known issue)
- **Stability AI**: Available for image generation

### 5. Feature-Specific Testing
When working on editor features:
- Test in demo room (`/demo-room`)
- Verify AI toolbar functionality
- Check text formatting and slash commands
- Validate real-time collaboration if applicable

When working on AI features:
- Test generation endpoints via `/api/test/ai-endpoints`
- Verify error handling and fallback behavior
- Check cost tracking and rate limiting

### 6. Accessibility Testing (When Applicable)
```bash
npm run test:a11y   # Run accessibility tests with Playwright
```

## Phase-Specific Completion Criteria

### Phase 1 (Current)
- [x] Build verification working
- [x] AI services tested (Gemini ✅, Databricks ✅, Azure needs new creds)
- [x] Editor functionality validated
- [x] Real-time collaboration configured
- [ ] Azure authentication fixed (pending new credentials)

### Future Phases
- **Phase 2A**: RAG system integration
- **Phase 2B**: Accessibility compliance and mobile responsiveness
- **Phase 3**: Advanced AI features and production optimization

## Red Flags - Do Not Mark Complete If:
- Build fails with errors
- TypeScript compilation errors exist
- Core editor functionality broken
- API endpoints returning 500 errors (not auth-related 401s)
- Major feature regression introduced