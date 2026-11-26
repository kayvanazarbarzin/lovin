---
applyTo: "apps/web/**,packages/ui/**,packages/i18n/**"
---
# Frontend rules

- Next.js 15 App Router, React 19, TypeScript strict, Tailwind 4, Radix primitives, dnd-kit for kanban.
- Server Components by default; `"use client"` only for interaction. Data fetching on the server via the BFF client (`apps/web/src/lib/api.ts`), never directly to engines.
- The browser never holds access tokens; session is an httpOnly cookie managed by the BFF.
- Every user-facing string comes from `packages/i18n` (`t('crm.lead.title')`). Persian is default; English is fallback.
- RTL-first: use logical properties only (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`). Never `left/right` in new code.
- Mixed Persian/English/numbers: wrap foreign runs with `<bdi>`; format numbers/dates via `packages/i18n` (`formatJalali`, `formatNumber`).
- Dates: inputs and displays are Jalali via the shared `JalaliDatePicker`; send ISO-8601 UTC to the API.
- Permissions in UI are hints only (`/me.permissions`); still handle 403/404 from the server gracefully.
- Kanban: optimistic move → `POST /tasks/{id}/transition` → on 409/412 roll back to server state and show the reason.
- Accessibility: keyboard reachable, visible focus, labels on inputs, axe check in Playwright for each new page.
- Font: Vazirmatn (self-hosted, OFL). No external CDNs at runtime.
- Components: one component per file, ≤ 200 lines; colocate `*.test.tsx`.
