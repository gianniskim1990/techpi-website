# pigiota314.gr — temporary Apache 301/410 canary (separate deployment approval: granted 2026-10-22)

**Scope:** two purpose-built URLs only. Do **not** install any of the 189 real migration routes during this test. Do **not** merge PR #55 or change DNS. This file is reference material in the draft PR; GitHub does not deploy it to the old WordPress server.

## 1. Before editing

1. The owner has already downloaded a full backup of old `/public_html/.htaccess`. Keep it locally.
2. Confirm the two probe paths are not current WordPress content (they are intentionally unique):
   - `https://pigiota314.gr/techpi-migration-check-301-20261022`
   - `https://pigiota314.gr/techpi-migration-check-410-20261022`
3. Use cPanel → File Manager → `public_html` → `.htaccess` → Edit. **Prepend** the entire code below **before `# BEGIN SpeedyCacheheaders`**, without editing or replacing existing plugin, WordPress or PHP blocks.

## 2. Add this temporary block at the top

```apache
# BEGIN TECHPI CANARY — REMOVE AFTER TEST
# The inherited cPanel ErrorDocument may re-route mod_rewrite [G] 410 into WordPress 404.
ErrorDocument 410 default
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?pigiota314\.gr$ [NC]
RewriteRule ^techpi-migration-check-301-20261022/?$ https://techpi.eu/el/ [R=301,L,QSD]

RewriteCond %{HTTP_HOST} ^(www\.)?pigiota314\.gr$ [NC]
RewriteRule ^techpi-migration-check-410-20261022/?$ - [G,L]
</IfModule>
# END TECHPI CANARY — REMOVE AFTER TEST

```

**Important:** this is a canary, not a redirect of the homepage. No other path is intentionally matched. The old Google HTML verification file, mail-related DNS, subdomains, WordPress admin, images and contact form are unaffected by these explicit path matches.

## 3. Test without following redirects

In Windows PowerShell, run:

```powershell
curl.exe -sS -o NUL -D - "https://pigiota314.gr/techpi-migration-check-301-20261022"
curl.exe -sS -o NUL -D - "https://pigiota314.gr/techpi-migration-check-410-20261022"
curl.exe -sS -o NUL -D - "https://pigiota314.gr/portfolio/"
```

Check:
- Canary 301: **HTTP 301** and `Location: https://techpi.eu/el/`.
- Canary 410: **HTTP 410 Gone**, no redirect to the homepage. On 2026-10-22 the first canary (without `ErrorDocument 410 default`) returned WordPress **404**, despite 301 PASS. The `ErrorDocument 410 default` line is an isolated correction to override a suspected inherited cPanel 410 error handler. **Second live curl check PASSED:** `curl.exe -sS -o NUL -D - https://pigiota314.gr/techpi-migration-check-410-20261022` returned `HTTP/1.1 410 Gone`, `Server: Apache`, at `Thu, 22 Oct 2026 13:17:32 GMT` with the override at the top of the block. The earlier 301 probe returned `HTTP/1.1 301 Moved Permanently` and the exact expected `Location: https://techpi.eu/el/` at `13:12:10 GMT`. Both behaviors are now proven for the apex on the old origin. No www, asset, Google ownership file or rollback check is yet reported.
- Untouched portfolio: still the original old WordPress response; no TechPi redirect from this canary.
- Optionally repeat 301 and 410 probes on `https://www.pigiota314.gr/...`. If www has an older host-level redirect to apex, capture that separate hop and do not wrongly attribute it to this rule.
- Spot-check `https://pigiota314.gr/`, the Search Console HTML verification file (must remain 200), one `/wp-content/uploads/...` image and any critical application subdomain. Do not post the verification filename or token in PR logs/chat.
- If new 500 errors occur, immediately **delete only the canary block** and save. Preserve all original file contents.

## 4. Remove the canary again

**Rollback VERIFIED by owner on 2026-10-22, 13:20:40–13:20:41 GMT.** The entire canary block (including `ErrorDocument 410 default`) was removed. Both test URLs returned `HTTP/1.1 404 Not Found` with WordPress headers (`Server: Apache`, `Link: .../wp-json/`). This confirms the canary no longer intercepts requests and the prior WordPress routing was restored for both test paths. The old homepage, Google verification file, assets and application subdomains should still be smoke-tested before full migration.

After getting the response headers, open the same `.htaccess`, remove the entire `# BEGIN TECHPI CANARY` through `# END TECHPI CANARY` block including its rules, and save. The first line must again be `# BEGIN SpeedyCacheheaders`. Confirm the two probe URLs no longer return the added 301/410. This is the rollback verification. Ensure the `ErrorDocument 410 default` line is also removed together with the canary block; it must not be left behind after this test.

**No production migration should proceed merely because this canary passes**: the full 189-rule matrix still needs separate approval and reconciliation with the 206-URL crawl's absent per-URL inventory.
