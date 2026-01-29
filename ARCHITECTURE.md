# Lalelilo System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LALELILO PLATFORM                        │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CUSTOMER   │  │ SHOP ADMIN   │  │ SUPER ADMIN  │
│   FRONTEND   │  │   PANEL      │  │  DASHBOARD   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   NEXT.JS API   │
                  │     ROUTES      │
                  └─────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    SUPABASE     │
                  │   (PostgreSQL)  │
                  └─────────────────┘
```

---

## 📊 Data Flow

### Customer Order Flow:
```
Customer → Selects Location (CEP) → Views Products → Adds to Cart
    → Checkout → Payment → Order Created → Assigned to Shop
    → Shop Admin Receives → Prepares Order → Updates Status
    → Customer Notified (WhatsApp) → Order Delivered
```

### Inventory Flow:
```
Product Created (Super Admin) → Added to Catalog
    → Shop Admin Sets Stock Level → Inventory Tracked
    → Order Placed → Stock Decremented → Low Stock Alert
    → Shop Admin Restocks → Inventory Updated
```

### Analytics Flow:
```
Orders Created → Daily Aggregation Job → analytics_daily Table
    → Super Admin Dashboard → Charts & Reports → Export
```

---

## 🗄️ Database Relationships

```
clients (1)
    │
    ├─── shops (30)
    │      │
    │      ├─── inventory (products × shops)
    │      │
    │      ├─── orders
    │      │
    │      └─── analytics_daily
    │
    ├─── categories
    │      │
    │      └─── products
    │             │
    │             └─── inventory
    │
    └─── users
           │
           ├─── super_admin (sees all shops)
           │
           └─── shop_admin (sees own shop only)
```

---

## 🎯 User Roles & Permissions

### Super Admin
- ✅ View all 30 shops
- ✅ Manage all products
- ✅ View all orders
- ✅ Access analytics dashboard
- ✅ Create/edit shops
- ✅ Manage users
- ✅ Export reports

### Shop Admin
- ✅ View own shop only
- ✅ Manage own inventory
- ✅ View own orders
- ✅ Update order status
- ✅ View own analytics
- ❌ Cannot see other shops
- ❌ Cannot create products (uses catalog)

### Customer
- ✅ Browse products
- ✅ Select shop by location
- ✅ Place orders
- ✅ Track order status
- ❌ No admin access

---

## 🔄 API Routes Structure

```
/api
├── /shops
│   ├── GET    - List all shops
│   ├── POST   - Create shop (super admin)
│   ├── /[id]
│   │   ├── GET    - Get shop details
│   │   ├── PUT    - Update shop
│   │   └── DELETE - Delete shop
│
├── /products
│   ├── GET    - List products
│   ├── POST   - Create product (super admin)
│   ├── /[id]
│   │   ├── GET    - Get product
│   │   ├── PUT    - Update product
│   │   └── DELETE - Delete product
│
├── /orders
│   ├── GET    - List orders (filtered by role)
│   ├── POST   - Create order (customer)
│   ├── /[id]
│   │   ├── GET    - Get order
│   │   ├── PUT    - Update order status
│   │   └── DELETE - Cancel order
│
├── /inventory
│   ├── GET    - Get inventory (by shop)
│   ├── PUT    - Update stock levels
│   └── /low-stock - Get low stock alerts
│
└── /analytics
    ├── /dashboard - Super admin metrics
    ├── /shop/[id] - Shop-specific metrics
    └── /export    - Export reports
```

---

## 🎨 Frontend Structure

```
app/
├── (public)/              # Customer-facing
│   ├── page.tsx          # Homepage
│   ├── produtos/         # Product catalog
│   ├── checkout/         # Checkout flow
│   └── [shop-slug]/      # Shop-specific pages
│
├── dashboard/            # Super Admin
│   ├── page.tsx         # Overview
│   ├── analytics/       # Charts & reports
│   ├── shops/           # Shop management
│   ├── products/        # Product management
│   └── orders/          # All orders
│
└── shop-admin/          # Shop Admin
    └── [shop-id]/
        ├── page.tsx     # Dashboard
        ├── orders/      # Shop orders
        ├── inventory/   # Stock management
        └── settings/    # Shop settings
```

---

## 🔐 Security Layers

```
1. Row Level Security (RLS) - Database level
   └── Shop admins can only see their shop data
   
2. API Route Protection - Application level
   └── JWT token validation
   
3. Role-Based Access Control (RBAC)
   └── super_admin > shop_admin > customer
   
4. Environment Variables
   └── Secrets never exposed to client
```

---

## 📱 Responsive Design

```
Desktop (>1024px)
├── Full dashboard with sidebar
├── Multi-column layouts
└── Advanced charts

Tablet (768px - 1024px)
├── Collapsible sidebar
├── Two-column layouts
└── Simplified charts

Mobile (<768px)
├── Bottom navigation
├── Single-column layouts
└── Touch-optimized UI
```

---

## 🚀 Deployment Architecture

```
┌─────────────────┐
│   VERCEL        │  ← Next.js App
│   (Frontend +   │
│    API Routes)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SUPABASE      │  ← Database + Storage
│   (PostgreSQL + │
│    File Storage)│
└─────────────────┘
```

---

## 📊 Performance Optimization

### Database
- ✅ Indexes on frequently queried columns
- ✅ Pre-aggregated analytics (analytics_daily)
- ✅ Connection pooling (Supabase)

### Frontend
- ✅ Server-side rendering (Next.js)
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting (automatic)
- ✅ Caching strategies

### API
- ✅ Response caching
- ✅ Pagination for large datasets
- ✅ Lazy loading

---

## 🔄 Real-Time Features

```
Order Status Updates
    └── Supabase Realtime Subscriptions
        └── Dashboard auto-updates
        
Inventory Changes
    └── Optimistic UI updates
        └── Background sync
        
Analytics
    └── Polling every 30 seconds
        └── Or manual refresh
```

---

## 📈 Scalability Plan

### Current (MVP)
- 30 shops
- ~1000 products
- ~500 orders/day
- Free tier sufficient

### Future (Growth)
- 100+ shops
- ~5000 products
- ~2000 orders/day
- Upgrade to Supabase Pro ($25/mo)

---

**Architecture Version:** 1.0
**Last Updated:** January 29, 2026
**Status:** Designed & Ready for Implementation
