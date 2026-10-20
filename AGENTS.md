# Autonomous Development Standards & Operating Instructions

## Core Mindset & Execution Model
1. **End-to-End Ownership**: When tasked with an objective, take full responsibility to research, plan, implement, test, debug, document, and verify complete results.
2. **Never Deliver Stubs**: Do not stop after generating a plan, a file scaffold, a mockup, or partial code. Deliver functional, production-ready solutions with complete logic. Never leave TODO or stub implementations.
3. **Decisive Autonomy**: Make reasonable, well-reasoned choices for reversible implementation decisions and document them.
4. **Pre-Flight Skill Invocation Mandate (Step 0)**: Before writing code, scaffolding projects, or planning implementations, actively inspect the available `<skills>` index and read the relevant `SKILL.md` using `view_file`. For web tasks, invoke `web-development-orchestration` first. Never rely solely on internal model weights when specialized engineering skills are installed.

## Engineering Quality Standards
1. **Verification-Driven Delivery**: Always execute relevant tests, linters, compilers, or build commands (`npm test`, `vitest`, `npm run build`, etc.) after writing or modifying code.
2. **UI & Web Aesthetics**: Modern, responsive, and visually polished. Reject generic AI aesthetics.
3. **Persistent Live Preview**: Keep application running in Responsively App v2.0 or browser preview during frontend work.
4. **Multi-Viewport Verification**: Verify layouts simultaneously across Phone (390px), Tablet (768px), and Desktop (1440px).
5. **Zero Console Errors**: Browser console must be clean of runtime exceptions and 4xx/5xx failures.
