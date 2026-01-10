# SpectreWeave6 - Story Writing Workflow Architecture

## Executive Summary

This document outlines a comprehensive user workflow for fiction writing with AI assistance. The workflow is designed as a **progressive pipeline** where each stage builds upon the previous, culminating in polished manuscript chapters.

---

## 🎯 Core User Journey

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SPECTREWEAVE WRITING PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  PHASE 1 │───▶│  PHASE 2 │───▶│  PHASE 3 │───▶│  PHASE 4 │───▶│  PHASE 5 │ │
│  │Framework │    │  Outline │    │  Draft   │    │  Review  │    │  Polish  │ │
│  │ Builder  │    │ Chapters │    │   with   │    │   with   │    │   &      │ │
│  │   (AI)   │    │   (AI)   │    │Ghostwrite│    │ Agents   │    │ Export   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       │               │               │               │               │        │
│       ▼               ▼               ▼               ▼               ▼        │
│  Characters      Chapter Beats   Raw Chapters    Feedback &      Final        │
│  Locations       Scene Cards     First Draft     Suggestions    Manuscript    │
│  Research        Plot Points     AI Generated    Agent Edits    Exported      │
│  Themes          Timeline        Human Edited    Problems       Ready         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Story Framework Builder

### Purpose
Help the user create a comprehensive story foundation before writing begins. This phase uses conversational AI to develop:
- **Genre & Premise** - What kind of story, central conflict
- **Characters** - Protagonist, antagonist, supporting cast
- **World/Setting** - Locations, rules, atmosphere
- **Themes** - Core messages and motifs
- **Research** - Historical, technical, cultural notes

### User Experience

```
┌────────────────────────────────────────────────────────────────────┐
│                    🏗️ STORY FRAMEWORK BUILDER                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Let's build your story framework together!                        │
│                                                                    │
│  What would you like to develop?                                   │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 📖 Premise  │  │ 👥 Characters│  │ 🌍 World    │                │
│  │ & Genre     │  │             │  │ Building    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 🎭 Themes   │  │ 📚 Research │  │ ⏱️ Timeline │                │
│  │             │  │             │  │             │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  [Chat with AI to develop each element...]                         │
│                                                                    │
│  AI: "Tell me about your protagonist. What drives them?"           │
│                                                                    │
│  User: "She's a detective who lost her partner and now works       │
│         alone. She's driven by guilt but hides it behind sarcasm." │
│                                                                    │
│  AI: "Great foundation! I've created a character profile:          │
│                                                                    │
│  ┌──────────────────────────────────────────────────┐              │
│  │ 👤 Detective Sarah Chen                          │              │
│  │ Role: Protagonist                                │              │
│  │ Traits: Guilt-driven, Sarcastic, Isolated        │              │
│  │ Backstory: Lost partner, works alone             │              │
│  │                                                  │              │
│  │ [✅ Save to Framework] [✏️ Edit] [❌ Discard]    │              │
│  └──────────────────────────────────────────────────┘              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### AI Capabilities for Phase 1
- **Interview Mode**: Ask guided questions to elicit story elements
- **Suggestion Mode**: Propose characters/locations/themes based on genre
- **Expansion Mode**: Take user's brief notes and flesh them out
- **Consistency Check**: Flag conflicts between elements

### Data Model
Stores in existing tables:
- `story_characters` - Character profiles
- `story_locations` - World locations
- `story_notes` - Research, themes, premise
- `story_timeline_events` - Key backstory events

---

## Phase 2: Chapter Outline & Plot Structure

### Purpose
Transform the story framework into a structured chapter outline with scene beats, ensuring narrative arc and pacing before drafting begins.

### User Experience

```
┌────────────────────────────────────────────────────────────────────┐
│                    📋 CHAPTER OUTLINE BUILDER                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Story Structure: Three-Act │ Hero's Journey │ Save the Cat        │
│                  ──────────                                        │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ACT 1: SETUP                                                │  │
│  │                                                             │  │
│  │ Ch 1: The Discovery                     [3 scenes] 📝       │  │
│  │   └─ Beat: Sarah finds old case file                        │  │
│  │   └─ Beat: Realizes connection to partner's death           │  │
│  │   └─ Beat: Decision to reopen case (inciting incident)      │  │
│  │                                                             │  │
│  │ Ch 2: Old Wounds                        [2 scenes] 📝       │  │
│  │   └─ Beat: Visits partner's widow                           │  │
│  │   └─ Beat: Flashback reveals key detail                     │  │
│  │                                                             │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ ACT 2: CONFRONTATION                                        │  │
│  │ ...                                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [🤖 AI: Generate Chapter Outline] [➕ Add Chapter] [⚙️ Settings]  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### AI Capabilities for Phase 2
- **Structure Templates**: Three-Act, Hero's Journey, Seven-Point, etc.
- **Beat Generation**: Create scene beats from chapter premise
- **Arc Analysis**: Ensure emotional/tension arcs across chapters
- **Character Integration**: Suggest character appearances per chapter
- **Timeline Consistency**: Place chapters on story timeline

### New Data Model Needed

```sql
-- Chapter outlines with beats
CREATE TABLE chapter_outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    
    -- Outline content
    premise TEXT,              -- One-line chapter premise
    pov_character_id UUID REFERENCES story_characters(id),
    location_ids UUID[],       -- Locations featured
    
    -- Story structure
    act INTEGER,               -- 1, 2, 3 for three-act
    structure_beat VARCHAR(50), -- "inciting_incident", "midpoint", etc.
    
    -- Beats (scene-level)
    beats JSONB DEFAULT '[]',  -- [{title, description, characters, location, tension_level}]
    
    -- AI generation tracking
    ai_generated BOOLEAN DEFAULT false,
    generation_prompt TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 3: Drafting with Ghostwriter

### Purpose
Write the actual manuscript with AI assistance. The Ghostwriter mode generates prose while maintaining consistency with the established framework.

### User Experience

```
┌────────────────────────────────────────────────────────────────────┐
│                    ✍️ GHOSTWRITER - Chapter 1                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Current Beat: Sarah finds old case file                     │  │
│  │ Location: @Precinct 15                                      │  │
│  │ Characters: @Sarah Chen                                     │  │
│  │ Target: 800 words │ Current: 234 │ Tension: Low → Medium    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  The fluorescent lights of the basement archives buzzed     │  │
│  │  their familiar complaint as Sarah descended the concrete   │  │
│  │  stairs. Three years she'd avoided this place.█            │  │
│  │                                                             │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ░░░ AI Ghost Suggestion: "The dust motes danced in the ░░░ │  │
│  │  ░░░ single shaft of light from the high window, and she ░░░ │  │
│  │  ░░░ wondered if anyone had been down here since—"       ░░░ │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                                                             │  │
│  │  [Tab to accept] [Esc to dismiss] [→ for word-by-word]     │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Context Panel:                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │
│  │ 👤 Sarah    │ │ 📍 Precinct │ │ 📋 Beat     │                  │
│  │ sarcastic,  │ │ basement    │ │ finds file  │                  │
│  │ guilt-driven│ │ archives    │ │             │                  │
│  └─────────────┘ └─────────────┘ └─────────────┘                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Ghostwriter Modes
1. **Inline Completion** (GitHub Copilot style) - Tab to accept
2. **Block Generation** - "Write the next paragraph about X"
3. **Selection Rewrite** - Select text, describe how to change
4. **Beat-to-Prose** - Expand a scene beat into full prose

### AI Context Injection
The Ghostwriter should automatically include:
- Current chapter's outline/beats
- Active characters' profiles
- Current location details
- Recent narrative context (last 2000 words)
- Story themes and tone guide

---

## Phase 4: Specialist Agent Review

### Purpose
After drafting, invoke specialist AI agents to review and improve specific aspects of the writing. Each agent has deep expertise in one area.

### Agent Roster

| Agent | Specialty | Invocation | Output |
|-------|-----------|------------|--------|
| 🎭 **Dialogue Master** | Natural conversation, subtext, character voice | "Review dialogue" | Rewrites with alternatives |
| 📝 **Style Coach** | Prose style, show-don't-tell, adverb usage | "Analyze style" | Inline suggestions |
| 👤 **Character Keeper** | Voice consistency, arc progression | "Check characters" | Consistency report |
| 🌍 **World Builder** | Setting details, atmosphere | "Enhance setting" | Descriptive additions |
| 📊 **Plot Analyst** | Pacing, tension, plot holes | "Analyze plot" | Structure feedback |
| ✂️ **Editor** | Line editing, tightening | "Edit for clarity" | Tracked changes |

### User Experience

```
┌────────────────────────────────────────────────────────────────────┐
│                    🤖 AGENT REVIEW - Chapter 1                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Select agents to review your chapter:                             │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ☑️ 🎭 Dialogue Master - Check dialogue naturalness          │  │
│  │ ☑️ 📝 Style Coach - Analyze prose style                     │  │
│  │ ☐ 👤 Character Keeper - Verify character consistency        │  │
│  │ ☐ 🌍 World Builder - Enhance setting descriptions           │  │
│  │ ☐ 📊 Plot Analyst - Check pacing and tension                │  │
│  │ ☐ ✂️ Editor - Line edit for clarity                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [▶️ Run Selected Agents]                                          │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│                                                                    │
│  🎭 Dialogue Master Report:                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Line 45: "I don't care," she said angrily.                  │  │
│  │                                                             │  │
│  │ ⚠️ Issue: "said angrily" tells emotion instead of showing   │  │
│  │                                                             │  │
│  │ 💡 Suggestion: "I don't care." She slammed the folder       │  │
│  │    onto the desk, scattering papers.                        │  │
│  │                                                             │  │
│  │ [✅ Accept] [✏️ Edit] [❌ Dismiss] [👁️ Compare]             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  📝 Style Coach Report:                                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Paragraph 3: Passive voice detected                         │  │
│  │                                                             │  │
│  │ Original: "The file was found by Sarah in the corner."      │  │
│  │ Suggested: "Sarah found the file in the corner."            │  │
│  │                                                             │  │
│  │ [✅ Accept] [✏️ Edit] [❌ Dismiss]                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Agent Workflow Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Select    │────▶│    Run      │────▶│   Review    │
│   Agents    │     │   Agents    │     │   Results   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Problems   │     │   Accept/   │
                    │   Panel     │     │   Reject    │
                    └─────────────┘     └─────────────┘
```

### Data Model for Agent Reviews

```sql
-- Agent review sessions
CREATE TABLE agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    
    -- Agent info
    agent_id VARCHAR(50) NOT NULL,
    agent_name VARCHAR(100),
    
    -- Input/Output
    input_content TEXT,
    input_word_count INTEGER,
    
    -- Results
    suggestions JSONB DEFAULT '[]', -- [{line, issue, suggestion, accepted}]
    summary TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 5: Polish & Export

### Purpose
Final preparation of manuscript for export, including:
- Apply all accepted agent suggestions
- Format for target output (EPUB, PDF, DOCX, etc.)
- Generate front/back matter
- Compile into full manuscript

### User Experience

```
┌────────────────────────────────────────────────────────────────────┐
│                    📤 EXPORT MANUSCRIPT                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Project: "The Cold Case Files"                                    │
│  Chapters: 24 │ Words: 87,432 │ Status: Ready for Export          │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│                                                                    │
│  Pre-Export Checks:                                                │
│  ✅ All agent suggestions reviewed                                 │
│  ✅ Character consistency verified                                 │
│  ⚠️ 3 unresolved plot notes                                       │
│  ✅ Timeline consistent                                            │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│                                                                    │
│  Export Format:                                                    │
│  ○ EPUB (eBook)                                                    │
│  ● DOCX (Word)                                                     │
│  ○ PDF (Print-ready)                                               │
│  ○ Markdown                                                        │
│                                                                    │
│  Include:                                                          │
│  ☑️ Title Page                                                     │
│  ☑️ Table of Contents                                              │
│  ☐ Character Guide                                                 │
│  ☐ World Map (if available)                                        │
│                                                                    │
│  [📥 Export Manuscript]                                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Plan

### New Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `StoryFrameworkWizard` | Guided framework creation | High |
| `ChapterOutlineBuilder` | Chapter/beat planning | High |
| `AgentReviewPanel` | Multi-agent review UI | High |
| `AgentSuggestionCard` | Individual suggestion UI | High |
| `ExportWizard` | Manuscript export | Medium |
| `TimelineView` | Visual timeline | Medium |
| `StructureTemplates` | Plot structure presets | Medium |

### New API Endpoints

```
POST /api/ai/framework/interview    - Guided framework questions
POST /api/ai/framework/expand       - Expand brief into full element
POST /api/ai/outline/generate       - Generate chapter outline
POST /api/ai/outline/beats          - Generate scene beats
POST /api/ai/ghostwrite             - Existing, enhanced with context
POST /api/ai/agents/review          - Run specialist agent review
POST /api/ai/agents/batch           - Run multiple agents
GET  /api/export/epub               - Export as EPUB
GET  /api/export/docx               - Export as DOCX
```

### Database Migrations Needed

1. `chapter_outlines` - Store chapter plans and beats
2. `agent_reviews` - Store agent feedback sessions
3. `story_structures` - Store structure templates
4. `export_history` - Track exports

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐                                             │
│   │ WriterIDE     │◄────── Entry Point                         │
│   └───────┬───────┘                                             │
│           │                                                     │
│   ┌───────┴────────────────────────────────────────────┐       │
│   │                                                    │       │
│   ▼                                                    ▼       │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │LeftPanel       │  │ EditorArea      │  │ RightPanel      │  │
│ │                │  │                 │  │                 │  │
│ │ StoryExplorer  │  │ TipTap Editor   │  │ AICopilotPanel  │  │
│ │ CharactersPanel│  │ GhostText       │  │   - Discuss     │  │
│ │ NotesPanel     │  │ InlineSuggest   │  │   - Ghostwrite  │  │
│ │ WorldBuilding  │  │                 │  │   - Agents      │  │
│ │ Timeline       │  │                 │  │ ContextPanel    │  │
│ └────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ BottomPanel                                           │    │
│   │ Problems │ Agent Results │ Output │ Terminal          │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎬 User Scenarios

### Scenario 1: New User Starting Fresh

1. Create new project → "The Cold Case Files"
2. **Framework Wizard** opens automatically
3. AI asks: "What genre is your story?"
4. User: "Crime thriller with psychological elements"
5. AI suggests characters, user refines
6. AI suggests locations based on crime thriller
7. Framework saved, moves to outline phase
8. AI generates 3-act chapter structure
9. User adjusts chapters, adds beats
10. Ready to draft!

### Scenario 2: Drafting Session

1. Open Chapter 3 for editing
2. See current beat: "Sarah confronts suspect"
3. Start typing, Ghostwriter suggests continuations
4. Tab to accept good suggestions
5. Use @Sarah to inject character details
6. Ask: "Write dialogue where Sarah pressures the suspect"
7. Review AI-generated dialogue, edit and accept
8. Chapter complete, word count met

### Scenario 3: Review Session

1. Chapter 3 drafted, click "Review with Agents"
2. Select: Dialogue Master, Style Coach
3. Agents run (30 seconds)
4. 12 suggestions appear in Problems panel
5. Click suggestion → jumps to line in editor
6. Accept/reject each suggestion
7. 8 accepted, 4 dismissed
8. Chapter updated with improvements

---

## 📊 Success Metrics

- **Framework Completion Rate**: % of users who complete all framework elements
- **Outline-to-Draft Conversion**: % of outlined chapters that get drafted
- **Agent Suggestion Acceptance**: % of agent suggestions accepted
- **Time-to-First-Draft**: Time from project creation to first chapter draft
- **Export Rate**: % of projects that reach export stage

---

## 🚀 Implementation Phases

### Phase A: Foundation (Week 1-2)
- [ ] Create `StoryFrameworkWizard` component
- [ ] Enhance `AICopilotPanel` with Framework mode
- [ ] Add framework interview API endpoints
- [ ] Create `chapter_outlines` table

### Phase B: Outline System (Week 3-4)
- [ ] Create `ChapterOutlineBuilder` component
- [ ] Add structure templates (3-act, Hero's Journey, etc.)
- [ ] Scene beat generation API
- [ ] Timeline integration

### Phase C: Agent Review (Week 5-6)
- [ ] Create `AgentReviewPanel` component
- [ ] Implement batch agent execution
- [ ] Create `agent_reviews` table
- [ ] Integrate with Problems panel

### Phase D: Polish & Export (Week 7-8)
- [ ] Create `ExportWizard` component
- [ ] EPUB/DOCX/PDF export APIs
- [ ] Pre-export validation checks
- [ ] Final testing and refinement

---

## Appendix: Existing Components to Leverage

| Component | Current State | Enhancement Needed |
|-----------|---------------|-------------------|
| `AICopilotPanel` | Discuss/Ghostwrite modes | Add Framework/Agents modes |
| `CharactersPanel` | Basic CRUD | AI-assisted creation |
| `NotesPanel` | Basic CRUD | AI-assisted expansion |
| `WorldBuildingPanel` | Basic CRUD | AI-assisted development |
| `AIAgentsPanel` | Agent definitions | Execution workflow |
| `StoryExplorer` | Chapter tree | Outline integration |
| `EditorTabs` | Chapter editing | Beat progress indicator |
| `BottomPanel` | Problems display | Agent results tab |

---

*Document Version: 1.0*
*Last Updated: January 5, 2026*
