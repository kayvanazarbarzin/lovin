# ممیزی مخازن مرجع — لاوین (Lavin)

> شناسه: DISC-001 | تاریخ: 2026-11-26 | مرجع: PRD-AGOS-001 §2، §22 گام ۱
> روش: کلون کامل در SHA ثابت، بررسی درخت، manifests، اسکیماها و فایل‌های کلیدی. این ممیزی **حقوقی نهایی** یا اجرای تست نیست.

## ۱. نسخه‌های بررسی‌شده

| مخزن | SHA بررسی‌شده | تطابق با PRD | نویسنده commitها | LICENSE |
|---|---|---|---|---|
| kayvanazarbarzin/personal-branding-studio | `94affd91` | ✅ یکسان | 100٪ `siavash-smf` (۶ commit) | ❌ ندارد |
| kayvanazarbarzin/arkan-website-chatbot | `4475fda2` | ✅ یکسان | 100٪ `siavash-smf` (۱۹ commit) | ❌ ندارد؛ `"private": true` |
| kayvanazarbarzin/arkan-eval | `7e9c1bfe` | ✅ یکسان | `siavash-smf` + ۱ commit با Claude | ❌ ندارد؛ `"private": true` |
| kayvanazarbarzin/ruflo | `9576a103` (2026-09-10) | ✅ یکسان | upstream (`rUv`) | MIT |
| ruvnet/ruflo | `0636aa74` (2026-11-26) | ⚠️ PRD: `48b04dce`؛ ۵ commit جلوتر | `rUv` | MIT |

## ۲. ماتریس بازاستفاده

حالت پیش‌فرض تا بسته‌شدن LIC-GATE-001: **فقط رفتار و نیازمندی (clean-room)**. ستون «پس از مجوز» فقط وقتی معتبر است که اجازه مکتوب siavash-smf ثبت شود.

### 2.1 arkan-website-chatbot (Next.js 14، Supabase، ~۱۲۰ فایل)

| قابلیت | فایل(های) مرجع | ارزش | تصمیم |
|---|---|---|---|
| هسته چت کانال‌مستقل (`prepareTurn`، `handleChatTurn`، `getReplyText`) | `src/lib/rag/chat.ts` | بالا | الگوی معماری AI-001؛ بازنویسی با Provider محلی، Tool-calling با RBAC، ACL بازیابی |
| Ingestion/Chunking | `src/lib/rag/ingest.ts`, `chunking.ts` | متوسط | رفتار مرجع؛ پیاده‌سازی مستقل با job queue (AI-002) |
| بازیابی برداری + rerank | `retrieve.ts`, `match_chunks()` | متوسط | **فاقد ACL/tenant و فقط dense** → جایگزین با hybrid (pgvector + FTS فارسی) + فیلتر ACL قبل از رتبه‌بندی (AT-09) |
| Policy: تشخیص injection، ماسک PII، ساعت اداری | `policy.ts` | متوسط | فهرست الگوها به‌عنوان test fixture مصنوعی؛ guardrail لایه‌ای جدید |
| ثبت شکاف دانش (`unanswered_questions`) | `chatbot-upgrade.sql` | بالا | ایده → EVL-006 RAG diagnostics |
| Prompt versioning و model/embedding config | `prompt_versions`, `model_config` | بالا | رفتار → AI-004 Prompt Registry نسخه‌دار با گیت EVAL |
| CRM: Company/Contact/PipelineStage/Deal/Activity/Contract/Campaign | `supabase/crm-schema.sql`, `src/lib/crm/types.ts` | بالا | **مبنای mapping مهاجرت** به CRM جدید (ADR-001) |
| قرارداد با توکن عمومی و وضعیت draft→sent→viewed→accepted | `src/app/contract/[token]` | متوسط | رفتار → SALE-008 با امضای URL و BPM-QUOTE-01 |
| Segment و Report | `segments.ts`, `reports.ts` | پایین | گزارش در Node تجمیع می‌شود → بازطراحی SQL/MV |
| Telegram webhook | `api/telegram/webhook/route.ts` | متوسط | الگوی Connector؛ رفع ایرادها (پایین) |
| ویجت وب (`public/widget.js`) | | متوسط | بازنویسی مستقل با CSP و origin allowlist |

### 2.2 arkan-eval (Next.js 14)

| قابلیت | فایل | تصمیم |
|---|---|---|
| ۴ داور: Expectation / Faithfulness / BrandVoice / Safety | `src/lib/judges/rubrics.ts` | معماری مرجع EVL-003؛ rubric نسخه‌دار در DB |
| چک‌های قطعی (deterministic) | `judges/checks.ts` | رفتار مرجع؛ پیاده‌سازی مستقل |
| اجرای مرحله‌ای (`createRun` → `advanceRun`) | `runner.ts` | ایده خوب برای عدم اجرای طولانی در HTTP؛ جایگزین با worker + NATS (EVL-004) |
| Target adapter (http-chat / fixture) | `targets/*` | مطابق EVL-002 |
| Human label و alignment داور/انسان | `alignment.ts`, `api/labels` | مطابق EVL-007 |
| Golden Set نمونه (`suites/arkan-chatbot-golden.json`) | | **داده آرکان — وارد نشود**؛ فقط ساختار JSON |
| هزینه/قیمت مدل | `pricing.ts` | فقط برای provider خارجی اختیاری |

### 2.3 personal-branding-studio (Python stdlib HTTP + vanilla JS)

| قابلیت | فایل | تصمیم |
|---|---|---|
| اسکیمای Brand Core (۱۳ بخش: هویت، تمایز، مخاطب، پیشنهاد، پیام/اثبات، صدا/لحن، واژگان، فرمت، قالب پلتفرم، بصری، نمونه‌ها، خط قرمزها، خلاصه) | `app/brand_schema.py` | **بهترین مرجع مفهومی CNT-001**؛ ساختار را به‌صورت مستقل در Payload collection `BrandCoreVersion` مدل می‌کنیم |
| بانک ایده، استوری، کاروسل، ریلز، تحلیل اینستاگرام | `app/*.py`, `modules/*` | رفتار مرجع CNT-003/005/009 |
| موتور ویدئو (Swift/macOS، GSAP) | `modules/video` | **غیرقابل استفاده در سرور** (وابسته به macOS)؛ P1 با FFmpeg worker |
| مدل AI: CLI اشتراک Claude و Gemini | `app/ai_models.py` | **ممنوع در محصول** (PRD §0.5)؛ Provider abstraction محلی |

## ۳. پرچم‌های قرمز (نباید کپی شوند)

| # | مورد | محل | شدت | اقدام در محصول |
|---|---|---|---|---|
| RF-01 | `isAuthorized()` اگر `EVAL_PASSWORD` نباشد `true` برمی‌گرداند (fail-open) | arkan-eval `src/lib/auth.ts` | بحرانی | OIDC + `eval.*` permission؛ fail-closed (AT-10) |
| RF-02 | کلید پیش‌فرض `"arkan-insecure-dev-secret"`؛ نشست `legacy` با `exp: 0` و نقش owner | chatbot `src/lib/auth.ts` | بحرانی | Keycloak OIDC؛ هیچ secret پیش‌فرض؛ boot fail بدون config |
| RF-03 | نقش‌های رتبه‌ای (`ROLE_RANK`) بدون permission ریز و scope | chatbot `src/lib/roles.ts` | بالا | `module.resource.action` + scope (§14.2) |
| RF-04 | `SITE_URL = "https://arkan-website-chatbot.vercel.app"` hardcode | telegram webhook | بالا | `platform.public_base_url` از تنظیمات مدیر |
| RF-05 | RAG بدون فیلتر tenant/ACL؛ کلاینت admin Supabase (service role) در همه مسیرها | `retrieve.ts`, `supabase.ts` | بحرانی | ACL در SQL + کاربر DB با کمترین اختیار |
| RF-06 | تجمیع گزارش‌ها در Node | `crm/reports.ts` | متوسط | SQL/Materialized View |
| RF-07 | وابستگی پیش‌فرض به OpenRouter/Cohere (`rerank-multilingual-v3.0`) | `generate.ts`, `embeddings.ts` | بالا | inference/embedding/rerank محلی پیش‌فرض |
| RF-08 | تک‌کاربره، فایل JSON، subprocess | branding `docs/DEVELOPMENT.md` | بالا | چندکاربره، صف، sandbox، quota |
| RF-09 | GSAP vendored (`modules/video/vendor/gsap.min.js`) — مجوز «GSAP Standard» غیر OSI | branding | متوسط | در SBOM بررسی؛ ترجیحاً حذف |
| RF-10 | داده، پرامپت و برندگاید شرکت آرکان در مخازن | هر سه | بالا | وارد seed/داده واقعی نشود |

## ۴. Ruflo — مقایسه فورک و upstream

| مورد | فورک (`kayvanazarbarzin/ruflo`) | upstream (`ruvnet/ruflo`) |
|---|---|---|
| HEAD | `9576a103` — 2026-09-10 | `0636aa74` — 2026-11-26 |
| commit اختصاصی فورک | **۰** (HEAD فورک ancestor مستقیم upstream است) | — |
| فاصله | **۳۲۲۴ commit عقب** | — |
| commitهای امنیتی جاافتاده | **۱۲۷** (از جمله path traversal در `session_import`، prototype pollution در codex config، enforcement `allowShell/allowNetwork` در MCP policy، محدودیت WebSocket) | — |
| نسخه پکیج | `claude-flow@3.40.0` | `claude-flow@3.80.8` |
| وابستگی‌ها | `@claude-flow/cli-core 3.7.0-alpha.5`، `mcp 3.0.0-alpha.10`، `security 3.0.0-alpha.14`، `agentdb 3.0.0-alpha.17`، `zod 3.25.76` | `cli-core 3.7.8`، `mcp 3.1.6`، `security 3.0.7`، `agentdb ^3.3.0`، `zod 4.6.7` |
| `SKILL.md` / `AGENTS.md` | یکسان با upstream (۸۲ / ۷۰۷ خط) | |
| مجوز | MIT | MIT |

**نکته مهم:** `npx ruflo …` پکیج را از رجیستری npm نصب می‌کند، نه از فورک. پس «استفاده از فورک» در عمل یعنی: (۱) همگام‌سازی فورک با upstream، (۲) قفل نسخه npm (`ruflo@3.80.8` / `claude-flow@3.80.8`) با lockfile و integrity hash، (۳) نصب skill از commit قفل‌شده فورک (`npx skills add kayvanazarbarzin/ruflo@<sha> --skill ruflo`).

**پیشنهاد:** فورک را Sync کن، tag داخلی `lavin-pin-2026-11` بزن، فقط skill `ruflo` (نه `--all` با ۲۶۷ skill) را نصب کن، و هر بار ارتقا را با `npm audit` + بازبینی diff انجام بده. ابزار Ruflo فقط در محیط توسعه است و هرگز وارد image تولیدی نمی‌شود.

## ۵. محدودیت‌های فنی شناسایی‌شده در اجزای منتخب

| جزء | محدودیت | اثر | اقدام |
|---|---|---|---|
| Flowable OSS 7.x | اپ‌های UI (Modeler/Task/Admin) از نسخه ۷ حذف شده‌اند؛ فقط Engine + REST | باید طراح BPMN/DMN بسازیم | bpmn-js/dmn-js (مجوز bpmn.io: رایگان، الزام نگهداشت watermark) + فرم‌ساز خودی |
| Corteza | پوشه `fa` در `corteza-locale` وجود ندارد؛ Go + Vue؛ RBAC و workflow مستقل | فارسی‌سازی، RBAC دوگانه، پشته دوم | Corteza فقط پشت `crm-adapter`؛ UI فقط Next.js؛ RBAC محصول مرجع؛ PoC در Sprint 0 |
| Payload CMS 3 | روی Next.js سوار می‌شود؛ ترجمه `fa` دارد | اگر داخل اپ اصلی باشد چرخه انتشار گره می‌خورد | اپ جدا `services/cms` با database جدا |
| Keycloak | تم فارسی/RTL صفحه ورود پیش‌فرض ناقص | UX ورود | تم سفارشی Keycloakify یا FTL خودی |
| بله | API شبیه Telegram Bot؛ امضای webhook رسمی مستند نیست | AT-03 | secret path + token header + dedupe |
| روبیکا | `botapi.rubika.ir/v3/{token}/{method}`؛ امضا ندارد | امنیت webhook | secret endpoint + allowlist + anti-replay؛ پشتیبانی polling |
| Issabel | معمولاً بر پایه نسخه‌های قدیمی‌تر Asterisk؛ قابلیت ARI بسته به نسخه | call-control | AMI برای رویداد؛ ARI فقط اگر نسخه پشتیبانی کند (capability flag) |
| MinIO | AGPL | PRD §2.2 | SeaweedFS (Apache-2.0) |
| Grafana | AGPL | PRD §2.2 | استفاده بدون تغییر با تأیید حقوقی، یا Perses (Apache-2.0) |
