# SpectreWeave5 Project Overview

## Purpose
SpectreWeave5 is an advanced TipTap v3.x block-based document editor built with Next.js 14, featuring comprehensive AI-powered writing assistance and real-time collaboration capabilities.

## Key Features
- **AI-Powered Writing**: Multi-provider AI integration (Gemini, Azure, Databricks, Stability AI)
- **Real-time Collaboration**: Live editing and collaboration via Ably
- **Advanced Block Editor**: Rich text editing with custom blocks, slash commands, and drag-and-drop
- **Authentication**: Supabase-based user authentication
- **Modern Architecture**: Next.js 14 with TypeScript, Tailwind CSS, and comprehensive AI services

## Current Status
- **Phase 1**: ✅ Complete (except Azure auth needs new credentials)
  - Build verification: ✅ Working
  - AI services: ✅ Gemini and Databricks working, Azure needs credential update  
  - Authentication: ✅ Supabase configured
  - Real-time collaboration: ✅ Ably configured
  - Editor functionality: ✅ Working with AI features

## Technology Stack
- **Framework**: Next.js 14.1.0 with App Router
- **Language**: TypeScript 5.1.6
- **Styling**: Tailwind CSS 3.3.3 with custom design system
- **Editor**: TipTap v3.x with custom extensions
- **Authentication**: Supabase
- **Real-time**: Ably for collaboration
- **AI Providers**: Gemini, Azure AI Foundry, Databricks, Stability AI
- **Development**: Playwright for testing, ESLint for linting