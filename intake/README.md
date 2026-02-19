# Ontyx Business Intake System

## How It Works

1. Business owner fills form at `ontyx.ca/configure`
2. Request saved as JSON in `pending/`
3. Ion reviews and processes requests
4. Processed requests moved to `processed/`

## Request Format

```json
{
  "id": "req_xxx",
  "created_at": "2026-02-19T...",
  "status": "pending",
  "business": {
    "name": "Acme Corp",
    "type": "retail",
    "location": "Toronto, ON",
    "employees": 5,
    "email": "owner@acme.com",
    "phone": "416-555-1234"
  },
  "requirements": {
    "modules": ["pos", "inventory", "invoicing"],
    "industry_vertical": "retail",
    "custom_workflow": "We need..."
  },
  "integrations": {
    "banking": true,
    "payroll": true,
    "accounting": false
  }
}
```

## Templates

- `pharmacy.json` — DIN tracking, NAPRA
- `salon.json` — Appointments, booking
- `auto-shop.json` — VIN lookup, work orders
- `clinic.json` — OHIP billing, patients
- `restaurant.json` — Table mgmt, kitchen display
- `retail.json` — POS, loyalty, barcode
- `contractor.json` — Field service, GPS
- `wholesaler.json` — B2B, volume pricing

## Ion's Process

1. Read request from `pending/`
2. Match to industry template
3. Configure organization settings
4. Enable required modules
5. Apply custom workflows
6. Notify business owner
7. Move to `processed/`
