# ADR-004 — هوش مصنوعی خودمیزبان، RAG و EVAL

- وضعیت: پیشنهادی — **سخت‌افزار (مالک 2026-11-26): GPU شاید باشد، تا ۵۰ کاربر.** طراحی CPU-first؛ پروفایل GPU فقط با تغییر تنظیمات فعال می‌شود (بدون تغییر کد).
- مرجع: PRD §11، §12، AT-09، AT-10، AT-12

## تصمیم
1. **AI Gateway** (`services/ai-gateway`) با رابط واحد OpenAI-compatible داخلی: `chat`, `embed`, `rerank`. Providerها: `ollama` (پیش‌فرض)، `vllm`، `openai_compatible_remote` (پیش‌فرض **disabled**؛ فعال‌سازی با `ai.model.configure` + تأیید `security_admin` + سیاست DLP).
2. **پروفایل سخت‌افزار** (انتخاب در Sprint 0 پس از benchmark فارسی):
   | پروفایل | سخت‌افزار | مدل چت نامزد | embedding |
   |---|---|---|---|
   | S (CPU) | 16 vCPU/64GB | مدل ۷–۸B کوانتیزه (Q4) — کند، فقط RAG ساده | `bge-m3` |
   | M (1×GPU 24GB) | مثلاً RTX 4090/L4 | مدل ۱۴B–۳۲B کوانتیزه | `bge-m3` + reranker `bge-reranker-v2-m3` |
   | L (≥2×GPU 48GB+) | A6000/L40S | مدل ۳۲B–۷۰B | همان |
   مجوز هر مدل جداگانه در SBOM ثبت شود (Qwen2.5/3 عمدتاً Apache-2.0؛ Llama محدودیت دارد).
3. **RAG:** جداول `know.document`, `know.chunk(embedding vector(1024), tsv tsvector, acl_scope)`؛ hybrid retrieval = HNSW cosine + FTS (نرمال‌سازی ی/ک، نیم‌فاصله) با RRF؛ **فیلتر ACL و tenant داخل SQL قبل از top-k** (AT-09)؛ هر پاسخ `retrieval_ids` و citation.
4. **Agent Tools:** `create_lead`, `create_case`, `create_task`, `book_meeting`, `handoff` — هر tool از Core API با token principal (کاربر یا service account محدود کانال) و `ai.tool.execute`؛ side effectهای پرریسک با تأیید انسان. AI هرگز به DB/PBX مستقیم دسترسی ندارد.
5. **Guardrails:** ورودی: طبقه‌بند injection (قاعده + مدل کوچک)، جداسازی محتوای بازیابی‌شده با delimiter و دستور «داده، نه دستور»؛ خروجی: الزام citation برای ادعای fact، ماسک PII، فیلتر سیاست.
6. **Prompt Registry:** `aiml.prompt_version` (draft/candidate/active/retired) — انتشار فقط از مسیر BPM-AI-CHANGE-01 با گیت EVAL.
7. **EVAL service:** Golden Set نسخه‌دار، ۴ داور + checks قطعی، اجرای async روی NATS با pause/resume/cancel/budget، calibration انسانی؛ داور می‌تواند مدل محلی بزرگ‌تر یا متفاوت از هدف باشد؛ Safety بحرانی = صفر خطا. endpointها fail-closed (AT-10).
8. **Observability AI:** هر پاسخ: `model_version`, `prompt_version`, tokens, latency, citations, safety_flags, `correlation_id` (AI-010).
9. STT فارسی (P1): Whisper large-v3 (MIT) روی GPU یا `faster-whisper` CPU؛ ارزیابی کیفیت فارسی پیش از انتخاب.
