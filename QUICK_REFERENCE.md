# Lalelilo - Quick Reference

## 🚀 Quick Start Commands

```bash
# Navigate to project
cd d:\Antigravity\lalelilo

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview & architecture |
| `PROGRESS.md` | Development progress tracking |
| `DAY1_SUMMARY.md` | Day 1 accomplishments |
| `SUPABASE_SETUP.md` | Supabase setup instructions |
| `supabase/schema.sql` | Database schema |
| `lib/types.ts` | TypeScript type definitions |
| `lib/supabase.ts` | Supabase client config |
| `.env.template` | Environment variables template |

---

## 🗄️ Database Tables

1. **clients** - Multi-client support (Lalelilo)
2. **shops** - 30 shop locations
3. **categories** - Product categories
4. **products** - Shared product catalog
5. **inventory** - Per-shop stock levels
6. **orders** - Shop-specific orders
7. **users** - Super admin + shop managers
8. **analytics_daily** - Pre-aggregated metrics

---

## 🔑 Environment Variables

Create `.env.local` from `.env.template`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## 📊 Project Status

**Current Phase:** Day 1 Complete ✅
**Next Phase:** Day 2 - Supabase Setup & APIs
**Overall Progress:** 15%
**Timeline:** 2 weeks (14 days)
**Deadline:** February 12, 2026

---

## 🎯 MVP Features

### ✅ Included
- Multi-shop management (30 shops)
- Super admin dashboard
- Shop admin panels
- Customer ordering
- Inventory tracking
- Order management
- Analytics & reports

### ⏳ Phase 2
- Stock integration
- Social media hub
- Advanced analytics
- AI chatbot

---

## 🔗 Important Links

- **Supabase:** https://supabase.com
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Recharts:** https://recharts.org

---

## 🆘 Common Commands

```bash
# Check project structure
ls -la

# View environment template
cat .env.template

# Check database schema
cat supabase/schema.sql

# View progress
cat PROGRESS.md

# Check dependencies
npm list --depth=0
```

---

## 📞 Support

For questions or issues:
1. Check `README.md` for overview
2. Check `PROGRESS.md` for current status
3. Check `SUPABASE_SETUP.md` for database setup
4. Check `DAY1_SUMMARY.md` for what's been done

---

**Last Updated:** January 29, 2026
**Status:** Ready for Day 2! 🚀
