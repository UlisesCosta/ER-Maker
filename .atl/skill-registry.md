# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| improve accessibility, a11y audit, WCAG compliance, screen reader support, keyboard navigation, make accessible | accessibility | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/accessibility/SKILL.md |
| building, testing, deploying JavaScript/TypeScript apps with Bun | bun | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/bun/SKILL.md |
| PRs over 400 lines, stacked PRs, review slices | chained-pr | C:/Users/ulili/.config/opencode/skills/chained-pr/SKILL.md |
| PR feedback, issue replies, reviews, Slack messages, GitHub comments | comment-writer | C:/Users/ulili/.config/opencode/skills/comment-writer/SKILL.md |
| writing guides, READMEs, RFCs, onboarding, architecture, review-facing docs | cognitive-doc-design | C:/Users/ulili/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| boolean prop proliferation, compound components, render props, context providers, component architecture | vercel-composition-patterns | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/composition-patterns/SKILL.md |
| build web components, pages, polished UI, beautify frontend | frontend-design | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/frontend-design/SKILL.md |
| Go tests, go test coverage, Bubbletea teatest, golden files | go-testing | C:/Users/ulili/.config/opencode/skills/go-testing/SKILL.md |
| creating GitHub issues, bug reports, feature requests | issue-creation | C:/Users/ulili/.config/opencode/skills/issue-creation/SKILL.md |
| judgment day, dual review, adversarial review, juzgar | judgment-day | C:/Users/ulili/.config/opencode/skills/judgment-day/SKILL.md |
| React components, Next.js pages, data fetching, bundle optimization, performance improvements | vercel-react-best-practices | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/react-best-practices/SKILL.md |
| improve SEO, optimize for search, fix meta tags, add structured data, sitemap optimization | seo | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/seo/SKILL.md |
| new skills, agent instructions, documenting AI usage patterns | skill-creator | C:/Users/ulili/.config/opencode/skills/skill-creator/SKILL.md |
| styling React/Vue/Svelte components, responsive layouts, design systems, Tailwind workflow | tailwind-css-patterns | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/tailwind-css-patterns/SKILL.md |
| complex type logic, reusable type utilities, compile-time type safety | typescript-advanced-types | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/typescript-advanced-types/SKILL.md |
| Vite projects, vite.config.ts, Vite plugins, SSR apps, Rolldown migration | vite | C:/Users/ulili/workspace/tools/ER-Maker/.agents/skills/vite/SKILL.md |
| implementation, commit splitting, chained PRs, keep tests and docs with code | work-unit-commits | C:/Users/ulili/.config/opencode/skills/work-unit-commits/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### accessibility
- Always provide accessible names for controls, especially icon-only buttons.
- Keep keyboard navigation complete, no keyboard traps, and visible `:focus-visible` states.
- Meet WCAG AA contrast, and do not rely on color alone for status.
- Use semantic HTML first, then ARIA only to fill gaps.
- Account for sticky UI so focused elements are not obscured.

### bun
- Prefer `bun run <script>` for package scripts and `bun test` for tests.
- Treat Bun as runtime/package manager/test runner, not as the type checker.
- Keep `bun.lock` committed and do not ignore it.
- Use Bun's built-in coverage flags when coverage is needed.
- Watch for Bun gotchas: lifecycle scripts off by default, flags go before `run`, and bundling does not type-check.

### chained-pr
- Split PRs over 400 changed lines unless maintainers explicitly allow an exception.
- Keep each PR to one reviewable work unit with tests/docs in the same slice.
- State boundaries, dependencies, follow-ups, and out-of-scope items in every chained PR.
- Fix polluted diffs by retargeting or rebasing, never by hand-waving.
- Choose one chaining strategy and keep it consistent through the stack.

### comment-writer
- Start with the actionable point, not a long recap.
- Keep comments short, warm, direct, and technically justified.
- Match the thread language, including Rioplatense Spanish when needed.
- Avoid pile-on nitpicks, focus on the highest-value issue.
- Do not use em dashes.

### cognitive-doc-design
- Lead with the answer, outcome, or decision first.
- Use progressive disclosure: quick path first, details later.
- Chunk information into short sections, tables, and checklists.
- Make review order and scope explicit in review-facing docs.
- Optimize for recognition, not recall.

### vercel-composition-patterns
- Avoid boolean-prop explosion, make explicit variants instead.
- Prefer compound components plus shared context over monoliths.
- Keep UI decoupled from state implementation via provider interfaces.
- Compose with children instead of render props unless data must flow down.
- In React 19, prefer `use()` for context and avoid `forwardRef`.

### frontend-design
- Choose an intentional aesthetic direction before coding UI.
- Avoid generic AI-looking visuals, default fonts, and predictable layouts.
- Match visual ambition with implementation quality and polish.
- Use typography, color, motion, and composition deliberately.
- Build production-grade interfaces, not mock-looking fragments.

### go-testing
- Prefer table-driven tests and scenario-based case names.
- Test behavior and state transitions, not implementation trivia.
- Use `t.TempDir()` for filesystem tests and skip slow integration work in short mode.
- Keep golden files deterministic and update through explicit update flows only.
- Assert outputs, errors, state, and side effects explicitly.

### issue-creation
- Always use the repo issue templates, never blank issues.
- Search for duplicates before creating a new issue.
- Remember PRs require an approved issue first.
- Questions belong in discussions, not issues.
- Fill all required fields and let maintainers apply approval labels.

### judgment-day
- Use two blind judges in parallel, never self-review as the sole judge.
- Do not synthesize until both judgments arrive.
- Ask before fixing confirmed Round 1 issues.
- Re-judge after fixes before closing the review loop.
- Terminal states are only APPROVED or ESCALATED.

### vercel-react-best-practices
- Eliminate async waterfalls, start independent work early, and await late.
- Keep bundles lean, avoid barrel imports, and lazy-load heavy modules.
- Avoid shared mutable server state and minimize client-boundary serialization.
- Prevent unnecessary re-renders with derived state, stable callbacks, and extracted components.
- Prefer browser and React primitives that improve responsiveness, hydration, and loading behavior.

### seo
- Make pages crawlable with correct robots, canonicals, and sitemap rules.
- Use unique titles, meta descriptions, and a proper heading hierarchy.
- Keep URLs clean, lowercase, and human-readable.
- Optimize images with descriptive filenames, alt text, and sizing.
- Treat technical SEO as mandatory baseline, not optional polish.

### skill-creator
- Follow the repo skill style guide when present, otherwise use the inline fallback contract.
- Treat skills as runtime instruction contracts for LLMs, not human tutorials.
- Keep frontmatter valid, description trigger-first, and body concise.
- Move long examples and edge cases into local `assets/` or `references/`.
- Register project skills in `AGENTS.md` when required.

### tailwind-css-patterns
- Start mobile-first and layer responsive variants upward.
- Prefer design tokens and utility composition over ad hoc values.
- Keep repeated patterns in reusable components, not giant class blobs everywhere.
- Preserve accessibility with focus styles, semantics, and motion preferences.
- Verify behavior across breakpoints before considering styling done.

### typescript-advanced-types
- Use generics to keep APIs reusable without sacrificing type safety.
- Reach for conditional and mapped types when type relationships must stay consistent.
- Prefer expressive utility types over duplicated hand-written shapes.
- Use template literal types for patterned string APIs.
- Keep type complexity justified by real safety or ergonomics gains.

### vite
- Prefer `vite.config.ts` and ESM-only configuration.
- Use `defineConfig` and keep build/SSR concerns explicit.
- Reach for Vite features like `import.meta.env` and `import.meta.glob` when they simplify architecture.
- Treat plugin order and SSR behavior as deliberate, not incidental.
- Consider Rolldown/Vite 8 migration implications when touching build config.

### work-unit-commits
- Commit by deliverable work unit, never by file type.
- Keep tests and docs in the same commit as the behavior they validate.
- Make each commit understandable and reviewable on its own.
- Plan for chained PR promotion when a change approaches the review budget.
- Keep rollback boundaries clean and focused.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-root convention index files detected (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`). |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
