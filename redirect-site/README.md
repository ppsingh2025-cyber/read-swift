# PaceRead — Legacy Redirect Setup

This folder is deployed as a separate GitHub Pages site to redirect
`readswift.techscript.ca` → `paceread.techscript.ca`.

## Setup instructions for the operator:

1. Create a new GitHub repo: `readswift-redirect` (or any name)
2. Copy the contents of this folder into that repo's root
3. In that repo's Settings → Pages → Custom domain: set `readswift.techscript.ca`
4. In your DNS provider, add:
   - Type: CNAME
   - Host: readswift
   - Value: <your-github-username>.github.io
   - TTL: Auto / 3600
5. The CNAME file in the repo root tells GitHub Pages which domain to serve

All links shared under readswift.techscript.ca will continue to work forever.
DNS propagation takes up to 24 hours.
