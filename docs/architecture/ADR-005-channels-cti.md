# ADR-005 — Channel Gateway و CTI Gateway

- وضعیت: پیشنهادی
- مرجع: PRD §8، §9، AT-03, 04, 05, 13, 14, 18

## Channel Gateway (`services/channel-gateway`)
1. رابط `ChannelConnector` دقیقاً مطابق §8.1: `connect, health, verifyInbound, receive, sendText, sendMedia, listCapabilities, refreshCredentials, handleRateLimit, disconnect`؛ قابلیت ناموجود → `UNSUPPORTED_CAPABILITY`.
2. Driverها: `telegram`, `bale` (Bot API شبیه Telegram، base URL `tapi.bale.ai`)، `rubika` (`botapi.rubika.ir/v3/{token}/{method}`؛ webhook یا polling)، `email` (SMTP/IMAP)، `webchat`.
3. **مسیر ورودی:** `POST /api/v1/channels/{provider}/webhook/{accountAlias}` روی ingress عمومی جدا →
   (۱) تطبیق alias با secret path تصادفی ۳۲ بایتی + header secret در صورت پشتیبانی (`X-Telegram-Bot-Api-Secret-Token` برای Telegram/Bale) → (۲) اعتبارسنجی schema → (۳) `INSERT … ON CONFLICT DO NOTHING` در `chnl.message` (ایندکس یکتای `(tenant_id, account_id, external_message_id)`) → (۴) پاسخ 200 در < 100ms → (۵) پردازش async از NATS. (AT-03)
   روبیکا: چون امضا مستند نیست، علاوه بر secret path: IP allowlist اختیاری، پنجره ضدبازپخش بر اساس timestamp/`message_id`، ادعای signature verification ممنوع.
4. **مسیر خروجی:** فقط از outbox (`message.send.requested`) → driver → `DeliveryReceipt` واقعی؛ کلید idempotency `(conversation, client_msg_id)` برای جلوگیری از ارسال دوباره پس از crash (AT-13).
5. Rate limit توزیع‌شده در Valkey per account؛ circuit breaker per channel (KPI-09).
6. **Capability matrix** per account در DB، با `verified_at`؛ قابلیت تأییدنشده خاموش. انتشار در کانال (channel-post) برای Bale/Rubika: فقط پس از تست واقعی با bot ادمین؛ وگرنه `manual_handoff` (AT-04، MKT-007).
7. تغییر تنظیمات کانال: نسخه جدید `pending` → test connection → در صورت موفقیت `active` و قبلی `superseded`؛ در صورت شکست نسخه قبلی فعال می‌ماند (AT-14).
8. Identity resolution: `ContactIdentity(channel, external_user_id) → contact_id` با `confidence` و `verified_by`؛ ادغام خودکار ممنوع.

## CTI Gateway (`services/cti-gateway`)
1. یک **PbxConnection** per instance (`pbx_instance_id`)، هر کدام worker مستقل با اتصال AMI پایدار (TCP/TLS)، reconnect با exponential backoff + jitter، heartbeat `Ping`.
2. Driver interface `PbxDriver`: `subscribeEvents, originate, transfer, hangup, getQueueStatus, getAgentState, health`؛ `AsteriskAmiDriver` (رویدادها: `Newchannel, Newstate, DialBegin/End, BridgeEnter/Leave, Hangup, QueueCallerJoin/Leave, AgentConnect, Cdr, Cel`) و `AsteriskAriDriver` (اختیاری، برای call-control). PBX غیرAsterisk = driver جدید بدون تغییر CRM/BPM (CTI-010).
3. **حساب‌ها:** AMI read-only (`read=call,agent,cdr,reporting`) برای رویداد؛ حساب جدا با `write=originate` فقط برای click-to-call.
4. **هم‌بستگی تماس:** کلید `(pbx_instance_id, linkedid)` = Call؛ هر `uniqueid` = CallLeg؛ event_id = hash(`pbx_instance_id`, `uniqueid`, event, timestamp, seq). dedupe در inbox؛ ordering منطقی با `aggregate_version` (AT-05).
5. **Screen pop:** نرمال‌سازی شماره (E.164، `+98`/`0`)، جست‌وجو در `ContactIdentity(type=phone)`، نتیجه از طریق SSE فقط به agent همان extension و فقط فیلدهای مجاز (`cti.call.view` + field policy).
6. **ضبط:** فقط `RecordingRef` (مسیر فایل روی PBX یا کپی رمزگذاری‌شده در SeaweedFS)؛ دانلود با URL امضاشده پس از `cti.recording.view/download` + explicit-deny check (AT-18)؛ retention policy.
7. شبکه: cti-gateway تنها جزء با دسترسی به VLAN تلفن؛ AMI/ARI هرگز روی شبکه عمومی.
8. تست مرجع: دو کانتینر Asterisk 20 آزمایشی با dialplan تولید تماس خودکار (SIPp) در CI integration.
