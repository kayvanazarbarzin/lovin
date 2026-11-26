# Backlog — Epic / Feature / Task با معیار پذیرش

> مرجع: PRD §4–§22 | نسخه 0.1 | 2026-11-26
> قرارداد شناسه: `E<epic>` → `E<epic>.F<feature>` → `E<epic>.F<feature>.T<task>`
> هر Feature «Done» است فقط وقتی: UI→API→authz→persistence→event→(BPM)→monitoring→تست قابل اجرا + evidence در `docs/acceptance-evidence/` (PRD §22 دستور نهایی).
> تخمین: S ≤ 2 روز، M ≤ 5 روز، L ≤ 10 روز (یک توسعه‌دهنده/ایجنت + بازبین).

## نمای کلی و مسیر بحرانی

| Epic | عنوان | فاز | اولویت | وابستگی | تخمین کل |
|---|---|---|---|---|---|
| E00 | Discovery، Compliance، Ruflo Harness | F0 | P0 | — | ~2 هفته |
| E01 | Monorepo، CI/CD، زیرساخت Compose | F1 | P0 | E00 | ~2 هفته |
| E02 | هویت (Keycloak/AD/Local) | F1 | P0 | E01 | ~2 هفته |
| E03 | Authorization (RBAC+Scope) و Audit | F1 | P0 | E02 | ~3 هفته |
| E04 | Config Control Plane و Secrets | F1 | P0 | E03 | ~2 هفته |
| E05 | Design System فارسی/RTL و Shell | F1 | P0 | E01 | ~2 هفته |
| E06 | Event Backbone (Outbox/Inbox/NATS) | F1 | P0 | E01 | ~1.5 هفته |
| E07 | CRM (Corteza adapter) | F2 | P0 | E03, E06, ADR-001 | ~5 هفته |
| E08 | BPM (Flowable) و Kanban | F2 | P0 | E03, E06 | ~5 هفته |
| E09 | Support/Case و SLA | F2 | P0 | E07, E08 | ~2 هفته |
| E10 | Channel Gateway و Unified Inbox | F3 | P0 | E06, E07 | ~5 هفته |
| E11 | CTI Gateway (چند Asterisk) | F3 | P0 | E06, E07, E09 | ~4 هفته |
| E12 | Content Studio و Brand (Payload) | F4 | P0 | E03, E08 | ~5 هفته |
| E13 | Marketing و Campaign | F4 | P0 | E07, E12 | ~4 هفته |
| E14 | AI Gateway و RAG | F4 | P0 | E03, E06 | ~4 هفته |
| E15 | EVAL Service | F5 | P0 | E14 | ~3 هفته |
| E16 | Analytics و داشبورد | F4–F5 | P0 | E07, E13 | ~3 هفته |
| E17 | Meetings (Jitsi) | F2–F4 | P0 پایه / P1 عمیق | E07 | ~1 هفته |
| E18 | Hardening، Backup/Restore، Load، Release | F5 | P0 | همه | ~3 هفته |
| E19 | Expansion (P1/P2) | F6 | P1/P2 | E18 | جدا |

مسیر بحرانی: `E00 → E01 → E02 → E03 → E06 → (E07 ∥ E08) → E09 → E11/E10 → E14 → E15 → E18`
با موازی‌سازی (۳–۴ جریان کاری) برآورد خام تا P0 کامل: **۶ تا ۸ ماه**؛ PoC عمودی (PRD §0.4) در **پایان ماه دوم**.

---

## E00 — Discovery، Compliance، Ruflo Harness (Sprint 0)

### E00.F1 — ممیزی و تصمیم مجوز
- **T1** ✅ `repo-audit.md` (انجام شد)
- **T2** ✅ `LICENSE-DECISION.md` (پیش‌نویس؛ منتظر مالک)
- **T3** spec رفتاری clean-room از سه مخزن (`docs/specs/reference-behaviors.md`) + fixture مصنوعی
- **AC:** LIC-GATE-001 با یکی از دو حالت «اجازه مکتوب» یا «clean-room» بسته شود؛ هیچ فایل کپی‌شده در repo نباشد (jscpd < 1٪ شباهت با مخازن مرجع).

### E00.F2 — Ruflo Harness
- **T1** Sync فورک با upstream؛ tag `lavin-pin-2026-11` روی SHA تأییدشده
- **T2** قفل `ruflo@3.80.8` در `package.json` devDependency + lockfile integrity
- **T3** `npx ruflo init` در شاخه dev؛ diff بازبینی؛ نصب فقط skill `ruflo` از SHA قفل‌شده
- **T4** `npx ruflo doctor` (بدون `--fix` تا بازبینی)، `discover-plugins`، `mcp list` → گزارش در `docs/dev/ruflo-setup.md`
- **T5** `AGENTS.md` ریشه: ارجاع PRD، قوانین clean-room، قالب PR (§20.4)، نقش‌های ایجنت (§20.3)، ممنوعیت secrets
- **T6** قالب PR + چک CI که فیلدهای اجباری (`requirement_ids`, `security_scan`, …) را بررسی کند
- **AC:** ایجنت می‌تواند یک تسک نمونه را با trace Ruflo، reviewer مستقل و تست انجام دهد؛ `npm audit` بدون High/Critical در ابزار dev؛ ابزار Ruflo در image تولیدی نیست.

### E00.F3 — PoCهای ریسک
- **T1** PoC Corteza: namespace `lavin_crm`، API CRUD، فیلد سفارشی، webhook → معیارهای ADR-001
- **T2** PoC Flowable 7 + bpmn-js: deploy XML، user task، timer، event listener → outbox
- **T3** PoC Bale bot: webhook + ارسال + capability test واقعی
- **T4** PoC Asterisk 20 در Docker + AMI event stream + SIPp
- **T5** benchmark مدل محلی فارسی روی سخت‌افزار هدف (۳ مدل × ۵۰ سؤال)
- **AC:** هر PoC گزارش evidence + تصمیم (go/no-go) دارد؛ ADRها از «Proposed» به «Accepted» می‌روند.

### E00.F4 — Threat Model و UX
- **T1** Threat model STRIDE برای ingress عمومی (webhook)، CTI، AI tools، admin panel
- **T2** Wireframe صفحات P0 (ورود، داشبورد، Lead/Contact 360، برد، Inbox، Case، Content editor، Admin)
- **AC:** هر تهدید High یک کنترل و تست مرتبط در backlog دارد.

---

## E01 — Monorepo، CI/CD، زیرساخت

### E01.F1 — Monorepo
- **T1** pnpm + Turborepo با ساختار PRD §20.5 (`apps/web`, `apps/api`, `apps/worker`, `services/*`, `packages/*`)
- **T2** dependency-cruiser برای مرز ماژول‌ها (ماژول A نمی‌تواند internals ماژول B را import کند)
- **T3** TypeScript strict، ESLint، Prettier، Vitest، Playwright
- **AC:** `pnpm build && pnpm test` سبز؛ نقض مرز ماژول CI را قرمز می‌کند.

### E01.F2 — CI/CD (GitHub Actions)
- **T1** lint/type/unit/integration (Testcontainers)
- **T2** امنیت: Semgrep/CodeQL، Gitleaks، Trivy (image)، `npm audit`
- **T3** SBOM (CycloneDX) + license gate (allowlist §LICENSE-DECISION) — **AT-20**
- **T4** build image با digest، امضا (cosign) اختیاری
- **AC:** dependency با مجوز ناشناخته release را متوقف و SBOM تولید می‌کند (AT-20).

### E01.F3 — Docker Compose
- **T1** `infra/compose/docker-compose.yml` با همه سرویس‌ها، شبکه‌های جدا (`edge`, `app`, `data`, `pbx`)، healthcheck، digest pin
- **T2** پروفایل‌ها: `core`, `ai`, `cti`, `meet`, `observability`
- **T3** reverse proxy (Caddy/Traefik — مجوز بررسی) با TLS داخلی
- **AC:** `docker compose --profile core up` روی سرور تمیز < 10 دقیقه سالم بالا می‌آید؛ هیچ image با tag `latest` نیست؛ پس از pull، startup در شبکه بسته کار می‌کند (NFR-012).

---

## E02 — هویت
### E02.F1 — Keycloak
- **T1** realm `lavin` به‌صورت کد (realm export + `keycloak-config-cli`)
- **T2** LDAP federation به AD (LDAPS، READ_ONLY، group mapper) — تست با Samba AD در CI
- **T3** کاربر محلی + break-glass + MFA اجباری برای نقش‌های admin
- **T4** تم فارسی/RTL صفحه ورود
- **AC:** AT-02 (ورود break-glass هنگام قطع AD با MFA و audit)؛ غیرفعال‌سازی در AD → نشست < TTL تنظیمی باطل.

### E02.F2 — BFF Session
- **T1** Auth Code + PKCE، نشست سرور در Valkey، cookie `__Host-`
- **T2** refresh rotation، back-channel logout، CSRF token
- **T3** همگام‌سازی `orgs.user_profile` و نگاشت گروه AD → role binding
- **AC:** AT-17 (تغییر گروه AD → scope جدید در API و queue < 60s)؛ توکن هرگز در JS مرورگر در دسترس نیست.

## E03 — Authorization و Audit
### E03.F1 — موتور authz
- **T1** seed `permission-matrix.csv` → جداول RBAC در `core`
- **T2** `requirePermission`, `scopeFilter` (→ SQL)، `fieldPolicy`
- **T3** RLS دفاع لایه دوم روی `care.ticket`, `call.call`, `call.recording`, `chnl.message`
- **T4** cache تصمیم + invalidation
- **T5** enforcement در SSE/WebSocket، file URL، jobs، AI tools
- **AC:** AT-01 (403/404 + audit بدون نشت)، AT-08، AT-18؛ تست property-based: هیچ endpoint بدون `x-permission` (lint روی OpenAPI).

### E03.F2 — مدیریت نقش از UI
- **T1** UI نقش‌ها، bindingها، field policy
- **T2** dual approval برای permissionهای `sensitive=yes`
- **AC:** درخواست‌دهنده نمی‌تواند خودش تأیید کند (DB check)؛ هر تغییر در audit.

### E03.F3 — Audit
- **T1** writer با hash chain؛ کاربر DB فقط INSERT
- **T2** UI جست‌وجو با فیلتر correlation_id
- **T3** job تأیید زنجیره hash روزانه + هشدار
- **AC:** KPI-08 (۱۰۰٪ عملیات حساس با actor/زمان/موجودیت/تغییر/correlation)؛ UPDATE/DELETE روی audit خطا می‌دهد.

## E04 — Config Control Plane و Secrets
- **F1** Registry تعاریف (`config_definition`) برای همه گروه‌های §13 — **AC:** KPI-06
- **F2** چرخه draft→test→approve→active→rollback — **AC:** AT-14
- **F3** Secret store (envelope encryption، KEK فایل/HSM، rotation، write-only UI) — **AC:** هیچ API مقدار secret را برنمی‌گرداند؛ لاگ‌ها ماسک دارند (تست grep روی log)
- **F4** Feature flags برای P1/P2
- **F5** Deployment controller با دستورات allowlisted + تأیید دومرحله‌ای (بدون shell آزاد)

## E05 — Design System فارسی
- **F1** توکن‌ها، Vazirmatn (OFL)، کامپوننت‌های RTL (Radix)، حالت تاریک
- **F2** `packages/i18n`: fa/en، نرمال‌سازی ی/ک، نیم‌فاصله، ارقام فارسی در نمایش، bidi-isolation برای متن مخلوط
- **F3** DatePicker و Calendar جلالی (روز/هفته/ماه)، تبدیل دوطرفه، timezone
- **F4** App shell، ناوبری بر اساس permission، جست‌وجوی سراسری
- **AC:** AT-11 (متن فارسی + ارقام + لینک انگلیسی در کانبان/تقویم/PDF/پیام درست)؛ WCAG 2.2 AA با axe در Playwright؛ NFR-005.

## E06 — Event Backbone
- **T1** کتابخانه `packages/events`: envelope §15.3، Zod schema registry، نسخه‌بندی
- **T2** outbox writer + relay (LISTEN/NOTIFY + poll) → NATS JetStream
- **T3** consumer base با inbox dedupe، retry با backoff+jitter، DLQ و UI replay
- **AC:** AT-13 (kill worker وسط انتشار → حداکثر یک side effect)؛ KPI-05؛ تست chaos با Testcontainers.

## E07 — CRM
- **F1** CrmRepository port + Corteza adapter (یا بومی طبق تصمیم ADR-001)
- **F2** Lead intake چندمنبعی + UTM + consent (SALE-001)
- **F3** Dedupe با نرمال‌سازی شماره ایرانی، merge با audit/rollback (SALE-002)
- **F4** Account/Contact و Timeline ۳۶۰ (SALE-003)
- **F5** Lead scoring قاعده‌ای از UI + override (SALE-004)
- **F6** Pipeline چندگانه نسخه‌دار + guard انتقال (SALE-005)
- **F7** Deal Kanban (SALE-006)
- **F8** Quote/Contract با قالب، PDF فارسی، تأیید BPM، لینک امضاشده مشتری (SALE-008)
- **F9** گزارش‌های قیف/win-loss در SQL/MV (SALE-009)
- **F10** Email SMTP/IMAP + unsubscribe (SALE-012)
- **F11** Projection خواندنی و reconciliation
- **AC نمونه:** AT-01؛ Lead تکراری با `09121234567` و `+989121234567` به‌عنوان candidate شناسایی شود و ادغام خودکار نشود؛ تغییر مرحله Deal رویداد `deal.stage_changed.v1` با aggregate_version می‌سازد.

## E08 — BPM و Kanban
- **F1** Flowable deployment + event listener → outbox
- **F2** workflow-facade و external worker
- **F3** طراح BPMN/DMN (bpmn-js) با validate/simulate/approve/deploy/rollback
- **F4** فرم‌ساز user task (JSON Schema → فرم RTL)
- **F5** برد کانبان: ستون، swimlane، WIP، checklist، پیوست، subtask، dependency، mention، SSE، saved views، bulk ops
- **F6** فرایندهای P0: BPM-LEAD-01, CONTENT-01, COMPLAINT-01, QUOTE-01, AI-CHANGE-01 + DMNها
- **F7** گزارش lead/cycle time
- **AC:** AT-06 (Drag غیرمجاز → رد و rollback UI)، AT-07 (SLA یک‌دقیقه‌ای → دقیقاً یک escalation)، KPI-03 (رویداد → تسک p95 < 5s).

## E09 — Support/Case
- **F1** Case + شماره‌گذاری + منبع + consent
- **F2** SLA policy با تقویم کاری/تعطیلات جلالی
- **F3** escalation و اعلان (in-app، email، Bale)
- **F4** CSAT از کانال مجاز
- **AC:** E2E-02 کامل؛ AT-07.

## E10 — Channel Gateway و Inbox
- **F1** چارچوب Connector + capability matrix + health
- **F2** Telegram، **F3** Bale، **F4** Rubika (webhook + polling)، **F5** Email، **F6** Webchat widget (CSP، origin allowlist)
- **F7** Unified Inbox: assign، note، canned replies، SLA، tag، merge، takeover AI/human
- **F8** Identity resolution با confidence
- **F9** ارسال انبوه با consent، frequency cap، approval (`channels.broadcast.approve`)
- **AC:** AT-03، AT-04، AT-13، AT-14؛ KPI-09 (قطع Rubika بر Bale اثری ندارد — تست circuit breaker).

## E11 — CTI Gateway
- **F1** PbxDriver + AsteriskAmiDriver (reconnect، heartbeat، dedupe)
- **F2** نرمال‌سازی CDR/CEL و هم‌بستگی linkedid/انتقال
- **F3** Screen pop از SSE با field policy
- **F4** Click-to-call (حساب AMI جدا)
- **F5** Missed call → task؛ تماس شکایت → Case
- **F6** RecordingRef + URL امضاشده + retention
- **F7** پنل مدیر: چند PBX، test، وضعیت
- **AC:** AT-05 (دو PBX هم‌زمان بدون collision)، AT-18، تست مرجع §9.3 (قطع شبکه بدون duplicate).

## E12 — Content Studio و Brand
- **F1** Payload CMS جدا + fa + SSO از Keycloak + RBAC از authz محصول
- **F2** Brand Core نسخه‌دار (۱۳ بخش — مدل مستقل الهام‌گرفته از اسکیمای مرجع) (CNT-001)
- **F3** Creative Brief، Idea Inbox با تشخیص تکراری (CNT-002/003)
- **F4** AI ideation و تولید نسخه‌ها با Brand Core retrieval (CNT-004/005)
- **F5** برندگارد (CNT-006) — اتصال به EVAL judges
- **F6** Editor RTL/LTR با diff، کامنت، rollback، preview کانال (CNT-007)
- **F7** Asset Library با usage-rights و ClamAV (CNT-008)
- **F8** Template Studio (CNT-009)، **F9** تقویم محتوا (CNT-010)، **F10** سنجه اثر (CNT-013)، **F11** انتشار Bale/Rubika یا manual handoff (CNT-014)
- **AC:** AT-16، E2E-03؛ AI هیچ ادعای fact بدون source reference ذخیره نمی‌کند (تست guard).

## E13 — Marketing
- **F1** Workspace (هدف، پرسونا، بودجه، KPI) (MKT-001)
- **F2** Campaign/Touchpoint/UTM builder/لینک کوتاه/فرم Lead (MKT-002)
- **F3** Segment builder با preview تعداد مجاز (MKT-003)
- **F4** تقویم مشترک جلالی (MKT-004)
- **F5** چرخه تأیید BPM (MKT-005)
- **F6** انتشار native/manual (MKT-006/007)
- **AC:** AT-15 (ROI با provenance و نمایش unknown).

## E14 — AI Gateway و RAG
- **F1** Provider abstraction (Ollama/vLLM/remote-disabled)
- **F2** Ingestion jobs (PDF/DOCX/MD/HTML/CSV، OCR اختیاری)
- **F3** Hybrid retrieval با ACL در SQL + نرمال‌سازی فارسی
- **F4** هسته چت کانال‌مستقل: reply/streamReply/handoff/summarize/suggestNextAction
- **F5** Tools با RBAC و تأیید side effect
- **F6** Guardrails (injection، PII، citation)
- **F7** Prompt Registry + trace
- **AC:** AT-09، AT-12 (قطع اینترنت → چت محلی کار می‌کند)، AI-010.

## E15 — EVAL
- **F1** Golden Set CRUD/import (JSON/CSV) نسخه‌دار
- **F2** Target adapters (local chatbot، fixture، channel stub)
- **F3** ۴ داور + checks قطعی + rubric نسخه‌دار
- **F4** Runner async (pause/resume/cancel/budget)
- **F5** Regression gate در CI و در BPM-AI-CHANGE-01
- **F6** RAG diagnostics
- **F7** Human label و calibration
- **AC:** AT-10، E2E-04؛ Safety بحرانی = صفر خطا مانع publish.

## E16 — Analytics
- **F1** مدل داده تحلیلی (MV/OLAP سبک روی Postgres)
- **F2** داشبورد فروش/بازاریابی با drilldown و scope (MKT-012، SALE-009)
- **F3** export با RBAC و ماسک PII
- **AC:** داشبورد برای analyst هیچ PII بدون grant نشان نمی‌دهد.

## E17 — Meetings
- **F1** Jitsi با JWT، ساخت جلسه از Lead/Deal، لینک در timeline
- **AC:** فقط کاربران با `meeting.room.join` و مشتری دعوت‌شده وارد اتاق می‌شوند.

## E18 — Hardening و Release
- **F1** Observability (OTel، metrics، alert، dashboard)
- **F2** Backup رمزنگاری‌شده (PG، object store، config، BPM، realm) + restore در محیط جدا — **AT-19**
- **F3** تست بار k6 (200 کاربر/50 rps) — NFR-004
- **F4** Pentest داخلی + تست chaos قطع PBX/کانال
- **F5** Runbookهای فارسی، راهنمای استقرار/بازیابی
- **AC:** همه AT-01..20 با evidence واقعی PASS.

## E19 — Expansion (P1/P2)
Forecast/quota (SALE-010)، ERP (SALE-011)، Ads/attribution (MKT-008)، A/B (MKT-009)، SEO (MKT-010)، nurture (MKT-011)، ترجمه/زیرنویس/ویدئو (CNT-011/012)، CTI پیشرفته و رونویسی (CTI-007/008)، production eval (EVL-008)، PBXها و شبکه‌های جدید.

---

## نگاشت آزمون‌های پذیرش به Epic

| AT | Epic | AT | Epic |
|---|---|---|---|
| AT-01 | E03 | AT-11 | E05 |
| AT-02 | E02 | AT-12 | E14, E18 |
| AT-03 | E10 | AT-13 | E06, E10 |
| AT-04 | E10 | AT-14 | E04, E10 |
| AT-05 | E11 | AT-15 | E13, E16 |
| AT-06 | E08 | AT-16 | E12 |
| AT-07 | E08, E09 | AT-17 | E02, E03 |
| AT-08 | E03, E04 | AT-18 | E03, E11 |
| AT-09 | E14 | AT-19 | E18 |
| AT-10 | E15 | AT-20 | E01 |

## Sprint 0 (دو هفته) — پیشنهاد اجرایی
1. E00.F1.T3، E00.F2 (کامل)، E00.F3.T1–T4، E00.F4.T1
2. E01.F1، E01.F3.T1 (پروفایل core)
3. migration `0001_platform_core.sql` (آماده) + seed permission matrix
4. اسکلت عمودی E2E-02: Asterisk آزمایشی → cti-gateway → Case → Flowable COMPLAINT-01 → تسک روی برد → اعلان → audit
5. تست‌های AT-01، AT-02، AT-06، AT-11
6. گزارش Sprint: انجام‌شده / evidence / ریسک / تفاوت با PRD / گام بعد
