# GitHub Copilot Agents Troubleshooting Guide

## Issue: Agents Not Appearing in Selector

If your Speckit agents (including the constitution agent) are not appearing in the GitHub Copilot extension, follow these troubleshooting steps.

---

## ✅ Verification Checklist

### 1. File Structure
Verify all required files are present:

```bash
# Check agents
ls -la .github/agents/*.agent.md

# Check prompts
ls -la .github/prompts/*.prompt.md

# Expected agents:
# - speckit.constitution.agent.md ✓
# - speckit.specify.agent.md ✓
# - speckit.plan.agent.md ✓
# - speckit.tasks.agent.md ✓
# - speckit.implement.agent.md ✓
# - speckit.analyze.agent.md ✓
# - speckit.checklist.agent.md ✓
# - speckit.clarify.agent.md ✓
# - speckit.taskstoissues.agent.md ✓
```

### 2. VS Code Settings
Check `.vscode/settings.json` contains:

```json
{
    "chat.promptFilesRecommendations": {
        "speckit.constitution": true,
        "speckit.specify": true,
        "speckit.plan": true,
        "speckit.tasks": true,
        "speckit.implement": true
    }
}
```

### 3. Agent File Format
Each agent file should have frontmatter:

```markdown
---
description: Agent description here
handoffs: 
  - label: Handoff label
    agent: target.agent
    prompt: Prompt text
---

## User Input
```text
$ARGUMENTS
```

[Rest of agent instructions]
```

### 4. Prompt File Format
Each prompt file should have frontmatter:

```markdown
---
agent: agent.name
---

[Prompt instructions - can be minimal or detailed]
```

---

## 🔧 Troubleshooting Steps

### Step 1: Reload VS Code Window
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Developer: Reload Window"
3. Press Enter
4. Wait for VS Code to fully reload

### Step 2: Check GitHub Copilot Extension
1. Open Extensions panel (`Cmd+Shift+X`)
2. Verify "GitHub Copilot" extension is installed and enabled
3. Check for updates to the extension
4. If update available, update and reload

### Step 3: Check GitHub Copilot Chat Extension
1. In Extensions panel, search for "GitHub Copilot Chat"
2. Verify it's installed and enabled
3. Version should be recent (check for updates)

### Step 4: Verify Git Repository
Agents require a git repository:

```bash
# Check if this is a git repo
git status

# If not, initialize
git init
git add .
git commit -m "Initial commit"
```

### Step 5: Check Agent Discovery Path
GitHub Copilot looks for agents in specific locations:
- `.github/agents/*.agent.md` ✓
- `.github/prompts/*.prompt.md` ✓

Verify file permissions:
```bash
chmod 644 .github/agents/*.agent.md
chmod 644 .github/prompts/*.prompt.md
```

### Step 6: Clear GitHub Copilot Cache
1. Open VS Code Developer Tools:
   - Mac: `Cmd+Shift+I` or `Help` > `Toggle Developer Tools`
   - Windows/Linux: `Ctrl+Shift+I`
2. Go to Console
3. Run: `localStorage.clear()`
4. Close DevTools
5. Reload window (`Cmd+Shift+P` > "Reload Window")

### Step 7: Check Copilot Authentication
1. Open Command Palette (`Cmd+Shift+P`)
2. Type "GitHub Copilot: Sign Out"
3. Sign back in
4. Reload window

### Step 8: Enable Verbose Logging
1. Open Settings (`Cmd+,`)
2. Search for "copilot"
3. Enable "GitHub Copilot: Enable Debug"
4. Check Output panel (`View` > `Output`)
5. Select "GitHub Copilot" from dropdown
6. Look for errors related to agent discovery

---

## 🎯 How to Access Agents

Once working, agents appear in multiple ways:

### Method 1: Chat Interface
1. Open GitHub Copilot Chat (icon in sidebar)
2. Type `@` in the chat input
3. You should see your agents in the autocomplete list:
   - `@speckit.constitution`
   - `@speckit.specify`
   - `@speckit.plan`
   - etc.

### Method 2: Slash Commands
In the chat, type `/` to see available commands:
- `/speckit.constitution`
- `/speckit.specify`
- `/speckit.plan`
- etc.

### Method 3: Chat Participants
In the chat input, agents appear as participants you can mention with `@` symbol.

---

## 📝 Testing Agent Discovery

### Test 1: Simple Agent Call
In GitHub Copilot Chat, type:
```
@speckit.constitution what are the core principles?
```

Expected: Agent responds with the 7 core principles.

### Test 2: Constitution Query
```
@speckit.constitution can I use the any type in TypeScript?
```

Expected: Agent explains the zero-tolerance policy for `any` types.

### Test 3: Slash Command
```
/speckit.constitution
```

Expected: Agent activates and asks how it can help with the constitution.

---

## 🐛 Common Issues & Solutions

### Issue: "Command not found" or agent not in list

**Solution 1**: File naming
- Ensure files end with `.agent.md` and `.prompt.md`
- Use lowercase names with dots: `speckit.constitution.agent.md`

**Solution 2**: Frontmatter format
- Must have `---` on separate lines
- No extra spaces in YAML
- Description field is required in agent files

**Solution 3**: Git repository
- Must be in a git repository
- Try: `git add .github/` and commit

### Issue: Agent appears but doesn't respond correctly

**Solution**: Check the prompt file
- Ensure `.github/prompts/speckit.constitution.prompt.md` has content
- Frontmatter must have `agent:` matching the agent name
- Instructions should be clear

### Issue: Old agent behavior (not seeing updates)

**Solution**: Clear cache
1. Sign out of GitHub Copilot
2. Reload VS Code window
3. Sign back in
4. Try agent again

### Issue: Agents work in one workspace but not another

**Solution**: Check workspace settings
- Ensure `.vscode/settings.json` exists in workspace root
- Contains `chat.promptFilesRecommendations` with agent names
- Settings are workspace-specific, not global

---

## 🔍 Verification Commands

Run these to verify setup:

```bash
# 1. Count agent files (should be 9)
ls -1 .github/agents/*.agent.md | wc -l

# 2. Count prompt files (should be 9)
ls -1 .github/prompts/*.prompt.md | wc -l

# 3. Check frontmatter in constitution agent
head -n 10 .github/agents/speckit.constitution.agent.md

# 4. Check frontmatter in constitution prompt
head -n 10 .github/prompts/speckit.constitution.prompt.md

# 5. Verify VS Code settings exist
cat .vscode/settings.json
```

---

## 📚 File Locations Quick Reference

### Constitution Files
- **Speckit Memory**: `.specify/memory/constitution.md` (summary for agents)
- **Full Reference**: `/CONSTITUTION.md` (complete 1,612 lines)
- **Quick Reference**: `/CONSTITUTION_QUICK_REF.md` (cheat sheet)
- **Summary**: `/CONSTITUTION_SUMMARY.md` (overview)
- **Changelog**: `/CONSTITUTION_CHANGELOG.md` (changes)

### Agent Configuration
- **Agent Definitions**: `.github/agents/*.agent.md`
- **Prompt Files**: `.github/prompts/*.prompt.md`
- **VS Code Settings**: `.vscode/settings.json`

### How They Connect
```
User types in Chat → @speckit.constitution
                      ↓
VS Code looks up     .vscode/settings.json (recommendation)
                      ↓
Loads agent from     .github/agents/speckit.constitution.agent.md
                      ↓
Loads prompt from    .github/prompts/speckit.constitution.prompt.md
                      ↓
Agent accesses       .specify/memory/constitution.md
                      ↓
References           /CONSTITUTION.md (if needed)
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Typing `@` in Copilot Chat shows `@speckit.constitution` in autocomplete
2. ✅ Typing `/spec` shows `/speckit.constitution` in command list
3. ✅ Calling `@speckit.constitution` gets a response about the constitution
4. ✅ Agent can answer questions like "what are the core principles?"
5. ✅ Agent enforces rules like "no `any` types allowed"

---

## 🆘 Still Not Working?

If you've tried all the above:

1. **Check VS Code Version**: Ensure you're on a recent version (1.85+)
2. **Check Copilot Subscription**: Verify your GitHub Copilot subscription is active
3. **Check Extension Version**: GitHub Copilot Chat extension should be up to date
4. **Try Different Workspace**: Test in a fresh folder with just one agent file
5. **Check GitHub Status**: Visit https://www.githubstatus.com/ for service issues

### Report Issue
If still failing, collect this info:
- VS Code version
- GitHub Copilot extension version
- Operating system
- Output from verbose logging
- Screenshot of Extensions panel
- Output of verification commands above

---

## 📞 Quick Test Script

Run this to test everything at once:

```bash
#!/bin/bash
echo "=== GitHub Copilot Agents Verification ==="
echo ""
echo "1. Agent files:"
ls -1 .github/agents/*.agent.md 2>/dev/null || echo "❌ No agent files found"
echo ""
echo "2. Prompt files:"
ls -1 .github/prompts/*.prompt.md 2>/dev/null || echo "❌ No prompt files found"
echo ""
echo "3. VS Code settings:"
cat .vscode/settings.json 2>/dev/null || echo "❌ No .vscode/settings.json found"
echo ""
echo "4. Constitution files:"
ls -1 CONSTITUTION*.md 2>/dev/null || echo "❌ No constitution files found"
ls -1 .specify/memory/constitution.md 2>/dev/null || echo "❌ No .specify/memory/constitution.md found"
echo ""
echo "5. Git status:"
git status --short 2>/dev/null || echo "❌ Not a git repository"
echo ""
echo "=== Verification Complete ==="
```

Save as `verify-agents.sh`, make executable with `chmod +x verify-agents.sh`, then run with `./verify-agents.sh`

---

**Last Updated**: 2026-01-10  
**For**: SpectreWeave6 Constitution v2.0.0
