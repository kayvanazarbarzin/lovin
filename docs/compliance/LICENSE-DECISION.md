# تصمیم مجوز — LIC-GATE-001

> وضعیت: **بسته (Closed) — 2026-11-26** — مالک پروژه اعلام کرد اجازه استفاده از کد سه مخزن آرکان را دارد.
> اقدام باقی‌مانده: نسخه مکتوب اجازه در `docs/compliance/permissions/` بایگانی شود (ترجیحاً با افزودن فایل LICENSE به مخازن بالادستی).
> تاریخ: 2026-11-26 | مرجع: PRD §2.2، §21 (R-01، R-14)
> این سند نظر مهندسی است، نه مشاوره حقوقی.

## ۱. وضعیت مخازن مرجع

| مخزن | مجوز | شواهد | تصمیم فعلی |
|---|---|---|---|
| personal-branding-studio | **نامشخص** (بدون LICENSE) | همه commitها از `siavash-smf`؛ README عبارت «رایگان و متن‌باز» دارد که جانشین مجوز حقوقی نیست | فقط مرجع رفتار |
| arkan-website-chatbot | **نامشخص** | `package.json: "private": true`؛ بدون LICENSE | فقط مرجع رفتار + mapping مهاجرت داده |
| arkan-eval | **نامشخص** | `"private": true`؛ بدون LICENSE | فقط مرجع رفتار |
| ruflo (fork + upstream) | MIT | فایل LICENSE، `Copyright (c) 2024-2026 ruvnet` | مجاز؛ فقط ابزار توسعه |

### دارایی‌های جانبی در مخازن
| دارایی | مجوز | تصمیم |
|---|---|---|
| Vazirmatn | SIL OFL 1.1 | مجاز؛ از منبع اصلی (rastikerdar/vazirmatn) دریافت شود، نه از مخازن |
| Estedad | SIL OFL 1.1 (منبع اصلی) | مجاز با دریافت از منبع اصلی |
| GSAP (`gsap.min.js`) | GSAP Standard License (غیر OSI) | استفاده نمی‌شود |
| تصاویر، برندگاید، پرامپت‌ها، Golden Set و پایگاه دانش آرکان | مالکیت شرکت آرکان/نویسنده | **ممنوع** در کد و seed محصول |

## ۲. قواعد بازاستفاده (پس از اجازه)

- کد مجاز است، ولی فقط وقتی **با معماری لاوین سازگار** باشد (RBAC سمت سرور، Provider محلی، چندکاربره). کد ناسازگار بازنویسی می‌شود؛ کپی صرفاً برای صرفه‌جویی ممنوع است.
- هر فایل اقتباسی در سرآیند منبع و SHA را ذکر کند و در `THIRD_PARTY_NOTICES.md` ثبت شود.
- **داده، پرامپت، برندگاید، تصاویر و Golden Set شرکت آرکان همچنان وارد seed یا داده واقعی نمی‌شود** مگر با دستور صریح مالک.
- پرچم‌های قرمز `repo-audit.md` §۳ هرگز منتقل نمی‌شوند.

## ۲-ب. قواعد clean-room (منسوخ — فقط برای سابقه)

1. ایجنت/توسعه‌دهنده‌ای که کد مرجع را می‌خواند، فقط **مشخصات رفتاری** (spec) و **fixture مصنوعی** خروجی می‌دهد؛ پیاده‌سازی از روی spec انجام می‌شود.
2. هیچ قطعه کد، SQL، پرامپت، متن UI یا داده‌ای کپی نمی‌شود. نام موجودیت‌های عمومی دامنه (Deal، Contact…) مشمول نیست.
3. هر PR در فیلد `source_refs` فقط به spec ارجاع می‌دهد. CI با ابزار تشخیص شباهت کد (مثل `jscpd` روی مخازن مرجع) بررسی می‌کند.
4. اگر اجازه مکتوب برسد، این بخش با ADR جدید و نسخه دقیق commitهای مجاز به‌روزرسانی می‌شود.

## ۳. ماتریس مجوز اجزای پلتفرم

| جزء | مجوز | وضعیت | ملاحظه |
|---|---|---|---|
| Next.js / React | MIT | ✅ | |
| Payload CMS | MIT | ✅ | |
| Corteza | Apache-2.0 | ✅ | |
| Flowable OSS Engine | Apache-2.0 | ✅ | فقط Engine/REST؛ محصولات Flowable Work/Design ممنوع |
| bpmn-js / dmn-js | bpmn.io License | ❌ | مالک watermark را نپذیرفت؛ استفاده نمی‌شود (ADR-002) |
| bpmn-moddle / dmn-moddle | MIT | ✅ | خواندن/نوشتن XML استاندارد BPMN/DMN |
| @xyflow/react (React Flow) | MIT | ✅ | بوم طراح فرایند خودی |
| Apache KIE BPMN/DMN standalone editors | Apache-2.0 | ⚠️ | نامزد PoC؛ سازگاری با Flowable بررسی شود |
| Keycloak | Apache-2.0 | ✅ | |
| PostgreSQL / pgvector | PostgreSQL License | ✅ | |
| Valkey | BSD-3-Clause | ✅ | جایگزین Redis |
| NATS JetStream | Apache-2.0 | ✅ | |
| SeaweedFS | Apache-2.0 | ✅ | جایگزین MinIO (AGPL) |
| Jitsi Meet | Apache-2.0 | ✅ | |
| Ollama | MIT | ✅ | |
| vLLM | Apache-2.0 | ✅ | نیازمند GPU |
| مدل‌های زبانی | متغیر | ⚠️ | هر مدل جداگانه: Qwen (اکثراً Apache-2.0)، Llama (Community License با محدودیت) — در ADR-004 |
| OpenTelemetry / Prometheus | Apache-2.0 | ✅ | |
| Grafana | AGPL-3.0 | ⚠️ | استفاده بدون تغییر با تأیید حقوقی؛ جایگزین Perses |
| Asterisk / Issabel | GPL-2.0 | ✅ | فقط ارتباط شبکه‌ای (AMI/ARI)؛ بدون link |
| ClamAV | GPL-2.0 | ✅ | سرویس جدا، بدون link |

## ۴. کنترل CI (AT-20)
- تولید `SBOM.json` (CycloneDX) در هر build.
- allowlist مجوز: `MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, PostgreSQL, OFL-1.1, 0BSD, MPL-2.0 (فقط بدون تغییر)`.
- هر مجوز ناشناخته/AGPL/SSPL/BUSL/Commons-Clause → شکست release gate.

## ۵. اقدام لازم از مالک
- [x] اجازه استفاده از کد سه مخزن آرکان (اعلام مالک 2026-11-26) — بایگانی نسخه مکتوب باقی است
- [x] watermark bpmn.io — رد شد
- [ ] تأیید سیاست Grafana
