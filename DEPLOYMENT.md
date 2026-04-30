# Cities Search Deployment Guide

## Overview
This guide explains how to deploy the cities search API and typeahead functionality to production.

## What's Included
- **Backend**: Cities search API endpoint (`/api/cities`)
- **Frontend**: Typeahead dropdown component
- **Database**: 438 cities ready to be seeded

## Production Deployment Steps

### 1. Backend Deployment

#### Deploy Updated Backend Code
```bash
# Push updated backend with cities API
git add .
git commit -m "feat: add cities search API with typeahead support"
git push origin main
```

#### Seed Production Database
```bash
# On your production server (Render/Vercel/etc.)
npm install
npm run db:seed:cities:production
```

**Expected Output:**
```
==========================================
    PRODUCTION CITIES SEEDING STARTED     
==========================================

Processing 438 cities in batches of 50...
Environment: production

Processing batch 1/9 (50 cities)...
  + INSERTED: C.G. ROAD (CGR)
  + INSERTED: RATANPOLE (RAT)
  ...

==========================================
              SEEDING COMPLETE             
==========================================
Total processed: 438
Inserted: 438
Updated: 0
Skipped: 0
Errors: 0
==========================================

Final database count: 438 active cities
```

### 2. Frontend Deployment

#### Deploy Updated Frontend
```bash
# Push updated frontend with typeahead component
git add .
git commit -m "feat: add cities typeahead dropdown"
git push origin main
```

## Verification Steps

### 1. Test Live API
```bash
curl "https://accounting-app-ttqe.onrender.com/api/cities?limit=5"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "C.G. ROAD",
      "code": "CGR",
      "state": "Gujarat"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 438,
    "totalPages": 88,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Test Frontend
- Navigate to your live frontend
- Go to `/transactions` page
- Click on the "Center" input field
- Should see dropdown with cities
- Type "mum" should show "Mumbai"

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=your_production_database_url
NODE_ENV=production
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://accounting-app-ttqe.onrender.com
```

## Features After Deployment

### Cities Search API
- **Endpoint**: `GET /api/cities`
- **Parameters**: 
  - `search` (optional): Search term
  - `limit` (optional): Max results (default 20, max 50)
  - `page` (optional): Page number (default 1)
- **Response**: Paginated cities with search results

### Frontend Typeahead
- **Real-time search**: 300ms debounce
- **Keyboard navigation**: Arrow keys, Enter, Escape
- **All cities on focus**: Shows A-Z when input is empty
- **Highlighting**: Matches highlighted in results
- **Fallback API**: Uses live API when local fails

## Monitoring

### API Health Check
```bash
curl "https://accounting-app-ttqe.onrender.com/health"
```

### Database Count Check
```bash
curl "https://accounting-app-ttqe.onrender.com/api/cities?limit=1"
# Should return 438 total cities
```

## Troubleshooting

### Cities Not Showing
1. **Check database seeding**: Run `npm run db:seed:cities:production`
2. **Check API response**: Test `/api/cities` endpoint
3. **Check frontend console**: Look for API errors

### API Returns Empty Data
1. **Database not seeded**: Run production seeding script
2. **Wrong environment**: Check DATABASE_URL
3. **Permission issues**: Check database credentials

### Frontend Errors
1. **CORS issues**: Check backend CORS configuration
2. **API URL wrong**: Check NEXT_PUBLIC_API_URL
3. **Network issues**: Check live API accessibility

## Rollback Plan

If issues occur:
```bash
# Rollback database (if needed)
# Keep cities data - it's safe and additive

# Rollback code
git revert <commit-hash>
git push origin main
```

## Support

The cities search is designed to be:
- **Non-breaking**: Doesn't affect existing functionality
- **Idempotent**: Seeding can be run multiple times
- **Safe**: Uses upsert logic to prevent duplicates
- **Performant**: Indexed queries with pagination

## Production Safety

- **No schema changes**: Uses existing City table
- **No data deletion**: Only inserts/updates
- **Error handling**: Continues processing if individual cities fail
- **Batch processing**: Prevents memory spikes
- **Logging**: Detailed output for debugging
