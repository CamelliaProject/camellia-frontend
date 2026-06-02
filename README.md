# Camellia Ceylon Platform — Frontend

Tourist-facing web application for browsing, booking, and reviewing Sri Lankan tea plantation experiences. Also includes dashboards for Plantation Admins and the Super Admin.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Authentication | Firebase Auth (Google / Email) |

---

## Project Structure

```
src/
├── components/
│   ├── layout/         # Navbar, Footer, SignIn modal
│   ├── reviews/        # ReviewReplies component
│   └── sections/       # Legacy, Services sections
├── context/
│   └── AuthContext.tsx # Global auth state (Firebase)
├── features/
│   ├── auth/           # Login pages, plantation request, subscription flows
│   ├── tourist/        # Landing, plantations, booking, dashboard, reviews
│   ├── plantation-admin/ # Plantation admin dashboard & management pages
│   └── super-admin/    # Super admin dashboard & plantation approval
├── services/
│   ├── apiClient.ts    # Axios instance with Firebase token interceptor
│   ├── api.ts          # API helper functions
│   └── reviewService.ts
└── firebase.ts         # Firebase app initialisation
```

---

## Pages & Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Landing page | Public |
| `/plantations` | Browse all plantations | Public |
| `/plantation/:id` | Plantation detail | Public |
| `/plantation/:id/reviews` | Plantation reviews | Public |
| `/plantation/:id/booking` | Book a visit | Public |
| `/about` | About page | Public |
| `/contact` | Contact page | Public |
| `/dashboard` | Tourist dashboard (bookings, reviews) | Tourist |
| `/login` | Tourist login | Public |
| `/plantation-admin/dashboard` | Plantation admin dashboard | Plantation Admin |
| `/plantation-admin/change-password` | Change password | Plantation Admin |
| `/super-admin/dashboard` | Super admin dashboard | Super Admin |
| `/plantationadmin` | Plantation admin login | Public |
| `/superadmin` | Super admin login | Public |
| `/plantation-request` | Apply to join as plantation | Public |
| `/payment` | Payment page | Tourist |
| `/payment-return` | Payment result page | Tourist |
| `/booking-confirmation` | Booking confirmed page | Tourist |
| `/subscription-payment` | Subscription checkout | Plantation Admin |
| `/subscription-payment-return` | Subscription payment result | Plantation Admin |
| `/subscription-renew` | Renew subscription | Plantation Admin |
| `/subscription-renew-return` | Renewal result | Plantation Admin |

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build
```

> The backend must be running on `http://localhost:5000` before starting the frontend.

---

## User Roles

| Role | Login Path | Capabilities |
|------|-----------|--------------|
| Tourist | `/login` | Browse plantations, book experiences, write reviews |
| Plantation Admin | `/plantationadmin` | Manage plantation details, bookings, experiences, media |
| Super Admin | `/superadmin` | Approve/reject plantation requests, manage all users |

---

## Contact

**camelliaceylonplatform@gmail.com**
