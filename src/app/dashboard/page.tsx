// legacy dashboard page removed (use /portal/dashboard)
export default function DashboardPage() { return null }

/**
 * Dashboard Page - Professional SpectreWeave5 project management interface
 * Features:
 * - Linear-inspired dashboard layout
 * - Advanced project table with sorting and filtering
 * - AI-powered project cards with health indicators
 * - Real-time search and filtering
 * - Professional project creation and editing
 * - Comprehensive project analytics
 * - SpectreWeave AI border effects throughout
 */
// (file kept to avoid import breakage; returns null)

/**
 * Component Architecture:
 * 
 * DashboardPage (Main Route)
 * └── ProjectsDashboard (Professional Interface)
 *     ├── DashboardLayout (Linear-inspired Layout)
 *     │   ├── Sidebar (Navigation & User Profile)
 *     │   ├── TopBar (Search & Breadcrumbs)
 *     │   └── Main Content Area
 *     ├── ProjectFilters (Advanced Filtering & Search)
 *     ├── ProjectTable (Sortable Data Table)
 *     ├── ProjectCard[] (AI-enhanced Grid Cards)
 *     ├── ProjectModal (Create/Edit Modal)
 *     └── useProjects Hook (Data Management)
 * 
 * Key Features:
 * - Professional Linear-inspired design
 * - Advanced project table with sorting/filtering
 * - AI-powered health indicators and insights
 * - Real-time search with debouncing
 * - Comprehensive project analytics
 * - SpectreWeave AI border effects
 * - Full accessibility compliance
 * - Mobile-responsive design patterns
 */