# ADR-001 — مرز CRM: Corteza در برابر CRM آرکان

- وضعیت: **مصوب مالک (2026-11-26): Corteza پشت adapter با دروازه PoC در Sprint 0**؛ نتیجه نهایی پس از PoC
- مرجع: PRD §3.2، §3.3، §5، R-03، R-06

## زمینه
- PRD: Corteza مالک قطعی Lead/Account/Contact/Deal/Activity/Quote metadata است؛ ساخت دو CRM هم‌زمان ممنوع؛ جایگزینی فقط با ADR.
- Corteza بسته `fa` ندارد، RBAC و workflow خودش را دارد و پشته Go/Vue است.
- CRM آرکان (Supabase) جداول `companies, contacts, pipeline_stages, deals, activities, contracts, campaigns, leads` دارد.

## تصمیم پیشنهادی
1. **Corteza = System of Record برای موجودیت‌های CRM**، از طریق «Compose namespace» به نام `lavin_crm` با ماژول‌های: `Lead, Account, Contact, Deal, Pipeline, Stage, Activity, Quote, Contract`.
2. همه دسترسی‌ها از **`crm-adapter`** (پورت `CrmRepository`) در Core API. کاربران هرگز مستقیم وارد UI Corteza نمی‌شوند؛ فقط `process_admin`/`system_admin` برای low-code config.
3. **RBAC محصول مرجع است.** Core API با یک service account Corteza (کم‌اختیار، فقط namespace `lavin_crm`) صحبت می‌کند و scope (team/own/BU) را خودش قبل از فراخوانی و روی نتیجه اعمال می‌کند. فیلدهای `owner_user_id`, `team_id`, `bu_id`, `tenant_id` در همه ماژول‌ها اجباری.
4. **Projection خواندنی** در Postgres خود محصول (schema `sale`) از رویدادهای Corteza (webhook/automation → outbox) برای جست‌وجو، timeline ۳۶۰، کانبان و گزارش SQL. نوشتن فقط از adapter.
5. workflow داخلی Corteza فقط برای اتوماسیون سبک و **هرگز** شروع فرایند Flowable از سمت Corteza (جلوگیری از loop). همه triggerها از رویداد outbox Core.
6. Persian: فقط UI Next.js فارسی است؛ برای ادمین Corteza ترجمه حداقلی labelها (اختیاری P1).

## گیت PoC (Sprint 0) — معیار پذیرش ادامه با Corteza
| معیار | آستانه |
|---|---|
| CRUD + جست‌وجو Lead/Contact/Deal از adapter | p95 < 300ms روی 100k رکورد |
| فیلد سفارشی از UI مدیر → در API/فرم Next.js ظاهر شود | بدون تغییر کد |
| scope تیم (AT-01) | 403 بدون نشت |
| رویداد تغییر → projection | < 2s، بدون از دست رفتن پس از restart |
| هزینه نگهداری | ارزیابی تیم |

اگر ≥2 معیار شکست بخورد → ADR-001b: **CRM بومی** در ماژول `crm` روی Postgres با همین پورت `CrmRepository` (بدون تغییر UI/API).

## mapping مهاجرت از CRM آرکان (فقط ساختار؛ داده آرکان وارد نمی‌شود مگر با دستور مالک)
| آرکان | لاوین (Lavin) |
|---|---|
| `leads` | `Lead` (+ `source`, `utm_*`, `consent_id`) |
| `companies` | `Account` |
| `contacts` (`source: website/chatbot/manual`) | `Contact` + `ContactIdentity` |
| `pipeline_stages` | `Pipeline` + `Stage` (چند pipeline) |
| `deals` (`status open/won/lost`) | `Deal` (+ `lost_reason`, `version`) |
| `activities` (`call/meeting/note/task/stage_change`) | `Activity` (task → `tasks` module) |
| `contracts` (`draft/sent/viewed/accepted/canceled`) | `Quote`/`Contract` با BPM-QUOTE-01 |
| `campaigns`, `campaign_emails` | `marketing.Campaign`, `Touchpoint` |
