# Hostinger VPS Migration - Configuration Changes Only

## ✅ NO CODE CHANGES REQUIRED

This migration requires **only configuration changes**, not code modifications. The current codebase will work as-is on Hostinger VPS.

---

## 📝 Configuration Changes Required

### 1. Backend CORS Configuration
**File:** `backend/src/index.ts` (lines 528-533)

**Current:**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://acc-kiya-611-pma.vercel.app',
  'https://accounting-app-ttqe.onrender.com'
];
```

**After Migration (add new domain):**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://acc-kiya-611-pma.vercel.app',        // Keep as backup
  'https://accounting-app-ttqe.onrender.com',  // Keep as backup
  'https://your-new-domain.com'                // Add new Hostinger domain
];
```

---

### 2. Backend Environment Variables
**File:** `backend/.env`

**Current:**
```env
DATABASE_URL="postgresql://postgres.gavswcxwqrxjkqtltdgw:o8PDyxVupbLD0WQx@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
JWT_SECRET=supersecretkey
```

**After Migration (on VPS):**
```env
DATABASE_URL="postgresql://accounting_user:your_strong_password@localhost:5432/accounting_app"
JWT_SECRET=your_jwt_secret_here_change_this
NODE_ENV=production
PORT=3001
```

**Note:** Keep the current `.env` file as backup. Create a new `.env` on the VPS.

---

### 3. Frontend Environment Variables
**File:** `frontend/.env.production`

**Current:** (may not exist, uses .env.local)

**After Migration (on VPS):**
```env
NEXT_PUBLIC_API_URL=https://your-new-domain.com
```

**Note:** The fallback system in `frontend/src/lib/api.ts` will still work as a backup if needed.

---

### 4. Frontend API Fallback (No Change Needed)
**File:** `frontend/src/lib/api.ts`

The current fallback system remains unchanged:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const LIVE_API_URL = "https://accounting-app-ttqe.onrender.com";
```

This provides automatic fallback to the current Render backend if the new VPS backend fails.

---

## 🔒 Backup Strategy

### Current Production (Keep Active)
- **Frontend:** https://acc-kiya-611-pma.vercel.app/ (Vercel)
- **Backend:** https://accounting-app-ttqe.onrender.com (Render)
- **Database:** Supabase PostgreSQL

### Migration Process
1. **Deploy to Hostinger VPS** (following the main guide)
2. **Test thoroughly** on new domain
3. **Update DNS** to point to Hostinger VPS
4. **Monitor for 24-48 hours**
5. **Keep current production active** as backup during testing

### Rollback Plan
If issues occur:
- Update DNS to point back to Vercel
- Update frontend `.env` to use Render backend
- No data loss (Supabase remains unchanged)

---

## ✅ Pre-Migration Checklist

- [ ] Hostinger VPS purchased and accessible
- [ ] Domain name ready (or use VPS IP)
- [ ] Read through `HOSTINGER-VPS-DEPLOYMENT-GUIDE.md`
- [ ] Backup current database from Supabase
- [ ] Commit all current code changes to Git
- [ ] Document current production URLs for reference
- [ ] Prepare new strong passwords for database
- [ ] Generate new JWT secret for production

---

## 🚀 Quick Start Summary

1. **Follow the main guide:** `HOSTINGER-VPS-DEPLOYMENT-GUIDE.md`
2. **Update CORS origins** in `backend/src/index.ts` (add new domain)
3. **Create new .env files** on VPS (don't modify local files)
4. **Test thoroughly** before updating DNS
5. **Keep current production active** as backup

---

## 📞 Important Notes

### Security
- Use strong, unique passwords for VPS database
- Generate a new JWT secret (don't use "supersecretkey")
- Enable SSH key authentication
- Keep system updated

### Performance
- VPS with 2GB RAM minimum (4GB recommended)
- Enable Nginx caching
- Use PM2 cluster mode if multiple CPU cores
- Monitor resource usage during first week

### Database Migration
- Export data from Supabase before migration
- Import to VPS PostgreSQL
- Verify all data migrated correctly
- Keep Supabase backup for at least 30 days

---

## 🎯 Migration Timeline Estimate

- **VPS Setup:** 1-2 hours
- **Database Setup:** 1 hour
- **Backend Deployment:** 30 minutes
- **Frontend Deployment:** 30 minutes
- **Database Migration:** 1-2 hours
- **Testing & Verification:** 2-4 hours
- **DNS Update:** 24-48 hours propagation

**Total:** 1-2 days (including DNS propagation)

---

## ✅ Verification Steps After Migration

1. **Backend Health Check:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Frontend Load:**
   ```bash
   curl https://your-domain.com
   ```

3. **Login Test:**
   - Open https://your-domain.com
   - Login with existing credentials
   - Verify dashboard loads

4. **Transaction Test:**
   - Create a test transaction
   - Verify it saves to database
   - Check recent transactions table

5. **All Features Test:**
   - Transactions
   - Accounting
   - Hawala
   - Reports
   - Master Data
   - RBAC

---

**Last Updated:** May 27, 2026
**Status:** Ready for Migration
