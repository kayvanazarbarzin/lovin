# لاوین (Lavin)

پلتفرم یکپارچه، فارسی و خودمیزبان برای CRM، فروش، بازاریابی، تولید محتوا، کانبان و BPMN، مرکز تماس و هوش مصنوعی.

## شروع کار با ایجنت کدنویس در VS Code
1. این پوشه را در VS Code باز کنید و پیش‌نیازهای `docs/agent/SETUP.md` را نصب کنید.
2. Skill روفلو را یک بار به‌صورت سراسری نصب کنید:
   `npx skills add https://github.com/ruvnet/ruflo --skill ruflo -g`
3. در چت ایجنت، prompt `start-task` را اجرا کنید. ایجنت خودش `docs/agent/STATE.md` و تسک بعدی را از `docs/agent/TASKS.md` برمی‌دارد.
4. در پایان هر تسک prompt `finish-task` و برای بازبینی مستقل prompt `review` را اجرا کنید.

## ساختار اسناد
| فایل | کاربرد |
|---|---|
| `AGENTS.md` | قوانین اصلی ایجنت (VS Code Copilot، Claude Code و سایر ایجنت‌ها) |
| `.github/instructions/` | قوانین مخصوص هر بخش کد (بک‌اند، فرانت، دیتابیس، تست، امنیت، یکپارچه‌سازی) |
| `docs/agent/` | حافظه ایجنت: وضعیت، صف تسک‌ها، تصمیم‌ها، نقشه مطالعه، واژه‌نامه، راه‌اندازی |
| `docs/architecture/` | ADRها |
| `docs/api/openapi.yaml` | قرارداد API |
| `docs/security/` | ماتریس دسترسی |
| `database/migrations/` | مدل داده |
| `docs/PRD.md` | سند نیازمندی‌ها (مرجع نهایی) |
