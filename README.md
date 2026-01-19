# JS Fashion Jewellery Billing App

A mobile-first Progressive Web App (PWA) for jewellery shop billing.

## Features

- 📱 **Mobile-first PWA** - Works on any device, installable
- 🔐 **Firebase OTP Authentication** - Secure phone-based login
- 📝 **Invoice Creation** - Create detailed invoices with multiple items
- 💰 **Discount Support** - Apply percentage discounts at invoice level
- 📄 **Luxury PDF Generation** - Beautiful purple & gold themed invoices
- 📤 **WhatsApp Sharing** - Share invoices directly via WhatsApp
- 📊 **Invoice History** - View and manage past invoices
- 📦 **Product Type Management** - CRUD operations for product categories

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Phone OTP)
- **Database**: LocalStorage (can be upgraded to Firestore)
- **PDF Generation**: jsPDF + jspdf-autotable
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Phone Authentication enabled

### Installation

1. Clone the repository:
```bash
cd js_jewels
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:

Create a `.env` file in the root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Phone Authentication** in Authentication > Sign-in method
4. Add your app domain to authorized domains
5. Copy your config to `.env`

## Screens

1. **Login** - Phone number input
2. **OTP Verification** - 6-digit OTP verification
3. **Dashboard** - Quick actions and recent invoices
4. **Customer Info** - Enter customer details
5. **Add Items** - Add jewellery items with type, value, qty
6. **Review Invoice** - Review with discount toggle
7. **Payment Status** - Mark as Paid/Pending
8. **PDF Viewer** - Preview luxury invoice
9. **Share Invoice** - WhatsApp, Email, Copy
10. **History** - All invoices with search/filter
11. **Invoice Details** - View and reshare
12. **Product Types** - Manage product categories

## Branding

- **Internal App**: White + Blue (minimal)
- **PDF Invoice**: Purple (#6B2D5B) + Gold (#D4AF37) (luxury)

## Data Model

```typescript
// Invoice
{
  id: string,
  invoice_id: string,           // "Inv_1736302916890"
  customer_name?: string,
  customer_phone: string,
  customer_address?: string,
  items: [{
    type: string,               // "Ear Ring"
    value: number,              // 900
    qty: number                 // 1
  }],
  subtotal: number,
  discount_percent: number,
  discount_amount: number,
  total: number,
  status: 'paid' | 'pending',
  created_at: number,           // epoch ms
  updated_at: number
}

// Product Type
{
  id: string,
  name: string                  // "Ear Ring"
}
```

## License

MIT
