# Deployment Checklist for Mini Store Inventory App

## Pre-Deployment Checklist

- [ ] All code changes committed
- [ ] Tests passing locally (`npm run test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in development

## Phase 1: Neon Database Setup

- [ ] Created Neon account at https://neon.tech
- [ ] Created project: `mini-store-inv`
- [ ] Selected region: _____________
- [ ] Copied connection string
- [ ] Added `?sslmode=require` to connection string
- [ ] Saved connection string securely

## Phase 2: GitHub Setup

- [ ] Created GitHub repository: `mini-store-inv`
- [ ] Pushed local code to GitHub
- [ ] Verified code on GitHub

## Phase 3: Vercel Setup

- [ ] Connected GitHub repository to Vercel
- [ ] Initial deployment completed
- [ ] Verified auto-detected settings:
  - Framework: SvelteKit
  - Build: `npm run build`
  - Output: `build`

## Phase 4: Environment Variables

- [ ] Added `POSTGRES_URL` with SSL
- [ ] Added `POSTGRES_HOST`
- [ ] Added `POSTGRES_USER`
- [ ] Added `POSTGRES_PASSWORD`
- [ ] Added `POSTGRES_DATABASE`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed after adding variables

## Phase 5: Verification

- [ ] Deployment successful (green checkmark)
- [ ] Database tables created (check logs)
- [ ] Seed data loaded (check logs)
- [ ] App loads without errors
- [ ] Login works:
  - Email: `admin@ministore.com`
  - Password: `admin123`
- [ ] Dashboard shows data
- [ ] Inventory page shows products
- [ ] Sales page shows transactions

## Post-Deployment

- [ ] Saved app URL: _________________
- [ ] Saved Vercel dashboard URL
- [ ] Tested on mobile device
- [ ] Verified no console errors in production

## Future Updates

When making changes:
1. Make changes locally
2. Test with `npm run dev`
3. Run `npm run build` to verify build
4. Commit: `git add . && git commit -m "message"`
5. Push: `git push origin main`
6. Vercel auto-deploys
7. Verify deployment in Vercel dashboard

## Important URLs

| Service | URL |
|---------|-----|
| App | |
| GitHub | |
| Vercel | |
| Neon | |

## Notes

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________