# MediReach — Frontend

Production-level frontend for **MediReach**, an online pharmacy and medicine delivery platform for Nepal. Built with React, Tailwind CSS, React Router v7, and a full Node.js/Express backend with PostgreSQL.

## Tech stack

- **React 19** (JavaScript)
- **Vite 7** — build tool
- **React Router v7** — routing and protected routes
- **Tailwind CSS** — styling (custom theme: sage green, cream, charcoal)
- **Leaflet + react-leaflet** — real-time order tracking maps
- **Google Fonts** — Fraunces (headings), DM Sans (body)

## Design

- **Colors:** Primary `#4a7c59` (sage), background `#faf8f3` (cream), dark `#1a1f1c` (charcoal), amber for warnings, soft red for alerts
- **UI:** Card-heavy layouts, hover lift on cards, page enter fade-up, skeleton loaders, status transitions
- **Responsive:** Sidebar collapses to hamburger from 768px down

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Requires the backend running at `http://localhost:4000` (see `backend/` folder).

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Routes

### Public

- `/` — Landing (hero, stats, features, CTA)
- `/login` — Login (email/password + Google/Apple OAuth)
- `/register` — 3-step registration wizard
- `/forgot-password` — Request password reset OTP
- `/reset-password` — Enter OTP and set new password

### Customer (`/customer/*`)

- `/customer` — Dashboard (stats, recent orders, quick actions)
- `/customer/medicines` — Medicine catalog (search, filter, sort)
- `/customer/medicines/:id` — Medicine detail + alternatives
- `/customer/cart` — Cart & checkout (address, payment: COD / eSewa)
- `/customer/prescriptions` — Upload prescriptions + past list
- `/customer/track` — Order tracking (real-time map with Leaflet)
- `/customer/orders` — My orders (table, filter by status)
- `/customer/profile` — Profile, address, password, notifications

### Pharmacist (`/pharmacist/*`)

- `/pharmacist` — Dashboard (verify queue, low stock)
- `/pharmacist/inventory` — Inventory table + add/edit medicine modal
- `/pharmacist/verify` — Verify prescriptions (approve/reject + reason)
- `/pharmacist/orders` — Manage orders (status dropdown per row)
- `/pharmacist/profile` — Profile settings

### Admin (`/admin/*`)

- `/admin` — Dashboard (6 stat cards, activity feed)
- `/admin/analytics` — Charts (weekly sales, donut, top medicines, revenue)
- `/admin/users` — User management (Customers / Pharmacists tabs, suspend/delete, add pharmacist)
- `/admin/medicines` — Medicine CRUD table + add/edit modal
- `/admin/orders` — All orders + filters + Export CSV
- `/admin/profile` — Profile settings

## Features

- **Role-based routing** — Protected routes per role; wrong role redirects to correct dashboard
- **Cart** — React Context, persisted in `localStorage`
- **Auth** — JWT access/refresh tokens, Google/Apple OAuth, forgot/reset password with OTP
- **Real-time tracking** — Leaflet maps with delivery simulation, route polylines, ETA
- **MediBot** — FAB bottom-right, slide-up chat; keyword replies (customer only)
- **Toasts** — Success/error popup notifications across all pages
- **Payments** — eSewa integration + Cash on Delivery
- **Shared components** — Modal, Badge, Avatar, StatusBadge, StatCard, EmptyState, Breadcrumb, ProgressBar, QtyControls, UploadZone, LiveTrackingMap
- **Sidebar** — Role-aware nav, active state, cart/prescription badge counts, clickable user chip → profile
- **Top bar** — Page title (from route handle), notification bell, clickable avatar → profile

## Project structure

```
src/
├── components/
│   ├── layout/        # Sidebar, TopBar, DashboardLayout, Footer, MediBot
│   ├── ui/            # Reusable UI components
│   └── ProtectedRoute.jsx
├── context/           # AuthContext, CartContext, ToastContext
├── data/
│   └── constants.js   # Shared enums (ROLES, ORDER_STATUSES, CATEGORIES, etc.)
├── pages/
│   ├── public/        # Landing, Login, Register, ForgotPassword, ResetPassword
│   ├── customer/      # 8 pages
│   ├── pharmacist/    # 5 pages
│   └── admin/         # 6 pages
├── services/
│   └── api.js         # All API calls to the backend
├── App.jsx
├── main.jsx
└── index.css
```
