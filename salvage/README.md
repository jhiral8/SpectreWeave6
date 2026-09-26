# Salvaged code from SpectreWeave4 and SpectreWeave5

This folder keeps features from the older SpectreWeave repos that SpectreWeave6 does not have, so those repos can be archived without losing them.

Nothing here is wired into the app. The folder is excluded in `tsconfig.json` and sits outside `src/`, so it doesn't affect the build or lint. Paths inside each subfolder match where the files lived in the original repo, so imports like `@/lib/...` refer to the old layout and will need adjusting when a feature is brought back.

## from-spectreweave5

These were switched off in SpectreWeave5's last commits (14 Aug 2025) to get the Netlify deploy passing, then left out of SpectreWeave6.

| Feature | Files |
|---|---|
| Character consistency: character lock, ControlNet pose control, prompt engineering | `src/lib/ai/characterLock.ts`, `controlNet.ts`, `promptEngineering.ts` |
| Character API: profiles, generation, turnarounds, reference images, validation, consistency checks, GraphRAG | `src/app/api/characters/**` |
| Character UI: manager, profile forms, turnaround viewer, consistency analyzer | `src/components/characters/**` |
| Children's-book generator: story and illustration generation (with tests) | `src/lib/ai/childrensBookAI.ts`, `childrensBookImages.ts`, `src/app/api/children-books/**` |
| RAG lab page | `src/app/portal/rag-lab/page.tsx` |

The OpenCLIP microservice these depend on is already in SpectreWeave6 at `src/services/openclip`.

## from-spectreweave4

SpectreWeave4 ("GhostWeave") was a Vite + React prototype (last commit 30 Jul 2025). These pieces have no equivalent in SpectreWeave6.

| Feature | Files |
|---|---|
| Export to EPUB, PDF and Word | `src/services/exportService.ts`, `src/components/ExportPanel.tsx`, `netlify/functions/epub-export.js` |
| Publishing workflow | `src/services/publishingService.ts`, `src/components/PublishingWorkflow.tsx` |
| Cover-art generation (Stability AI) | `src/services/coverArtService.ts`, `src/components/CoverArtGenerator.tsx` |
| Genre agents with author-style presets (`GENRE_AGENTS`) | `src/services/aiService.ts` |
| Editorial analysis with genre-specific criteria | `src/services/editorialAnalysisService.ts` |
| Writing analytics and session tracking | `src/components/WritingAnalytics.tsx`, `WritingSessionTracker.tsx` |
| Version history service | `src/services/versionHistoryService.ts` |
| Custom TipTap blocks: character profile, author style, feedback, slash commands | `src/extensions/*`, `src/components/editor/*` |
| Project templates | `src/components/projectTemplates.ts` |

SpectreWeave4 used Vite and a different dependency set (`jspdf`, `docx`, `@lesjoursfr/html-to-epub`, `html2canvas`, `file-saver`), so porting any of these into SpectreWeave6 means adding those packages back.
