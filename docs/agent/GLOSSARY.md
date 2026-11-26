# Glossary (use these exact terms in code)

| Term (code) | فارسی | Meaning |
|---|---|---|
| tenant | سازمان | Top-level organisation. One today; multi-tenant ready. |
| businessUnit | واحد کسب‌وکار | Division/branch inside a tenant. |
| team | تیم | Group of users; main RBAC scope. |
| principal | کاربر/سرویس | Authenticated user or service account. |
| permission | مجوز | `module.resource.action`, e.g. `crm.lead.view`. |
| scope | دامنه دسترسی | `tenant \| business_unit \| team \| assigned \| own`. |
| lead | سرنخ | Unqualified prospect. |
| account | حساب/شرکت | Customer company (CRM). Not a channel account. |
| contact | مخاطب | Person in CRM. |
| identity | هویت کانالی | Phone/Bale/Rubika/email id linked to a contact with confidence. |
| deal | فرصت فروش | Opportunity in a pipeline stage. |
| ticket | پرونده پشتیبانی | Support case or complaint (`care.ticket`). PRD calls it Case. |
| board / column / task | برد / ستون / تسک | Kanban. `kind = standalone \| bpm`. |
| transition | انتقال | Requested move of a task/deal; validated server-side. |
| processDefinition / processInstance | تعریف/نمونه فرایند | Flowable BPMN. |
| channelAccount | حساب کانال | A bot/mailbox on Bale, Rubika, Telegram, email, webchat. |
| conversation / message | گفتگو / پیام | Unified inbox. |
| pbxConnection / call / leg | اتصال مرکز تلفن / تماس / بخش تماس | CTI. |
| brandCore | هسته برند | Versioned brand profile (Payload). |
| outbox / inbox | صف خروجی/ورودی رویداد | Reliable events (`evnt` schema). |
| correlationId | شناسه پیگیری | Request trace id across services. |
