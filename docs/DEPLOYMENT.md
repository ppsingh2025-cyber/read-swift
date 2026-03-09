# Deployment Guide

## Environment Variables

Copy `.env.example` to `.env` and populate the values:

```env
# Required for auth and sync features (optional — app works without these)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional analytics
VITE_GOATCOUNTER_SITE_CODE=your-site-code
```

## Build

```bash
npm install
npm run build
```

Output is in the `dist/` directory.

## Hosting Options

### GitHub Pages (current)

The repository is configured for GitHub Pages deployment. Push to `main` to deploy automatically.

Make sure to set environment variables as GitHub Actions secrets and inject them during the build step.

### Netlify / Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in the platform's dashboard

### Self-hosted (nginx example)

```nginx
server {
    listen 80;
    root /var/www/paceread/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Supabase Configuration

After deploying, add your production URL to Supabase's allowed redirect URLs:

1. Supabase dashboard → **Authentication → URL Configuration**
2. Add your production domain to **Redirect URLs**
3. Add it to **Site URL** as well

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) and [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for full setup guides.
