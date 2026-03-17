# Plugin System

External services (payment providers, print fulfillment) are managed as configurable plugins. Credentials and settings are stored encrypted in the database and configured from **Admin > Settings** — no service-specific environment variables needed.

## How it works

The plugin system has three layers:

1. **Provider implementations** — singleton classes that know how to talk to a specific API (BTCPay, PayPal, Prodigi). Each declares a credential schema and settings schema.
2. **Service configs** — database rows (`service_configs` table) storing encrypted credentials, settings, enabled state, and SKU catalogs per provider.
3. **Registries** — in-memory maps that route requests to the correct provider at runtime.

Credentials are encrypted at rest using AES-256-GCM. The only environment variable needed is `SERVICE_ENCRYPTION_KEY` — a 32-byte hex string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Built-in providers

### Payment providers

#### BTCPay Server

Bitcoin and Lightning payments via a self-hosted BTCPay Server instance.

| Credential | Description                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------- |
| `url`      | BTCPay Server URL (e.g. `https://btcpay.example.com`)                                       |
| `apiKey`   | API key with `btcpay.store.cancreateinvoice` and `btcpay.store.canviewinvoices` permissions |
| `storeId`  | Store ID from the BTCPay dashboard                                                          |

**Webhook URL:** `https://your-domain.com/api/payments/btcpay/webhook`
**Events:** `InvoiceSettled`

See [docs.btcpayserver.org](https://docs.btcpayserver.org/Deployment/) for setup.

#### PayPal

Card and PayPal balance payments via the Orders v2 API.

| Credential     | Description                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `clientId`     | App client ID from [developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox) |
| `clientSecret` | App secret                                                                                             |
| `webhookId`    | Webhook ID (optional, for server-side verification)                                                    |

| Setting   | Description                     |
| --------- | ------------------------------- |
| `sandbox` | Use sandbox API (default: true) |

**Webhook URL:** `https://your-domain.com/api/payments/paypal/webhook`

### Fulfillment providers

#### Prodigi

Print-on-demand fulfillment. No subscription — pay per order.

| Credential | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `apiKey`   | API key from [prodigi.com](https://www.prodigi.com/) dashboard |

| Setting   | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `sandbox` | Use sandbox API — orders won't be printed or charged (default: true) |

**Webhook URL:** `https://your-domain.com/api/fulfillment/prodigi/webhook`

After enabling Prodigi and entering the API key, add print products to its catalog on the settings page. Enter SKU codes from the [Prodigi product catalog](https://www.prodigi.com/products/) along with descriptions:

| SKU                   | Description          |
| --------------------- | -------------------- |
| `GLOBAL-PHO-8x10-FP`  | 8x10 Fine Art Print  |
| `GLOBAL-PHO-16x20-FP` | 16x20 Fine Art Print |
| `GLOBAL-CAN-16x20`    | 16x20 Canvas         |

These are just examples — you can add any SKU that Prodigi supports.

## Admin setup

1. Go to **Admin > Settings**.
2. Expand a provider card and enter its credentials.
3. For fulfillment providers, add print products (SKU + description) to the catalog.
4. Toggle **Enabled** to activate the provider.
5. The checkout page dynamically shows only enabled payment providers.
6. Image print options pull from the combined SKU catalog of all enabled fulfillment services.

Credential fields show "(set - leave blank to keep)" when a value is already stored. Submitting empty credential fields preserves existing values.

## Adding a new provider

### Payment provider

1. Create `apps/api/src/services/providers/your-provider.provider.ts` implementing `PaymentProvider`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentResult,
  WebhookResult,
  CredentialField,
} from './payment-provider.interface';

@Injectable()
export class YourProvider implements PaymentProvider {
  readonly name = 'your-provider';

  readonly credentialSchema: CredentialField[] = [
    { key: 'apiKey', label: 'API Key', type: 'password' },
  ];

  async createPayment(order, credentials, settings): Promise<PaymentResult> {
    // Call your payment API
    return { paymentId: '...', checkoutLink: 'https://...' };
  }

  async handleWebhook(payload, credentials, settings): Promise<WebhookResult> {
    // Parse webhook, return { paid: true, orderId } when payment confirmed
    return {};
  }
}
```

2. Register it in `apps/api/src/services/services.module.ts`:
   - Add to `providers` array
   - Inject in the constructor
   - Call `this.paymentRegistry.register(this.yourProvider)` in `onModuleInit()`

3. Add a seed row in `services.service.ts` `onModuleInit()` (only runs when `service_configs` table is empty).

4. Optionally add a style entry in the frontend checkout page (`PROVIDER_STYLES` map in `apps/web/src/app/checkout/page.tsx`) for the button color and label.

### Fulfillment provider

1. Create a class implementing `FulfillmentProvider`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from './fulfillment-provider.interface';
import { CredentialField, SettingsField } from './payment-provider.interface';

@Injectable()
export class YourFulfillmentProvider implements FulfillmentProvider {
  readonly name = 'your-fulfillment';

  readonly credentialSchema: CredentialField[] = [
    { key: 'apiKey', label: 'API Key', type: 'password' },
  ];

  readonly settingsSchema: SettingsField[] = [
    { key: 'sandbox', label: 'Sandbox Mode', type: 'boolean', default: true },
  ];

  async createFulfillmentOrder(
    imageUrl,
    sku,
    shippingAddress,
    reference,
    credentials,
    settings,
  ): Promise<FulfillmentResult> {
    // Call fulfillment API
    return { id: '...', status: 'created' };
  }

  async handleWebhook(payload, credentials, settings): Promise<FulfillmentWebhookResult> {
    return { orderId: '...', status: '...' };
  }
}
```

2. Register in `services.module.ts` with `this.fulfillmentRegistry.register(...)`.

3. Add a seed row. The SKU catalog starts empty — the admin adds products from the settings page.

## API endpoints

| Method | Path                                     | Auth   | Description                                            |
| ------ | ---------------------------------------- | ------ | ------------------------------------------------------ |
| `GET`  | `/services`                              | Admin  | List all service configs with credential schemas       |
| `PUT`  | `/services/:provider`                    | Admin  | Update credentials, settings, SKUs, enabled state      |
| `GET`  | `/services/payment/enabled`              | Public | Enabled payment providers (for checkout UI)            |
| `GET`  | `/services/fulfillment/skus`             | Public | Combined SKU catalog from enabled fulfillment services |
| `POST` | `/payments/orders/:id/:provider`         | Public | Create a payment                                       |
| `POST` | `/payments/orders/:id/:provider/capture` | Public | Capture a payment (PayPal)                             |
| `POST` | `/payments/:provider/webhook`            | Public | Payment webhook                                        |
| `POST` | `/fulfillment/:provider/webhook`         | Public | Fulfillment webhook                                    |

## Security

- Credentials are encrypted with AES-256-GCM before storage. The encryption key never leaves the server.
- The admin API returns a `maskedCredentials` map (`{ apiKey: true }`) indicating which fields have values, but never returns the actual credentials.
- Settings (non-sensitive config like sandbox toggles) are stored as plain JSONB.
- The `/services/payment/enabled` and `/services/fulfillment/skus` endpoints are public but only return display names and SKU info — no credentials or settings.
