# ADR-003 — هویت (Keycloak) و مجوز (RBAC + Scope)

- وضعیت: پیشنهادی
- مرجع: PRD §14، AT-01, 02, 08, 17, 18

## هویت
1. Keycloak 26، یک realm به نام `lavin`. **تصمیم مالک (2026-11-26): یک سازمان، ولی آماده چندسازمانی.** پس: هر کاربر attribute `tenant_id` دارد که به‌صورت claim در token می‌آید؛ همه جداول دامنه `tenant_id` دارند؛ RLS روی `tenant_id` فعال است؛ تنظیمات، secretها، کلیدهای cache و subjectهای NATS با tenant پیشوند می‌خورند. انتقال آینده به realm-per-tenant بدون تغییر schema ممکن است.
2. User Federation: LDAP/LDAPS به AD (`READ_ONLY`، sync دوره‌ای + on-login)؛ group mapper → گروه‌های Keycloak.
3. کاربران محلی در DB خود Keycloak (database جدا `keycloak`)؛ حساب **break-glass** محلی با MFA (TOTP/WebAuthn) اجباری و هشدار در هر ورود (AT-02).
4. MFA اجباری برای نقش‌های `super_admin`, `security_admin`, `system_admin` از طریق Conditional OTP / step-up (`acr`).
5. Clients: `lavin-web` (confidential، Authorization Code + PKCE، BFF)، `lavin-api` (resource server)، service accounts جدا برای `worker`, `channel-gateway`, `cti-gateway`, `eval-service` (client credentials، scope حداقلی).
6. BFF: نشست سمت سرور در Valkey، cookie `__Host-` httpOnly SameSite=Lax؛ access token کوتاه‌عمر (5 دقیقه) و refresh rotation؛ back-channel logout از Keycloak برای revocation.
7. API: اعتبارسنجی JWT (iss, aud=`lavin-api`, exp, JWKS cache با key rotation).

## مجوز
1. **Keycloak فقط Authentication** و گروه/نقش خام. **تصمیم مجوز در `packages/authz`** با داده در Postgres (schema `core`).
2. مدل: `Permission(module.resource.action)` ← `Role` (مجموعه permission) ← `RoleBinding(principal, role, scope_type, scope_id)` ← principal = user | group | service.
3. Scope: `global > tenant > business_unit > team > assigned > own` + `field` (ماسک/حذف فیلد حساس).
4. ارزیابی: union مجوزهای additive؛ **explicit deny** برای داده حساس (ضبط تماس، secrets، PII export) بر allow غلبه می‌کند؛ default deny.
5. اعمال در سه نقطه:
   - **Endpoint guard**: `requirePermission('crm.lead.view')`
   - **Query filter**: تابع `scopeFilter(principal, 'crm.lead.view')` که به WHERE SQL ترجمه می‌شود (+ Postgres RLS به‌عنوان لایه دفاع دوم روی جداول حساس با `SET LOCAL lavin.principal`)
   - **Field filter**: سریالایزر پاسخ با `fieldPolicy`
6. همان enforcement برای WebSocket/SSE (فیلتر هر رویداد)، دانلود فایل (URL امضاشده فقط پس از authz، اعتبار ≤ 5 دقیقه — AT-18)، jobها (اجرا با principal صادرکننده) و AI tools.
7. Cache تصمیم در Valkey با TTL 30s + invalidation event `authz.changed` → اعمال < 60s (AT-17).
8. تغییرات critical RBAC (اعطای `super_admin`، `admin.secrets.*`، `cti.supervise.monitor`، `cti.recording.download`) → **dual approval** با جدول `auth.change_request`.
9. Audit immutable: جدول append-only با hash chain (`prev_hash`)، کاربر DB برنامه فقط INSERT.

## نگاشت AD → Role Template
جدول `auth.group_role_mapping(group_ref, role_id, scope_type, scope_id)` قابل تنظیم از پنل؛ اعمال در login و sync.

جزئیات کامل: `docs/security/permission-matrix.csv`.
