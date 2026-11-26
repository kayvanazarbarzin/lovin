# ماتریس دسترسی (RBAC + Scope)

فایل: `permission-matrix.csv` — ۱۳۱ permission × ۱۶ نقش پایه (PRD §14.2، §14.3)

| نماد | معنی |
|---|---|
| `T` | کل tenant |
| `B` | واحد کسب‌وکار (Business Unit) کاربر |
| `M` | تیم(های) کاربر |
| `A` | رکوردهای تخصیص‌یافته به کاربر |
| `O` | رکوردهای متعلق به خود کاربر (برای `customer_portal`: پرونده‌های خود مشتری) |
| `X` | **explicit deny** — بر هر allow دیگری غلبه می‌کند |
| خالی | بدون دسترسی (default deny) |

قواعد:
1. نقش‌ها additive هستند؛ `X` همیشه برنده است.
2. ستون `sensitive=yes` یعنی اعطای آن permission به هر نقش/کاربر جدید نیازمند **dual approval** است.
3. `cti.supervise.monitor` و `cti.recording.download` به هیچ نقش پایه‌ای داده نشده‌اند؛ فقط با binding صریح و تأیید دوم (حتی `super_admin` برای شنود deny دارد — PRD §9.2).
4. `content_creator` حق approve/publish ندارد (`X`) تا جداسازی وظایف حفظ شود (AT-16).
5. `admin.secrets.rotate` برای نقش‌های کسب‌وکاری deny صریح دارد (AT-08).
6. Field policy (مثلاً ماسک شماره تلفن برای `analyst`) در جدول `auth.field_policy` تعریف می‌شود.
7. همه این‌ها template هستند و از پنل مدیر قابل ویرایش‌اند؛ تغییرات نسخه‌دار و audit می‌شوند.
