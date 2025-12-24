# Development Workflow

This document describes the spec-driven development workflow used in this project.

## Philosophy

We follow a **deliberate, specification-first approach** inspired by [github/spec-kit](https://github.com/github/spec-kit). The goal is to think deeply before coding, document decisions, and create a clear implementation path.

## The Three-Phase Workflow

### Phase 1: Research (Personal)

**Location:** `notes/` (gitignored)

**Purpose:** Explore, brainstorm, and gather information without commitment.

**Activities:**
- Research existing solutions and patterns
- Compare APIs and approaches
- Document findings and insights
- Sketch architecture ideas
- Identify risks and unknowns

**Example Files:**
- `notes/api-patterns-research.md` - Comparing other SDK approaches
- `notes/architecture-analysis.md` - Technical deep-dive

**Why Gitignored?**
- Encourages free thinking without worrying about polish
- Keeps repository focused on committed decisions
- Personal workspace for iteration

---

### Phase 2: Planning (Formal)

**Location:** `specs/phase-X-name/` (committed to git)

**Purpose:** Formalize decisions and create implementation roadmap.

**Required Files:**

#### `spec.md` - The Specification
- **Overview:** What are we building and why?
- **Goals:** Primary goals and success criteria
- **Architecture:** High-level design and components
- **Scope:** Explicitly state what's in and out of scope
- **User Stories:** Concrete examples of how it will be used
- **Non-Functional Requirements:** Performance, reliability, etc.
- **Risks:** Known challenges and mitigation strategies

#### `plan.md` - The Implementation Plan
- **Strategy:** Bottom-up, top-down, or hybrid approach
- **Phases:** Ordered implementation steps
- **Detailed Implementation:** Code examples for each component
- **Dependencies:** What depends on what
- **Timeline Estimates:** Rough time estimates per task
- **Validation:** How to verify success

#### `tasks.md` - The Task Breakdown
- Break plan into discrete, actionable tasks
- Each task = one GitHub issue
- Include:
  - Priority (P0, P1, P2)
  - Time estimate
  - Files to create/modify
  - Acceptance criteria (checkboxes)
  - Dependencies
  - Labels

#### `contracts/` - Type Definitions
- TypeScript interfaces for public APIs
- Documents the contracts we commit to
- Reference for implementation

**Example:**
```
specs/phase-0-foundation/
├── spec.md          # What: Core runtime with explainability
├── plan.md          # How: Step-by-step implementation guide
├── tasks.md         # Tasks: 14 GitHub issues
└── contracts/
    └── types.ts     # API contracts
```

---

### Phase 3: Implementation

**Purpose:** Execute the plan systematically.

**Process:**

1. **Create GitHub Issues**
   - Convert each task from `tasks.md` to an issue
   - Apply labels and milestone
   - Use acceptance criteria as issue checklist

2. **Follow the Plan**
   - Implement in the order specified in `plan.md`
   - Refer to code examples in plan
   - Update issue status as you progress

3. **Test As You Go**
   - Write unit tests alongside implementation
   - Aim for >80% coverage
   - Test both happy path and edge cases

4. **Document Changes**
   - Update README with new features
   - Add code comments for complex logic
   - Update spec if deviations occur

5. **Validate Completion**
   - All acceptance criteria met
   - Tests passing
   - Linter clean
   - PR reviewed and merged

---

## Key Principles

### 1. Leverage Existing Tools
Before building, check if it already exists:
- **sdk-kit core:** Event system, config, plugin framework
- **sdk-kit plugins:** Storage, transport, context, etc.

**Only build what's truly missing.**

### 2. Design for Contribution
If you build something generic:
- Make it reusable (not tightly coupled)
- Document well
- Consider contributing back to sdk-kit

### 3. Explainability-First
Every decision must explain itself:
```typescript
{
  show: true,
  reasons: ["✅ URL matches", "✅ Frequency cap not reached"],
  trace: [/* machine-readable steps */]
}
```

### 4. Type Safety
- Use TypeScript strict mode
- Export all public types
- No `any` in public APIs

---

## Example Workflow

### Starting a New Feature

1. **Research** (in `notes/`)
   ```bash
   # Create personal notes
   echo "# Feature X Research" > notes/feature-x.md
   # Document findings, not tracked in git
   ```

2. **Plan** (in `specs/`)
   ```bash
   # Create spec directory
   mkdir -p specs/phase-1-feature-x
   
   # Write formal specification
   vim specs/phase-1-feature-x/spec.md
   vim specs/phase-1-feature-x/plan.md
   vim specs/phase-1-feature-x/tasks.md
   
   # Commit specs
   git add specs/
   git commit -m "docs: add phase 1 specification"
   ```

3. **Create Issues**
   ```bash
   # Convert tasks to GitHub issues
   gh issue create --title "[Phase 1] Task 1.1: ..." \
     --body-file specs/phase-1-feature-x/tasks.md \
     --label "type:core" \
     --label "priority:critical" \
     --milestone "Phase 1"
   ```

4. **Implement**
   ```bash
   # Follow plan.md order
   # Write tests
   # Update documentation
   
   git commit -m "feat: implement feature X"
   ```

5. **Validate**
   ```bash
   pnpm build
   pnpm test
   pnpm lint
   
   # Update spec with completion status
   # Close GitHub issue
   ```

---

## When to Update Specs

Specs should be updated when:
- **Before starting:** To clarify approach
- **During implementation:** If significant deviations occur
- **After completion:** To reflect actual outcomes

Specs are **living documents**, not set-in-stone contracts.

---

## Benefits of This Approach

✅ **Clarity:** Everyone understands what we're building  
✅ **Efficiency:** Less rework from unclear requirements  
✅ **Documentation:** Specs serve as permanent documentation  
✅ **Onboarding:** New contributors can read specs to understand system  
✅ **Quality:** Deliberate design leads to better architecture  
✅ **Confidence:** Clear acceptance criteria = clear done state

---

## Tools & Commands

```bash
# List terminals
ls terminals/

# Check spec status
cat specs/phase-0-foundation/spec.md

# Create GitHub issue from task
gh issue create --title "..." --body "..." --label "..." --milestone "..."

# View project board
gh project view

# Run full validation
pnpm build && pnpm test && pnpm lint
```

---

## Questions?

- **"Should I write a spec for a small bug fix?"**  
  No. Specs are for features/phases, not individual bugs.

- **"What if the plan changes during implementation?"**  
  Update the spec! Document why the change was needed.

- **"How detailed should plan.md be?"**  
  Detailed enough that someone could implement without asking questions.

- **"Can I skip research phase?"**  
  For simple features, yes. For complex/novel work, no.

---

## Reference

- **Inspiration:** https://github.com/github/spec-kit
- **Our specs:** `specs/`
- **SDK Kit docs:** https://github.com/Lytics/sdk-kit

