# GitHub Copilot Agents - Command Reference

Quick reference for all available Speckit agents in SpectreWeave6.

---

## 🎯 Constitution Agent

**Agent**: `@speckit.constitution`  
**Purpose**: Constitution management, compliance checking, code review

### Common Commands

```
@speckit.constitution what are the core principles?
@speckit.constitution what are the component size limits?
@speckit.constitution can I use the any type?
@speckit.constitution explain the YAGNI principle
@speckit.constitution what's the rule for colors?
@speckit.constitution how should I manage state?
@speckit.constitution review this code for compliance
@speckit.constitution what are prohibited patterns?
```

### Use When
- ✅ Checking if code follows constitution
- ✅ Learning about coding standards
- ✅ Code review against principles
- ✅ Understanding size limits
- ✅ State management decisions
- ✅ TypeScript rules questions

---

## 📋 Specify Agent

**Agent**: `@speckit.specify`  
**Purpose**: Create feature specifications from natural language

### Common Commands

```
@speckit.specify create a character profile component
@speckit.specify add search functionality to characters panel
@speckit.specify build an export to PDF feature
@speckit.specify add keyboard shortcuts for editor
```

### Use When
- ✅ Starting a new feature
- ✅ Need a formal specification
- ✅ Converting ideas to concrete specs
- ✅ Planning feature requirements

---

## 🗺️ Plan Agent

**Agent**: `@speckit.plan`  
**Purpose**: Create technical implementation plans

### Common Commands

```
@speckit.plan plan implementation of character search
@speckit.plan create plan for PDF export feature
@speckit.plan technical approach for keyboard shortcuts
@speckit.plan architecture for state management
```

### Use When
- ✅ Need implementation strategy
- ✅ Breaking down complex features
- ✅ Architecture decisions
- ✅ Technical planning

---

## ✅ Tasks Agent

**Agent**: `@speckit.tasks`  
**Purpose**: Break down work into concrete tasks

### Common Commands

```
@speckit.tasks break down character panel work
@speckit.tasks create task list for PDF export
@speckit.tasks tasks for implementing search
@speckit.tasks estimate work for keyboard shortcuts
```

### Use When
- ✅ Need actionable task list
- ✅ Sprint planning
- ✅ Work estimation
- ✅ Breaking down features

---

## 🔧 Implement Agent

**Agent**: `@speckit.implement`  
**Purpose**: Implementation guidance and code generation

### Common Commands

```
@speckit.implement create character search component
@speckit.implement add PDF export functionality
@speckit.implement implement keyboard shortcut system
@speckit.implement build state management for characters
```

### Use When
- ✅ Ready to write code
- ✅ Need implementation examples
- ✅ Following constitution patterns
- ✅ Creating new components

---

## 🔍 Analyze Agent

**Agent**: `@speckit.analyze`  
**Purpose**: Code analysis and improvement suggestions

### Common Commands

```
@speckit.analyze review this component
@speckit.analyze check for performance issues
@speckit.analyze improve this code
@speckit.analyze check TypeScript types
```

### Use When
- ✅ Code review
- ✅ Performance optimization
- ✅ Code quality improvement
- ✅ Finding issues

---

## 📝 Checklist Agent

**Agent**: `@speckit.checklist`  
**Purpose**: Generate checklists for reviews and processes

### Common Commands

```
@speckit.checklist create PR checklist
@speckit.checklist feature completion checklist
@speckit.checklist testing checklist for characters
@speckit.checklist deployment checklist
```

### Use When
- ✅ PR reviews
- ✅ Feature completion
- ✅ Testing requirements
- ✅ Release preparation

---

## ❓ Clarify Agent

**Agent**: `@speckit.clarify`  
**Purpose**: Clarify requirements and resolve ambiguities

### Common Commands

```
@speckit.clarify what does this requirement mean?
@speckit.clarify clarify character search behavior
@speckit.clarify explain this user story
@speckit.clarify define acceptance criteria
```

### Use When
- ✅ Requirements unclear
- ✅ Ambiguous specifications
- ✅ Need more details
- ✅ Defining scope

---

## 🎫 TasksToIssues Agent

**Agent**: `@speckit.taskstoissues`  
**Purpose**: Convert task lists to GitHub issues

### Common Commands

```
@speckit.taskstoissues convert these tasks to issues
@speckit.taskstoissues create GitHub issues from plan
@speckit.taskstoissues generate issues for sprint
```

### Use When
- ✅ Converting tasks to issues
- ✅ Sprint planning in GitHub
- ✅ Issue tracking setup

---

## 💡 Usage Tips

### Chaining Agents
Use handoffs to move between agents:

```
1. @speckit.specify create character search
   → Generates spec
   
2. Agent suggests: "Build Technical Plan"
   → Click handoff to @speckit.plan
   
3. @speckit.plan creates plan
   → Agent suggests: "Break down into tasks"
   → Click handoff to @speckit.tasks
   
4. @speckit.tasks creates task list
   → Agent suggests: "Start implementation"
   → Click handoff to @speckit.implement
```

### Constitution Integration
The constitution agent works with all others:

```
@speckit.implement create character panel
... (generates code) ...

@speckit.constitution review this for compliance
... (checks against constitution) ...
```

### Context Sharing
Agents maintain conversation context:

```
@speckit.specify add search to characters

@speckit.plan
(Automatically has context about character search)

@speckit.tasks  
(Automatically has context about the plan)
```

---

## 🎯 Quick Decision Tree

### "What agent should I use?"

```
Need to...
├─ Check code quality / standards?
│  → @speckit.constitution
│
├─ Start a new feature?
│  → @speckit.specify (then follow handoffs)
│
├─ Understand existing code?
│  → @speckit.analyze
│
├─ Break down work?
│  → @speckit.tasks
│
├─ Write code?
│  → @speckit.implement
│
├─ Create review checklist?
│  → @speckit.checklist
│
├─ Something unclear?
│  → @speckit.clarify
│
└─ Track in GitHub?
   → @speckit.taskstoissues
```

---

## 🚀 Keyboard Shortcuts

In Copilot Chat:
- `@` - Show agent list
- `Tab` - Accept agent autocomplete
- `Enter` - Send message to agent
- `Cmd/Ctrl + K` - Open Copilot Chat
- `Cmd/Ctrl + L` - Clear chat

---

## 📚 Related Files

- **Full Constitution**: `/CONSTITUTION.md`
- **Quick Reference**: `/CONSTITUTION_QUICK_REF.md`
- **Setup Guide**: `/AGENTS_SETUP_COMPLETE.md`
- **Troubleshooting**: `.github/AGENTS_TROUBLESHOOTING.md`

---

**Last Updated**: 2026-01-10  
**For**: SpectreWeave6 Constitution v2.0.0
