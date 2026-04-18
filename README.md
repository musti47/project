# PayBite QR Restaurant Ordering & Payment System

Bu repo restoranlar için QR sipariş, masa session yönetimi, hesap isteme ve ödeme lifecycle akışını içerir.

## Düzeltilen ana mimari

- **QR token = kalıcı masa kimliği**
- **Session = geçici müşteri oturumu**
- Siparişler ve ödemeler **session bazlı** ilerler
- Kritik ödeme / sipariş işlemlerinde **backend source of truth** çalışır
- `Session CLOSED` ise yeni sipariş / ödeme / hesap işlemi yapılamaz
- `paymentEnabled = false` ise müşteri ödeme başlatamaz
- `remainingAmount = 0` olduğunda session lifecycle kapanır, masa `DIRTY` durumuna geçer
- Masa temizlenmeden yeni müşteri session'ı açılamaz
- Duplicate order / payment için **idempotency** desteği vardır

## Proje yapısı

- `src/` → NestJS backend
- `paybite-web/` → müşteri QR web uygulaması
- `paybite-store/` → garson / admin paneli
- `prisma/` → veritabanı şeması

## Ortam değişkenleri

Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın.

Örnek:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paybite?schema=public"
PORT=3000
JWT_SECRET="change-me-in-production"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174"
```

Frontend için:

`paybite-web/.env`
```env
VITE_API_URL=http://localhost:3000
```

`paybite-store/.env`
```env
VITE_API_URL=http://localhost:3000
```

## Backend çalıştırma

```bash
cd project-root
npm install
npm run prisma:generate
npm run db:push
npm run build
npm run start:dev
```

## Frontend çalıştırma

Müşteri paneli:
```bash
cd paybite-web
npm install
npm run dev
```

Garson / admin paneli:
```bash
cd paybite-store
npm install
npm run dev
```

## Kritik backend endpoint akışları

### Müşteri tarafı
- `POST /sessions/from-table-token`
- `GET /sessions/:sessionId`
- `GET /menu?restaurantId=:restaurantId`
- `GET /orders/session/:sessionId`
- `GET /bill/session/:sessionId`
- `POST /orders/customer`
- `POST /tables/public/request-bill`
- `POST /payments/customer/custom`
- `POST /payments/customer/items`
- `POST /payments/customer/split/equal`
- `GET /payments/session/:sessionId/pending-splits`
- `POST /payments/customer/split/:paymentId/pay`

### Garson / admin tarafı
JWT gereklidir.
- `GET /auth/me`
- `GET /tables`
- `POST /sessions`
- `POST /orders`
- `POST /orders/:orderId/items`
- `PATCH /orders/:id/status`
- `PATCH /tables/:id/enable-payment`
- `PATCH /tables/:id/disable-payment`
- `PATCH /tables/:id/close-bill`
- `PATCH /tables/:id/clean`
- `POST /payments/table/:tableId/manual-custom`
- `POST /payments/table/:tableId/manual-settlement`
- `POST /payments/:id/manual`
- `PATCH /payments/table/:tableId/cancel-split`
- `GET /restaurants/me/settings`
- `PATCH /restaurants/me/settings`

## Notlar

- Customer frontend artık korumalı `/tables` endpoint’ine bağımlı değildir.
- Session / order / payment state çakışmaları backend finansal hesaplama üzerinden normalize edilmiştir.
- Hesap tam kapandığında session kapanır ve masa temizlik akışına geçer.
- Exception’lar global filter ile kontrollü JSON cevap verir; backend crash etmez.
- Prod ortamında mutlaka güçlü `JWT_SECRET`, gerçek payment provider, rate limit ve merkezi loglama ekleyin.
