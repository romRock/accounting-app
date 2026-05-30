# Hostinger VPS Deployment Guide - Accounting App

## 📋 Overview
Complete migration guide to deploy accounting-app (frontend + backend + database) on Hostinger VPS.

**Current Production:**
- Frontend: https://acc-kiya-611-pma.vercel.app/ (Vercel)
- Backend: https://accounting-app-ttqe.onrender.com (Render)
- Database: Supabase PostgreSQL

**Target:**
- All components on Hostinger VPS
- No code changes required
- Current setup remains as backup

---

## 🎯 Prerequisites

### Hostinger VPS Requirements
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS
- **RAM:** Minimum 2GB (4GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Storage:** 40GB SSD
- **Root access**

### Required Software
- Node.js 20.x or higher
- PostgreSQL 14 or higher
- Nginx (reverse proxy)
- PM2 (process manager)
- Git
- SSL certificate (Let's Encrypt)

---

## 🚀 Phase 1: VPS Initial Setup

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip-address
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Install Essential Packages
```bash
apt install -y curl wget git unzip build-essential
```

### 1.4 Set Timezone (Optional)
```bash
timedatectl set-timezone Asia/Kolkata
```

### 1.5 Create Non-Root User (Recommended)
```bash
adduser accounting
usermod -aG sudo accounting
```

### 1.6 Setup SSH Key for Non-Root User
```bash
# On your local machine
ssh-copy-id accounting@your-vps-ip-address
```

---

## 🗄️ Phase 2: PostgreSQL Database Setup

### 2.1 Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
```

### 2.2 Start PostgreSQL Service
```bash
systemctl start postgresql
systemctl enable postgresql
```

### 2.3 Create Database and User
```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE accounting_app;

-- Create user with password
CREATE USER accounting_user WITH PASSWORD 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE accounting_app TO accounting_user;

-- Exit
\q
```

### 2.4 Configure PostgreSQL for Remote Access
```bash
nano /etc/postgresql/14/main/postgresql.conf
```

Add/modify:
```
listen_addresses = 'localhost'
```

```bash
nano /etc/postgresql/14/main/pg_hba.conf
```

Add line:
```
host    accounting_app    accounting_user    127.0.0.1/32    scram-sha-256
```

### 2.5 Restart PostgreSQL
```bash
systemctl restart postgresql
```

### 2.6 Test Connection
```bash
sudo -u postgres psql -d accounting_app -U accounting_user -h localhost
```

---

## 🔧 Phase 3: Node.js Installation

### 3.1 Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3.2 Verify Installation
```bash
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### 3.3 Install PM2 Globally
```bash
npm install -g pm2
```

### 3.4 Setup PM2 Startup
```bash
pm2 startup
pm2 save
```

---

## 🌐 Phase 4: Nginx Reverse Proxy Setup

### 4.1 Install Nginx
```bash
apt install -y nginx
```

### 4.2 Start Nginx
```bash
systemctl start nginx
systemctl enable nginx
```

### 4.3 Configure Firewall
```bash
ufw allow 'Nginx Full'
ufw allow ssh
ufw enable
```

### 4.4 Create Nginx Configuration for Frontend
```bash
nano /etc/nginx/sites-available/accounting-frontend
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.5 Enable Configuration
```bash
ln -s /etc/nginx/sites-available/accounting-frontend /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 🔒 Phase 5: SSL Certificate Setup

### 5.1 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5.3 Auto-Renewal Setup
```bash
certbot renew --dry-run
```

(Certbot automatically sets up cron job for renewal)

---

## 📦 Phase 6: Backend Deployment

### 6.1 Clone Repository
```bash
cd /var/www
git clone https://github.com/your-username/accounting-app.git
cd accounting-app/backend
```

### 6.2 Install Dependencies
```bash
npm install
```

### 6.3 Create Environment File
```bash
nano .env
```

Add:
```env
DATABASE_URL="postgresql://accounting_user:your_strong_password_here@localhost:5432/accounting_app"
JWT_SECRET=your_jwt_secret_here_change_this
NODE_ENV=production
PORT=3001
```

### 6.4 Generate Prisma Client
```bash
npx prisma generate
```

### 6.5 Run Database Migrations
```bash
npx prisma db push
```

### 6.6 Seed Database (Production Data)
```bash
# Seed cities
npm run db:seed:cities:production

# Seed clients
npm run db:seed:clients:production

# Seed roles
npm run db:seed:roles:production

# Seed users
npm run db:seed:users:production
```

### 6.7 Build Backend
```bash
npm run build
```

### 6.8 Start Backend with PM2
```bash
pm2 start dist/index.js --name accounting-backend
pm2 save
```

### 6.9 Verify Backend
```bash
pm2 status
pm2 logs accounting-backend
```

---

## 🎨 Phase 7: Frontend Deployment

### 7.1 Navigate to Frontend Directory
```bash
cd /var/www/accounting-app/frontend
```

### 7.2 Install Dependencies
```bash
npm install
```

### 7.3 Create Environment File
```bash
nano .env.production
```

Add:
```env
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 7.4 Build Frontend
```bash
npm run build
```

### 7.5 Start Frontend with PM2
```bash
pm2 start npm --name accounting-frontend -- start
pm2 save
```

### 7.6 Verify Frontend
```bash
pm2 status
pm2 logs accounting-frontend
```

---

## 🔄 Phase 8: Database Migration from Supabase

### 8.1 Export Data from Supabase
```bash
# On your local machine
pg_dump -h aws-1-ap-southeast-2.pooler.supabase.com -U postgres.gavswcxwqrxjkqtltdgw -d postgres > supabase_backup.sql
```

### 8.2 Transfer Backup to VPS
```bash
scp supabase_backup.sql accounting@your-vps-ip:/home/accounting/
```

### 8.3 Import Data to VPS PostgreSQL
```bash
# On VPS
sudo -u postgres psql accounting_app < /home/accounting/supabase_backup.sql
```

### 8.4 Verify Data Migration
```bash
sudo -u postgres psql -d accounting_app
```

```sql
-- Check tables
\dt

-- Check user count
SELECT COUNT(*) FROM "users";

-- Check transaction count
SELECT COUNT(*) FROM "Transaction";

-- Exit
\q
```

---

## 🧪 Phase 9: Testing & Verification

### 9.1 Test Backend API
```bash
curl http://localhost:3001/api/health
# Or test specific endpoint
curl http://localhost:3001/api/roles
```

### 9.2 Test Frontend
```bash
curl http://localhost:3000
```

### 9.3 Test Domain Access
```bash
# From your local machine
curl https://your-domain.com
curl https://your-domain.com/api/roles
```

### 9.4 Test Login Functionality
- Open https://your-domain.com in browser
- Try to login with existing credentials
- Verify dashboard loads correctly

### 9.5 Test Transaction Creation
- Create a test transaction
- Verify it saves to database
- Check recent transactions table

---

## 📊 Phase 10: Monitoring & Maintenance

### 10.1 PM2 Monitoring
```bash
pm2 monit
pm2 status
pm2 logs
```

### 10.2 Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 10.3 PostgreSQL Logs
```bash
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 10.4 System Resources
```bash
htop
df -h
free -m
```

---

## 💾 Phase 11: Backup Strategy

### 11.1 Automated Database Backups
Create backup script:
```bash
nano /home/accounting/backup-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/accounting/backups"
mkdir -p $BACKUP_DIR

pg_dump -U accounting_user accounting_app > $BACKUP_DIR/accounting_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "accounting_*.sql" -mtime +7 -delete
```

Make executable:
```bash
chmod +x /home/accounting/backup-db.sh
```

Add to cron (daily at 2 AM):
```bash
crontab -e
```

Add:
```
0 2 * * * /home/accounting/backup-db.sh
```

### 11.2 Code Repository Backup
- Keep current Vercel/Render deployments as backup
- Git repository serves as code backup
- Regular commits to GitHub

---

## 🔄 Phase 12: Rollback Plan

### If Migration Fails:

**Option 1: Revert to Current Production**
- Update DNS to point back to Vercel (frontend)
- Update frontend .env to use Render backend
- No data loss (Supabase remains unchanged)

**Option 2: Fix VPS Issues**
- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Check PostgreSQL: `systemctl status postgresql`
- Restart services: `pm2 restart all && systemctl restart nginx`

**Option 3: Database Rollback**
- Restore from backup: `psql accounting_app < backup_file.sql`
- Or reconnect to Supabase by updating DATABASE_URL

---

## 📝 Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL="postgresql://accounting_user:password@localhost:5432/accounting_app"
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
PORT=3001
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-domain.com
```

---

## ✅ Pre-Deployment Checklist

- [ ] VPS purchased and accessible
- [ ] Domain pointed to VPS IP address
- [ ] PostgreSQL installed and configured
- [ ] Node.js 20.x installed
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Backend code deployed and tested
- [ ] Frontend code deployed and tested
- [ ] Database migrated and verified
- [ ] All environment variables set
- [ ] PM2 processes running
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Rollback plan documented

---

## 🚨 Important Notes

### NO CODE CHANGES REQUIRED
- This migration is purely infrastructure-based
- All existing code works as-is
- Only environment variables need updating

### SECURITY BEST PRACTICES
- Use strong passwords for database and JWT
- Keep system updated: `apt update && apt upgrade`
- Use SSH keys instead of password authentication
- Regular security audits
- Monitor logs for suspicious activity

### PERFORMANCE OPTIMIZATION
- Enable Nginx caching for static assets
- Configure PostgreSQL connection pooling
- Use PM2 cluster mode for multiple CPU cores
- Enable gzip compression in Nginx

### DNS Configuration
- Update A record to point to VPS IP
- Update CNAME for www subdomain
- DNS propagation may take 24-48 hours

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Backend not starting**
```bash
pm2 logs accounting-backend
# Check if port 3001 is available
netstat -tulpn | grep 3001
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL status
systemctl status postgresql
# Test connection
psql -U accounting_user -d accounting_app -h localhost
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check if backend is running
pm2 status
# Check Nginx configuration
nginx -t
# Restart Nginx
systemctl restart nginx
```

**Issue: SSL certificate not working**
```bash
# Re-obtain certificate
certbot --nginx -d your-domain.com -d www.your-domain.com --force-renewal
```

---

## 🎉 Post-Deployment Steps

1. **Monitor for 24-48 hours** - Watch logs and performance
2. **Test all functionality** - Transactions, reports, authentication
3. **Update DNS** - Point domain to VPS (if not done earlier)
4. **Inform users** - Notify about new deployment
5. **Document changes** - Update internal documentation
6. **Schedule regular backups** - Ensure automated backups work
7. **Setup monitoring alerts** - Use tools like UptimeRobot

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Let's Encrypt](https://letsencrypt.org/docs/)

---

**Migration Date:** ___________
**Completed By:** ___________
**Verified By:** ___________
