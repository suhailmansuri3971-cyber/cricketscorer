# Cricket Scorer — PWA

Ye folder ek complete, installable PWA (Progressive Web App) hai.

## Files
```
index.html          → poori app (single file, sab kuch isi me hai)
manifest.json        → app ka naam, icon, theme-color, install config
service-worker.js    → offline app-shell caching + installability
icons/                → sab icon sizes (already generate ho chuke hain)
```

## Zaroori: Deploy kaise karo
PWA install-prompt sirf tab kaam karta hai jab site **HTTPS** par ho (ya `localhost` par test kar rahe ho). File ko seedha double-click karke `file://` se khologe to install button kaam nahi karega.

Free hosting options (koi bhi ek use kar lo):
1. **Vercel** — saari files ek folder me daalo, `vercel.com` par drag-drop se deploy karo
2. **Netlify** — `netlify.com` → "Deploy manually" → folder drag karo
3. **GitHub Pages** — repo me push karo, Settings → Pages me enable karo
4. **Firebase Hosting** — chunki aap already Firebase use kar rahe ho, `firebase deploy` se yahi project pe host bhi kar sakte ho

**Important:** `index.html`, `manifest.json`, `service-worker.js`, aur `icons/` folder — sab ek hi root folder me hone chahiye (jaise abhi hain), tabhi relative paths sahi kaam karenge.

## Background image lagana
`index.html` khol kar `STADIUM BACKGROUND PHOTO` comment dhundo (CSS ke `:root` block me), wahan apna image URL daal do:
```css
--stadium-bg: url('YAHA_APNA_IMAGE_URL');
```

## Install kaise test karo
1. Deploy karne ke baad us HTTPS URL ko Chrome (Android) ya Safari (iPhone) me kholo
2. **Android/Chrome/Edge:** home page par ek "App install karo" banner khud dikhega — Install button dabao, ya browser ke address bar me install icon (⊕) bhi dikhega
3. **iPhone/Safari:** Safari me `beforeinstallprompt` support nahi karta, isliye banner me instructions dikhengi — Share (⬆️) button → "Add to Home Screen"
4. Install karne ke baad app apne icon ke saath home screen par aa jayega aur poori-screen (browser bar ke bina) khulega

## Icon badalna
Agar future me icon change karna ho, `icons/` folder ke sab PNG files replace kar do (same file names, same sizes rakhna — 72, 96, 128, 144, 152, 192, 384, 512, maskable-192, maskable-512, apple-touch-icon, favicon-16, favicon-32).

## Note
Service worker sirf app-shell (HTML/CSS/JS/icons) ko cache karta hai taaki app installable ho aur network thoda flaky ho to bhi khul jaye. Live score data Firebase Realtime Database se aata hai — uske liye internet connection zaroori hai (ye normal hai, live scoring ka matlab hi live connection hai).
