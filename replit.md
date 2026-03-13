# Harvest - Agricultural Platform

## Overview
Harvest is a mobile-first React web application for agricultural communities. It connects farmers, provides farm management tools, a marketplace, community features, and an AI farm assistant.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (Radix UI)
- **Routing**: React Router v6
- **State/Data**: TanStack React Query
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth)
- **Forms**: React Hook Form + Zod

## Project Structure
```
src/
  App.tsx              # Root component, auth listener, routes
  main.tsx             # Entry point
  pages/               # Full page components (Index, Login, Signup, etc.)
  components/          # Reusable UI components
    ui/                # shadcn/ui base components
    farm/              # Farm-specific components
    community/         # Community components
    home/              # Home page components
    onboarding/        # Onboarding flow components
  contexts/
    AuthContext.tsx    # Auth state context
  services/
    supabaseClient.ts  # Supabase client instance
    profileService.ts  # User profile sync
  lib/
    dataService.ts     # Seed/init data logic
    agricultureKnowledge.ts  # AI knowledge base
    utils.ts
  hooks/               # Custom React hooks
```

## Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

## Running the App
- Development: `npm run dev` (serves on port 5000)
- Build: `npm run build`

## Key Notes
- Migrated from Lovable to Replit — `lovable-tagger` plugin removed from vite config
- Vite configured for Replit: `host: "0.0.0.0"`, `port: 5000`, `allowedHosts: true`
- Authentication is handled via Supabase Auth (email/password + Google OAuth)
- Profile sync happens automatically on auth state change
