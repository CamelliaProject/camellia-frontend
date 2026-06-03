# Camellia Ceylon Platform — Frontend

A web application for browsing, booking, and reviewing Sri Lankan tea plantation experiences. Includes role-based dashboards for Tourists, Plantation Admins, and the Super Admin.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Authentication | Firebase Auth |

---

## Features

- Browse and explore Sri Lankan tea plantations
- Book plantation experiences with PayHere payment integration
- Submit and view reviews with image uploads
- Tourist dashboard — manage bookings and reviews
- Plantation Admin dashboard — manage plantation details, experiences, bookings, and media
- Super Admin dashboard — approve plantation requests, manage subscriptions

---

## User Roles

| Role | Capabilities |
|------|-------------|
| Tourist | Browse plantations, book experiences, write reviews |
| Plantation Admin | Manage plantation profile, experiences, bookings, and media |
| Super Admin | Approve/reject plantation requests, manage all plantations and subscriptions |

---

## Project Structure

```
src/
├── components/       # Shared UI components (layout, reviews)
├── context/          # Global auth state
├── features/
│   ├── auth/         # Login pages, plantation request, subscription flows
│   ├── tourist/      # Landing, plantations, booking, dashboard, reviews
│   ├── plantation-admin/  # Plantation admin dashboard & management
│   └── super-admin/  # Super admin dashboard & approvals
├── services/         # API client and helper functions
└── utils/            # Shared utility functions
```

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
VITE_API_URL=

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

# Start development server
npm run dev

# Production build
npm run build
```

> Ensure the backend server is running before starting the frontend.

---

## Authentication

Tourists authenticate via Firebase (Google or Email/Password). Plantation Admins and Super Admins log in with username and password credentials issued by the platform.
