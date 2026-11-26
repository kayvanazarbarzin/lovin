# ADR-000 — معماری کلان لاوین (Lavin)

- وضعیت: پیشنهادی (Proposed) — منتظر بازبینی مالک
- تاریخ: 2026-11-26
- مرجع: PRD §3، §16

## زمینه
PRD یک **Modular Monolith** در TypeScript برای هسته دامنه، همراه با موتورهای تخصصی (Corteza، Flowable، Payload، Keycloak، Jitsi) و gatewayهای جدا برای کانال و تلفن می‌خواهد. همه چیز self-hosted و بدون وابستگی ابری.

## تصمیم

### ۱. لایه‌ها
```
┌──────────────────────────────────────────────────────────────────┐
│  apps/web  — Next.js (App Router) RTL + BFF                      │
│  (همه UI روزمره؛ Corteza/Flowable/Payload UI به کاربر نمایش داده نمی‌شوند) │
└───────────────┬──────────────────────────────────────────────────┘
                │ OIDC session (httpOnly cookie) → access token
┌───────────────▼──────────────────────────────────────────────────┐
│  apps/api — Core Modular Monolith (Node.js/TS, Fastify + Zod)     │
│  modules: iam · authz · audit · settings · crm · tasks · workflow │
│           support · marketing · content · inbox · ai · analytics │
│  shared: outbox · inbox(dedup) · idempotency · correlation       │
└──┬──────────┬──────────┬──────────┬──────────┬───────────┬───────┘
   │ ports/adapters (هیچ ماژولی مستقیماً به موتور بیرونی وابسته نیست)
   ▼          ▼          ▼          ▼          ▼           ▼
 Corteza   Flowable   Payload    Keycloak   Jitsi     AI Gateway
 (CRM)     (BPMN/DMN) (CMS)      (IdP)      (JWT)     (Ollama/vLLM)

 services/channel-gateway  (Bale, Rubika, Telegram, Email, Web)  ──┐
 services/cti-gateway      (N × Asterisk/Issabel AMI/ARI)         ──┤─► NATS JetStream
 services/eval-service     (runner + judges)                      ──┤
 apps/worker               (jobs, schedules, notifications)       ──┘
 Data: PostgreSQL 16 (+pgvector؛ DB اپ: یک schema چهارحرفی برای هر دامنه — orgs · auth · conf · evnt · logs · cust · task · chnl · call · care · know · aiml؛ موتورها DB جدا) · Valkey · SeaweedFS
```

### ۲. چرا این تقسیم
| جزء | فرایند جدا؟ | دلیل |
|---|---|---|
| Core API (monolith) | یک فرایند | تراکنش‌پذیری، سادگی، سرعت توسعه؛ مرز ماژول با lint (dependency-cruiser) |
| channel-gateway | جدا | اتصال دائم/polling، rate-limit هر کانال، خرابی یک کانال نباید هسته را بخواباند (KPI-09) |
| cti-gateway | جدا | اتصال TCP پایدار AMI به چند PBX، reconnect/backoff، شبکه محدود (VLAN) |
| eval-service | جدا | بار سنگین LLM، صف و budget |
| worker | جدا (همان codebase) | jobهای طولانی، render، ingestion |
| Payload CMS | جدا | Payload 3 خودش یک اپ Next.js است؛ جداسازی چرخه انتشار |

### ۳. قواعد سراسری
1. **Authorization فقط server-side** در `packages/authz`؛ BFF هیچ تصمیم مجوزی نمی‌گیرد، فقط token را عبور می‌دهد.
2. **Outbox در همان تراکنش** تغییر دامنه؛ relay به NATS؛ هر مصرف‌کننده جدول `inbox` با کلید `(consumer, event_id)`.
3. هر درخواست تغییر: `X-Correlation-ID` (اجباری، تولید در BFF در صورت نبود) و `Idempotency-Key` (برای POSTهای غیر‌idempotent).
4. زمان در DB همیشه `timestamptz` UTC؛ تبدیل جلالی فقط در لایه نمایش/ورودی (`packages/i18n`، کتابخانه `date-fns-jalali` / `Intl` با `calendar: 'persian'`).
5. Secrets فقط در Secret Store (ابتدا: جدول رمزگذاری‌شده با envelope encryption و KEK در فایل/HSM؛ در آینده OpenBao). UI فقط write/rotate/test، هرگز read.
6. **یک instance PostgreSQL، چند database (تصمیم مالک 2026-11-26):** `lavin` (کد خود لاوین، schemaهای چهارحرفی)، `keycloak`، `flowable`، `corteza`، `payload`. هر database مالک و role جدا با کمترین اختیار دارد؛ هیچ سرویسی به database دیگری دسترسی ندارد؛ بدون superuser مشترک. backup هر database جدا و یکجا.
7. ارتباط بیرونی (کانال‌ها/AI ابری) فقط از gatewayهای مشخص و با egress allowlist.

### ۴. پشته و نسخه‌ها (pin در Sprint 0 تأیید می‌شود)
| لایه | انتخاب |
|---|---|
| Runtime | Node.js 22 LTS، pnpm workspaces، Turborepo |
| Web | Next.js 15 (App Router)، React 19، Tailwind 4، Radix UI، dnd-kit |
| API | Fastify 5، Zod، OpenAPI 3.1 (تولید از Zod)، Drizzle ORM + SQL migrations |
| Auth lib | `openid-client`، `jose` |
| Data | PostgreSQL 16 + pgvector 0.8، Valkey 8، NATS 2.10 JetStream، SeaweedFS |
| Engines | Keycloak 26، Flowable 7.x (Spring Boot REST)، Corteza 2024.9.x/2025.x، Payload 3.x، Jitsi stable |
| AI | Ollama (CPU/GPU کوچک) یا vLLM (GPU)؛ embedding چندزبانه محلی (مثلاً `bge-m3`) |
| Test | Vitest، Playwright، Testcontainers، k6، Pact (contract) |
| Observability | OpenTelemetry → Prometheus + Tempo/Loki یا معادل مجاز |
| Deploy | Docker Compose (PoC/تک‌سرور)، Helm بعدی؛ تصاویر با digest |

### ۵. پیامدها
- (+) یک UI، یک RBAC، یک audit؛ موتورها قابل تعویض پشت پورت.
- (−) چهار موتور JVM/Go/Node جدا. **اندازه هدف (مالک): تا ۵۰ کاربر، تک‌سرور، GPU اختیاری.** برآورد: ۱۶ vCPU، ۶۴GB RAM، ۱TB SSD بدون GPU (AI روی CPU با مدل کوچک)؛ با GPU ۲۴GB کیفیت AI ارتقا می‌یابد. هدف بار PRD (۲۰۰ کاربر/۵۰ rps) همچنان معیار تست سقف است.
- (−) نیاز به UI خودی برای Flowable و پنهان‌سازی UI Corteza.

## ADRهای مرتبط
ADR-001 CRM/Corteza · ADR-002 Workflow/Tasks · ADR-003 Identity/RBAC · ADR-004 Self-hosted AI · ADR-005 Channel/CTI
