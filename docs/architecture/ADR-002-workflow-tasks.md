# ADR-002 — Flowable، Tasks و کانبان

- وضعیت: پیشنهادی
- مرجع: PRD §10، AT-06، AT-07

## تصمیم
1. **Flowable OSS 7.x Engine** (BPMN + DMN + CMMN غیرفعال) در کانتینر Spring Boot با REST؛ database جدا `flowable` (خارج از schemaهای اپ)؛ فقط از شبکه داخلی و فقط از `workflow-facade` قابل دسترس.
2. **workflow-facade** (ماژول Core): `startProcess`, `completeTask`, `claim`, `delegate`, `requestTransition`, `deployDefinition`, `listDefinitions`. هیچ ماژول دیگری Flowable را مستقیم صدا نمی‌زند.
3. **مدل تسک یکپارچه:** جدول `task.task` شامل هر دو نوع:
   - `kind = 'standalone'` — تسک مستقل (مالک: ماژول tasks)
   - `kind = 'bpm'` — projection از human task Flowable (`flowable_task_id`)؛ مالک: Flowable
4. **قانون انتقال (§10.2):** Drag&Drop → `POST /tasks/{id}/transition {targetColumnId, expectedVersion}` →
   authz (`tasks.task.transition` + scope) → اگر `kind=bpm`: نگاشت ستون به `outcome` مجاز در تعریف BPMN (`extensionElements: lavin:columnOutcome`) و `completeTask`؛ اگر رد شد → `409 TRANSITION_REJECTED` و UI به وضعیت سرور برمی‌گردد. optimistic locking با `version`.
5. **Event bridge:** Flowable `FlowableEventListener` سفارشی (Java، کوچک) رویدادهای `TASK_CREATED/COMPLETED/ASSIGNED`, `PROCESS_COMPLETED`, `TIMER_FIRED` را در جدول outbox در **همان تراکنش Flowable** می‌نویسد → relay به NATS → projection تسک. (جلوگیری از polling و گم‌شدن رویداد.)
6. **طراح BPMN/DMN (بازنگری 2026-11-26: مالک watermark bpmn.io را نپذیرفت، پس bpmn-js/dmn-js استفاده نمی‌شوند):**
   - گزینه A (پیش‌فرض، کم‌ریسک): طراح خودی با **React Flow (MIT) + bpmn-moddle/dmn-moddle (MIT) + dagre (MIT)** فقط برای subset پشتیبانی‌شده؛ خروجی XML استاندارد BPMN 2.0 با DI.
   - گزینه B (PoC در Sprint 0): ویرایشگرهای standalone **Apache KIE** (Apache-2.0)؛ فقط اگر XML خروجی بدون تغییر روی Flowable deploy شود.
   - DMN در MVP: ویرایشگر جدولی خودی (decision table) با خروجی DMN 1.3 از dmn-moddle.
   - (متن اولیه، منسوخ:) bpmn-js + dmn-js درون Next.js با properties panel سفارشی برای subset پشتیبانی‌شده (userTask، serviceTask→`lavin:action`، exclusive/parallel gateway، timer boundary، message start، call activity). Import/Export XML استاندارد. چرخه: Draft → Validate (lint + schema) → Simulate (اجرای خشک با داده نمونه) → Approve (`bpm.definition.deploy`) → Deploy → Rollback (deploy نسخه قبلی + migration instanceها اختیاری).
7. **Service task**ها با `external worker` Flowable (REST pull) در `apps/worker` اجرا می‌شوند؛ هیچ JavaDelegate با منطق دامنه در Flowable نیست.
8. **SLA و escalation** با timer boundary event؛ اعلان از worker؛ idempotent با کلید `(process_instance, timer_id)` (AT-07: escalation یک‌بار).

## فرایندهای P0 (در `workflows/bpmns/`)
`BPM-LEAD-01`, `BPM-CONTENT-01`, `BPM-COMPLAINT-01`, `BPM-QUOTE-01`, `BPM-AI-CHANGE-01` + DMN: `lead-routing`, `complaint-severity`, `discount-approval`.
