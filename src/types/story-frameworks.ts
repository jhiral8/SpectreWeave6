export interface WritingFramework {
  id: string
  name: string
  description: string
  template: string
  category: 'structure' | 'planning' | 'classical'
}

export const WRITING_FRAMEWORKS: WritingFramework[] = [
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    description: 'Classic setup, confrontation, resolution structure',
    category: 'structure',
    template: `# 🎭 Three-Act Structure

> **Classic storytelling framework: Setup → Confrontation → Resolution**

---

## 📖 Act 1: Setup (20-25% of story)

### 🪝 Opening Hook
**Your story begins here:**
• Start with a compelling scene or moment that grabs attention
• Show your protagonist in action or facing an interesting situation
• **Write your opening hook:**
  *[Describe the first scene that will captivate your reader]*

### 🌍 World Building
**Establish your story's foundation:**
• Show the setting, rules, and "normal world"
• Reveal how things usually work before the story disrupts them
• **Your world details:**
  *[What does your protagonist's ordinary world look like?]*

### 👤 Character Introduction
**Present your main players:**
• Introduce protagonist with clear goals, flaws, and personality
• Show supporting characters and their relationships
• **Character notes:**
  - Protagonist: *[Name, main goal, key flaw]*
  - Key supporters: *[Who helps or hinders them?]*

### ⚡ Inciting Incident
**The moment everything changes:**
• Event that disrupts the status quo
• Forces protagonist into the main conflict
• **Your inciting incident:**
  *[What event launches your story into motion?]*

---

## ⚔️ Act 2: Confrontation (50-60% of story)

### 📈 Rising Action
**Building tension and obstacles:**
• Series of increasingly difficult challenges
• Each obstacle teaches or reveals something important
• **Major obstacles to plan:**
  1. *[First major challenge]*
  2. *[Second complication]*  
  3. *[Third escalation]*

### 🎯 Midpoint Climax
**The story's turning point:**
• Major shift, revelation, or false victory/defeat
• Characters can't go back to the old way
• **Your midpoint moment:**
  *[What major event changes everything at the story's center?]*

### 💪 Character Development
**Internal growth through external pressure:**
• Deepen relationships and reveal true natures
• Force characters to confront their flaws
• **Character growth arcs:**
  *[How do your characters change through adversity?]*

### 🌑 Dark Moment
**The lowest point:**
• All seems lost, betrayal, or major failure
• Tests character's resolve and growth
• **Your dark moment:**
  *[What's the worst thing that could happen to your protagonist?]*

---

## 🏆 Act 3: Resolution (15-25% of story)

### 💥 Climax
**The final showdown:**
• Ultimate test of everything learned
• All storylines converge
• **Your climax:**
  *[How does your protagonist face their final challenge?]*

### 📉 Falling Action
**Immediate aftermath:**
• Show consequences of the climax
• Resolve remaining plot threads
• **Loose ends to tie:**
  *[What questions still need answering?]*

### 🎭 Denouement
**The new beginning:**
• Emotional closure and character reflection
• Show how the world/character has changed
• **Your ending:**
  *[What's the new normal after your story concludes?]*

---

## ✅ Story Planning Checklist
- [ ] Hook that immediately engages readers
- [ ] Clear protagonist goal and obstacle
- [ ] Escalating conflicts in Act 2
- [ ] Satisfying character growth arc
- [ ] Meaningful resolution that feels earned`
  },
  {
    id: 'hero-journey',
    name: "Hero's Journey",
    description: '12-stage transformation cycle for epic stories',
    category: 'structure',
    template: `# 🛡️ The Hero's Journey

> **Joseph Campbell's 12-stage transformation cycle for epic stories**

---

## 🏠 Stage 1: Ordinary World
**Where the hero starts:**
• Show hero's everyday life, flaws, and limitations
• Establish what they have to lose
• **Your ordinary world:**
  *[What does your hero's normal life look like?]*

## 📢 Stage 2: Call to Adventure
**The invitation to change:**
• Event that challenges hero to leave their comfort zone
• Crisis, opportunity, or message that disrupts normalcy
• **Your call:**
  *[What event calls your hero to adventure?]*

## 🚫 Stage 3: Refusal of the Call
**Natural resistance:**
• Hero hesitates due to fear, duty, or doubt
• Shows human vulnerability and stakes
• **Why they refuse:**
  *[What holds your hero back initially?]*

## 🧙 Stage 4: Meeting the Mentor
**Guidance appears:**
• Wise figure provides advice, tools, or training
• May be person, memory, or inner voice
• **Your mentor:**
  *[Who guides your hero? What do they provide?]*

## 🚪 Stage 5: Crossing the Threshold
**Point of no return:**
• Hero commits to the adventure
• Enter the special/dangerous world
• **The crossing:**
  *[What moment commits your hero to the journey?]*

## ⚔️ Stage 6: Tests, Allies, and Enemies
**Learning the new world:**
• Face trials and smaller challenges
• Build alliances, identify true enemies
• **Key relationships:**
  - Allies: *[Who helps your hero?]*
  - Enemies: *[Who opposes them?]*
  - Tests: *[What challenges do they face?]*

## 🏰 Stage 7: Approach to the Inmost Cave
**Preparing for the big test:**
• Hero prepares for the central ordeal
• Introspection, planning, and final preparations
• **The preparation:**
  *[How does your hero prepare for their greatest challenge?]*

## ☠️ Stage 8: Ordeal
**The supreme test:**
• Biggest fear faced, "death" moment
• Hero must use everything learned
• **The ordeal:**
  *[What is your hero's darkest moment or greatest fear?]*

## 🏆 Stage 9: Reward (Seizing the Sword)
**Victory's prize:**
• Hero survives and gains prize, insight, or power
• May be object, knowledge, or reconciliation
• **The reward:**
  *[What does your hero gain from surviving the ordeal?]*

## 🛤️ Stage 10: The Road Back
**The journey home begins:**
• Hero begins return to ordinary world
• May be pursued by remaining forces
• **Complications of return:**
  *[What challenges arise on the way back?]*

## 🔥 Stage 11: Resurrection
**Final transformation:**
• Last test that proves hero's complete change
• Ultimate battle using all growth
• **The final test:**
  *[How does your hero prove they've truly changed?]*

## 🎁 Stage 12: Return with the Elixir
**Bringing wisdom home:**
• Hero returns to benefit ordinary world
• Shares wisdom, heals community, or starts new cycle
• **The gift:**
  *[How does your hero's journey benefit their world?]*

---

## 🗺️ Journey Planning Guide
**Map your hero's transformation:**
- **Inner journey:** *[What does your hero need to learn/overcome?]*
- **Outer journey:** *[What external quest must they complete?]*
- **Central theme:** *[What truth does this journey reveal?]*

## ✅ Hero's Journey Checklist
- [ ] Clear ordinary world with established stakes
- [ ] Compelling call that forces growth
- [ ] Mentor who provides necessary guidance
- [ ] Escalating tests that build skills
- [ ] Ordeal that transforms the hero
- [ ] Return that benefits the community`
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat Beat Sheet',
    description: '15-beat commercial structure for genre fiction',
    category: 'structure',
    template: `# Save the Cat Beat Sheet (15 Beats)

## Act 1: Setup
### 1. Opening Image (1%)
- Visual snapshot of the world
- Sets tone and genre

### 2. Theme Stated (5%)
- Hint at story's core message
- Usually through supporting character

### 3. Set-Up (1-10%)
- Introduce characters and stakes
- Show protagonist's world

### 4. Catalyst (12%)
- The inciting incident
- Life-changing event

### 5. Debate (12-25%)
- Protagonist hesitates or reacts
- Internal conflict shown

### 6. Break into Act 2 (25%)
- Commit to the journey
- Point of no return

## Act 2: Confrontation
### 7. B Story (30%)
- Develop subplots
- Romance or mentorship

### 8. Fun and Games (30-50%)
- Core action and "trailer moments"
- Promise of the premise

### 9. Midpoint (50%)
- Major shift or false victory
- Stakes raised

### 10. Bad Guys Close In (50-75%)
- Increasing obstacles
- External and internal pressure

### 11. All Is Lost (75%)
- Rock bottom moment
- Dark night of the soul

### 12. Dark Night of the Soul (75-85%)
- Reflection and despair
- Realization needed

## Act 3: Resolution
### 13. Break into Act 3 (85%)
- New plan or insight
- Final push begins

### 14. Finale (85-99%)
- Climax and confrontations
- All storylines resolved

### 15. Final Image (99-100%)
- Mirror opening image
- Show transformation`
  },
  {
    id: 'seven-point',
    name: 'Seven-Point Story Structure',
    description: 'Symmetrical structure emphasizing character growth',
    category: 'structure',
    template: `# Seven-Point Story Structure

## Point 1: Hook (10%)
- Protagonist's initial state
- Compelling setup to grab attention
- Show character's starting point

## Point 2: Plot Turn 1 (20-25%)
- Inciting incident
- Conflict that changes everything
- Forces character into action

## Point 3: Pinch 1 (37%)
- Apply external pressure
- Force character to act
- Introduce antagonist force

## Point 4: Midpoint (50%)
- Character moves from reactive to proactive
- Major revelation or shift
- Turning point of story

## Point 5: Pinch 2 (62%)
- Stakes escalate dramatically
- Often involves loss or betrayal
- Moment of desperation

## Point 6: Plot Turn 2 (75-80%)
- Character gains what they need
- Setup for final confrontation
- All pieces come together

## Point 7: Resolution (90-100%)
- Wrap up with consequences
- Show character growth
- Mirror and contrast with opening

---

## Character Arc Tracking
### Starting State:
- [Character's initial situation]

### Growth Moments:
- [Key transformation points]

### Ending State:
- [Character's final situation]

### Theme:
- [Central message or lesson]`
  },
  {
    id: 'snowflake',
    name: 'Snowflake Method',
    description: 'Iterative 10-step planning method',
    category: 'planning',
    template: `# ❄️ Snowflake Method

> **Randy Ingermanson's iterative 10-step planning method**  
> *Build your story from simple to complex, like a snowflake crystal*

---

## 🎯 Step 1: One-Sentence Summary
**Distill your story to its essence (15 words or less):**

*Write your one-sentence story hook here:*
**[Your compelling story premise in one sentence]**

---

## 📝 Step 2: One-Paragraph Summary  
**Expand your sentence into a full paragraph (4-5 sentences):**

Structure: Setup → Disaster → Disaster → Disaster → Ending

**Your paragraph:**
*[Sentence 1: Setup and protagonist]*
*[Sentence 2: First major disaster/conflict]*  
*[Sentence 3: Second disaster/escalation]*
*[Sentence 4: Third disaster/climax]*
*[Sentence 5: How it ends]*

---

## 👥 Step 3: Character Summaries
**Create one-page summaries for main characters:**

### 🎭 Main Character:
- **Name:** *[Character name]*
- **Motivation:** *[What drives them?]*  
- **Goal:** *[What do they want?]*
- **Conflict:** *[What prevents them?]*
- **Epiphany:** *[What do they learn?]*
- **Story arc:** *[How do they change?]*

### 👤 Supporting Characters:
*[Repeat the above for each major character]*

---

## 📄 Step 4: One-Page Synopsis
**Expand your paragraph into a full page:**

Take each sentence from Step 2 and develop it into a paragraph. Focus on:
• Major plot points and turning moments
• Character motivations and conflicts  
• Cause-and-effect relationships

**Your expanded synopsis:**
*[Write your one-page story summary here]*

---

## 📊 Step 5: Character Charts
**Deepen each character (one page each):**

For each major character, expand their summary to include:
• **Backstory:** *[Their history and formative experiences]*
• **Motivation:** *[Deep psychological drivers]*
• **Goal:** *[Specific story objective]*  
• **Conflict:** *[Internal and external obstacles]*
• **Epiphany:** *[Moment of realization/change]*
• **Paragraph summary:** *[Their role in the story]*

---

## 📚 Step 6: Four-Page Synopsis  
**Expand your one-page synopsis:**

Develop your story into four pages, including:
• Detailed scene progression
• Character arc development
• Subplot integration
• Clear cause-and-effect chains

**Focus areas:**
- [ ] Plot progression with specific scenes
- [ ] Character development arcs
- [ ] Subplot weaving
- [ ] Emotional beats and pacing

---

## 👤 Step 7: Character Bible
**Create detailed character profiles:**

Expand each character chart into full descriptions:
• **Physical appearance:** *[How they look, move, dress]*
• **Personality traits:** *[Core characteristics and quirks]*  
• **Speech patterns:** *[How they talk, vocabulary, accent]*
• **Full backstory:** *[Complete personal history]*
• **Relationships:** *[Connections to other characters]*

---

## 🎬 Step 8: Scene List
**Break your story into individual scenes:**

For each scene, document:
• **Scene purpose:** *[Why this scene exists]*
• **POV character:** *[Whose perspective]*
• **Goal/Conflict:** *[What character wants vs. obstacle]*
• **Outcome:** *[How scene ends, what changes]*
• **Characters present:** *[Who's in the scene]*

**Scene tracking template:**
| Scene # | Purpose | POV | Goal | Conflict | Outcome |
|---------|---------|-----|------|----------|---------|
| 1 | | | | | |

---

## 📖 Step 9: Scene Details
**Write detailed descriptions for each scene:**

For each scene from Step 8, write several paragraphs covering:
• Character goals and motivations entering scene
• Specific conflicts and obstacles faced  
• Emotional beats and character reactions
• Scene outcome and story advancement

**Scene development notes:**
*[Use this space to detail key scenes]*

---

## ✍️ Step 10: First Draft
**Write your story using your detailed outline:**

**Writing guidelines:**
• Use scene details as your roadmap
• Allow for creative discovery within structure
• Maintain focus on character goals and conflicts
• Trust your preparation to guide the story

**Draft progress tracking:**
- [ ] Act 1 complete
- [ ] Act 2A complete  
- [ ] Midpoint reached
- [ ] Act 2B complete
- [ ] Act 3 complete
- [ ] First draft finished!

---

## 🔄 Snowflake Benefits
• **Iterative:** Build complexity gradually
• **Character-focused:** Deep character development
• **Structured:** Clear roadmap prevents writer's block
• **Flexible:** Allows creative discovery within framework

## 📋 Quick Progress Checklist
- [ ] One-sentence summary complete
- [ ] Paragraph summary expanded  
- [ ] Main characters developed
- [ ] Scene list created
- [ ] Ready to write first draft`
  },
  {
    id: 'freytag',
    name: "Freytag's Pyramid",
    description: 'Classical dramatic arc with rising and falling action',
    category: 'classical',
    template: `# Freytag's Pyramid

## Exposition (15-20%)
### Introduction Phase
- Introduce world, characters, and initial situation
- Establish normal state of affairs
- Set up background information

### Key Elements:
- Character introductions
- Setting establishment
- Initial conflict hints
- Inciting incident (end of exposition)

---

## Rising Action (40-50%)
### Complication Phase
- Series of complications and crises
- Building tension and conflict
- Character development through trials

### Development Points:
- First major obstacle:
- Second complication:
- Third challenge:
- Character growth moments:
- Relationships evolving:

---

## Climax (10%)
### Turning Point
- Highest point of dramatic tension
- Point of no return
- Often irreversible decision or event

### Climactic Moment:
- [Describe the peak dramatic moment]
- [What makes this the turning point?]
- [How does this change everything?]

---

## Falling Action (15-20%)
### Consequence Phase
- Results of the climax unfold
- Loose ends being tied
- Movement toward resolution

### Aftermath Elements:
- Immediate consequences:
- Character reactions:
- World changes:
- Relationship impacts:

---

## Denouement/Resolution (10%)
### Final Outcome
- Story conclusion
- Character fates revealed
- New equilibrium established

### Resolution Elements:
- How conflicts are resolved:
- Character final states:
- Lessons learned:
- Future implications:

---

## Dramatic Tension Map
**Track tension throughout:**
- Exposition: Low → Building
- Rising Action: Escalating
- Climax: Peak
- Falling Action: Decreasing
- Resolution: Calm/Resolved`
  }
]