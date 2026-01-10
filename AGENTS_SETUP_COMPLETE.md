# ✅ Agent Setup Complete - Next Steps

## Current Status

All files are properly configured:
- ✅ 9 agent files in `.github/agents/`
- ✅ 9 prompt files in `.github/prompts/`
- ✅ VS Code settings configured
- ✅ Constitution memory file updated at `.specify/memory/constitution.md`
- ✅ Full constitution at `/CONSTITUTION.md`

## What Was Updated

### 1. `.specify/memory/constitution.md` ✅
**Changed from**: Empty template with placeholders  
**Changed to**: Complete summary of SpectreWeave6 Constitution v2.0.0

Contains:
- 7 Core Principles (YAGNI, KISS, DRY, TypeScript, React, VS Code UX, Quality Gates)
- Component Architecture Standards
- State Management Strategy
- Prohibited Patterns
- Code Review Checklist
- Governance rules

### 2. `.github/prompts/speckit.constitution.prompt.md` ✅
**Changed from**: Nearly empty (just frontmatter)  
**Changed to**: Complete instructions for the constitution agent

Contains:
- Agent responsibilities
- How to answer constitution queries
- Code review guidelines
- Response format with examples
- References to all constitution files

## To Get Agents Working in VS Code

### Step 1: Reload VS Code Window
```
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
2. Type "Developer: Reload Window"
3. Press Enter
```

This is the **most important step** - VS Code needs to reload to discover the updated files.

### Step 2: Open GitHub Copilot Chat
```
1. Click the GitHub Copilot icon in the sidebar (looks like two brackets)
   OR Press Cmd+Shift+I (Mac) or Ctrl+Shift+I (Windows)
2. This opens the Copilot Chat panel
```

### Step 3: Test Agent Discovery
In the Copilot Chat input field, type:
```
@
```

You should see autocomplete with:
- `@speckit.constitution`
- `@speckit.specify`
- `@speckit.plan`
- `@speckit.tasks`
- `@speckit.implement`
- And others...

### Step 4: Test the Constitution Agent
Try these commands:

**Test 1**: Basic query
```
@speckit.constitution what are the core principles?
```

**Test 2**: Specific rule check
```
@speckit.constitution can I use the any type?
```

**Test 3**: Component size
```
@speckit.constitution what are the component size limits?
```

**Test 4**: Code review
```
@speckit.constitution review this component for constitution compliance
```

## If Agents Still Don't Appear

### Option 1: Sign Out and Back In
```
1. Cmd+Shift+P → "GitHub Copilot: Sign Out"
2. Wait for sign out confirmation
3. Cmd+Shift+P → "GitHub Copilot: Sign In"
4. Complete authentication
5. Reload window
```

### Option 2: Clear Cache
```
1. Cmd+Shift+I (open Developer Tools)
2. In Console tab, run: localStorage.clear()
3. Close Developer Tools
4. Reload window
```

### Option 3: Check Extension Updates
```
1. Open Extensions panel (Cmd+Shift+X)
2. Search for "GitHub Copilot"
3. Click "Update" if available
4. Search for "GitHub Copilot Chat"
5. Click "Update" if available
6. Reload window
```

### Option 4: Commit the Changes
Some extensions require files to be committed:
```bash
git add .github/
git add .specify/
git add CONSTITUTION*.md
git commit -m "Add constitution v2.0 and configure Speckit agents"
```

Then reload VS Code window.

## How Agents Work

### Agent Discovery Flow
```
1. VS Code loads .vscode/settings.json
   ↓
2. Reads "chat.promptFilesRecommendations"
   ↓
3. Looks for .github/agents/*.agent.md files
   ↓
4. Loads corresponding .github/prompts/*.prompt.md files
   ↓
5. Makes agents available in @mentions
```

### When You Use an Agent
```
User types: @speckit.constitution what are the principles?
    ↓
VS Code loads: .github/agents/speckit.constitution.agent.md
    ↓
Loads prompt: .github/prompts/speckit.constitution.prompt.md
    ↓
Agent accesses: .specify/memory/constitution.md
    ↓
Can reference: /CONSTITUTION.md for details
    ↓
Returns answer about the 7 core principles
```

## Available Agents

After reload, you should have access to:

1. **@speckit.constitution** - Constitution management and compliance
2. **@speckit.specify** - Feature specification creation
3. **@speckit.plan** - Technical planning
4. **@speckit.tasks** - Task breakdown
5. **@speckit.implement** - Implementation guidance
6. **@speckit.analyze** - Code analysis
7. **@speckit.checklist** - Checklist generation
8. **@speckit.clarify** - Requirement clarification
9. **@speckit.taskstoissues** - Convert tasks to GitHub issues

## Quick Test Commands

### Constitution Agent Tests
```
@speckit.constitution what are the size limits?
@speckit.constitution explain YAGNI principle
@speckit.constitution can I use inline styles?
@speckit.constitution what's the rule for state management?
@speckit.constitution review this for TypeScript compliance
```

### Other Agent Tests
```
@speckit.specify create a character profile component
@speckit.plan plan implementation of character search
@speckit.tasks break down the character panel work
```

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Agents don't appear in list | Reload window (Cmd+Shift+P > Reload) |
| Old behavior | Sign out of Copilot, sign back in |
| @speckit not recognized | Commit files, reload window |
| Agent responds incorrectly | Check .specify/memory/constitution.md was updated |
| Nothing works | Update Copilot extensions, reload |

## Success Indicators

✅ **You'll know it's working when:**
1. Typing `@` shows `@speckit.constitution` in list
2. Agent responds with constitution principles
3. Agent can answer specific questions like "what are size limits?"
4. Agent references the 7 core principles correctly
5. Agent can review code against constitution

## File Locations Reference

- **Agent Memory**: `.specify/memory/constitution.md` (what agents read)
- **Full Constitution**: `/CONSTITUTION.md` (complete 1,612 lines)
- **Quick Reference**: `/CONSTITUTION_QUICK_REF.md` (cheat sheet)
- **Agent Config**: `.github/agents/speckit.constitution.agent.md`
- **Prompt Config**: `.github/prompts/speckit.constitution.prompt.md`
- **VS Code Settings**: `.vscode/settings.json`

## Need More Help?

1. **Run verification script**: `./verify-agents.sh`
2. **Read troubleshooting guide**: `.github/AGENTS_TROUBLESHOOTING.md`
3. **Check GitHub Copilot status**: https://www.githubstatus.com/
4. **Check extension version**: Should be recent (within last 3 months)

## Final Checklist

Before asking for more help, verify:

- [ ] Reloaded VS Code window (Cmd+Shift+P > Reload Window)
- [ ] GitHub Copilot extension is installed and enabled
- [ ] GitHub Copilot Chat extension is installed and enabled
- [ ] Signed into GitHub Copilot (green checkmark in status bar)
- [ ] `.github/agents/speckit.constitution.agent.md` exists
- [ ] `.github/prompts/speckit.constitution.prompt.md` exists
- [ ] `.specify/memory/constitution.md` has content (not empty template)
- [ ] `.vscode/settings.json` has `chat.promptFilesRecommendations`
- [ ] Tried typing `@` in Copilot Chat
- [ ] Tried signing out and back into Copilot

---

**Created**: 2026-01-10  
**For**: SpectreWeave6 Constitution v2.0.0  
**Status**: ✅ Ready to use (just reload VS Code!)
