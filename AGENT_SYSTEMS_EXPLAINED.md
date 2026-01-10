# 🚨 IMPORTANT: Agent System Clarification

## The Confusion

You have **TWO DIFFERENT agent systems** in this repository that were getting conflated:

### 1. Speckit Agents (`.github/agents/`)
- **Type**: Custom Claude/AI agent framework
- **Trigger**: Slash commands like `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`
- **Platform**: Works with Claude Desktop, Cline, or other AI tools that support custom agents
- **NOT**: Native GitHub Copilot feature
- **Files**: 
  - `.github/agents/*.agent.md` - Agent definitions
  - `.github/prompts/*.prompt.md` - Prompt templates
  - `.specify/` - Agent memory and scripts

**These will NOT show up in GitHub Copilot's @ menu.**

###  2. GitHub Copilot Chat
- **Type**: Native VS Code AI assistant
- **Trigger**: @ mentions (like `@workspace`) or chat interface
- **Platform**: GitHub Copilot extension in VS Code
- **Files**:
  - `.github/copilot-instructions.md` - Project-wide instructions
  - `.vscode/settings.json` - Configuration
  - Prompt files (referenced with #file)

## What You Were Looking For

Based on "agents from speckit show up in the drop down", you were expecting:

**Speckit agents like `@speckit.constitution` in GitHub Copilot**

❌ **This doesn't work** - Speckit is a separate agent framework.

## Your Options

### Option A: Use GitHub Copilot (Native VS Code)

**What works NOW**:

1. **Workspace Instructions** - Constitution is automatically included
   - File: `.github/copilot-instructions.md` ✅ Created
   - Setting: `github.copilot.chat.instructionsFiles` ✅ Configured
   - Usage: Just ask GitHub Copilot normally, it knows the constitution

2. **Prompt Files** - Reference specific files
   - `#constitution` → `.specify/memory/constitution.md`
   - `#constitution-quick-ref` → `CONSTITUTION_QUICK_REF.md`
   - `#constitution-summary` → `CONSTITUTION_SUMMARY.md`

**Test it**:
```
1. Open GitHub Copilot Chat (Cmd+Shift+I or icon in sidebar)
2. Ask: "What are the core principles in this project?"
3. GitHub Copilot will reference the constitution automatically
4. Or use: "Show me #constitution"
```

### Option B: Use Speckit Agents (Claude/Cline)

The Speckit agents in `.github/agents/` are designed for:
- **Claude Desktop** with MCP (Model Context Protocol)
- **Cline extension** for VS Code (not GitHub Copilot)
- **Other AI tools** that support custom agent frameworks

**To use them**:
1. Install Cline extension (NOT GitHub Copilot)
2. Configure Cline to load `.github/agents/`
3. Use slash commands: `/speckit.constitution`, `/speckit.specify`, etc.

### Option C: Both (Recommended)

Keep both systems:
- **GitHub Copilot**: Quick questions, inline suggestions, general coding
- **Speckit Agents** (via Cline/Claude): Structured workflows, feature planning, formal specifications

## Current Status

✅ **GitHub Copilot** - Ready to use
- Instructions file configured
- Prompt files mapped
- Constitution automatically loaded
- Just open Copilot Chat and ask questions

❓ **Speckit Agents** - Needs Claude/Cline
- Agent files exist in `.github/agents/`
- Scripts ready in `.specify/scripts/`
- Memory file ready in `.specify/memory/`
- Requires Claude Desktop or Cline extension to activate

## Quick Test: GitHub Copilot

**Reload VS Code window**:
```
Cmd+Shift+P → Developer: Reload Window
```

**Then try these in Copilot Chat**:
```
1. "What are the core principles?"
2. "Can I use the any type?"
3. "What are the component size limits?"
4. "Review this code for constitution compliance" (with code selected)
```

GitHub Copilot should answer using the constitution rules because:
1. `.github/copilot-instructions.md` is loaded automatically
2. Full constitution is in `.specify/memory/constitution.md`
3. Prompt files are mapped for #file references

## Why the Confusion Happened

1. **`.github/agents/` looked like GitHub Copilot agents**
   - But they're actually Speckit (custom framework)
   - GitHub Copilot doesn't use .agent.md files

2. **The naming "speckit" suggested they might be built-in**
   - They're not - Speckit is a third-party agent framework
   - Needs separate tooling (Claude/Cline)

3. **VS Code settings had `chat.promptFilesRecommendations`**
   - This is for #file references (works now)
   - Not for @ agent mentions

## Bottom Line

**Want @ mentions in VS Code?**
- Use GitHub Copilot's built-in participants: `@workspace`, `@terminal`, `@vscode`
- Custom @ agents require building a VS Code extension (complex)

**Want the constitution enforced?**
- ✅ GitHub Copilot will use it (configured now)
- Just chat normally, ask questions, get code reviews

**Want the /speckit.* commands?**
- Install Cline extension OR use Claude Desktop
- Those agents are ready, just need the right platform

---

**TL;DR**: 
- Your `.github/agents/` files are for Claude/Cline, not GitHub Copilot
- GitHub Copilot IS working and knows your constitution
- Test it: Open Copilot Chat, ask "What are the core principles?"
