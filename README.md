# Cricket Scorer — Setup Guide

Gully cricket ke liye live scoring app. Do jagah use hota hai:
- `#/manage/CODE` — sirf match manager ke liye (scoring karta hai)
- `#/watch/CODE` — koi bhi viewer ke liye (live dekhta hai)

Real-time sync **Firebase Realtime Database** se hota hai.

---

## Step 1 — Firebase project banao

1. Jao: https://console.firebase.google.com
2. **Add project** → naam do (e.g. `cricket-scorer`) → Continue.
3. Google Analytics poochega — **disable** kar sakte ho, isse koi farak nahi padta.
4. **Create project** click karo.

## Step 2 — Realtime Database on karo

1. Left sidebar me **Build → Realtime Database**.
2. **Create Database** click karo.
3. Location choose karo (koi bhi paas wala region, e.g. `asia-southeast1`).
4. Mode: **Start in test mode** (development ke liye — 30 din me expire ho jayega, production rule niche di hai).

## Step 3 — Web app register karo aur config lo

1. Project Overview page pe **`</>` (Web)** icon click karo.
2. Nickname do (e.g. `cricket-scorer-web`) → **Register app**.
3. Jo `firebaseConfig = {...}` object dikhega, use **copy** karo.
4. Is project ki file `src/firebase.js` kholo, aur apna config waha paste karo (existing placeholder object replace karo).

## Step 4 — Database Rules (security)

Realtime Database → **Rules** tab me jaake ye paste karo (development ke liye open, sirf isi project ke liye theek hai kyunki data khud-hi delete ho jata hai match khatam hone par):

```json
{
  "rules": {
    "matches": {
      "$code": {
        ".read": true,
        ".write": true
      }
    },
    "adminCodes": {
      "$adminCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Ye step miss mat karna** — agar Rules ye na ho (ya default locked rule ho), to manager ke buttons dabane par score screen par turant dikh to jayega (ab local update turant hota hai) lekin ek red error banner aayega "Save fail hua" aur Firebase me kabhi save nahi hoga, matlab doosre viewers tak update nahi pahuchega.

**Production ke liye thoda tight karna ho to** manager side pe ek simple secret/PIN field add kar sakte ho aur rule me check kar sakte ho — abhi ke liye ye open rule kaam chala dega kyunki match codes random hain aur short-lived hain.

## Step 5 — Node.js install karo (agar nahi hai)

- https://nodejs.org se LTS version download karo, install karo.
- Terminal me check karo: `node -v`

## Step 6 — Project run karo

Is folder (`cricket-scorer/`) me terminal khol kar:

```bash
npm install
npm run dev
```

Terminal me ek `localhost` link milega — browser me kholo. Apne phone se test karne ke liye same WiFi pe `http://<tumhara-laptop-ka-ip>:5173` use karo, ya seedha deploy kar do (Step 7).

## Step 7 — Deploy karo (taaki asli link WhatsApp pe share ho sake)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

`firebase init` me:
- **"Use an existing project"** → apna project chuno
- Public directory: `dist`
- Configure as single-page app: **Yes**
- Overwrite index.html: **No**

Phir build aur deploy:

```bash
npm run build
firebase deploy
```

Terminal me final **Hosting URL** milega (e.g. `https://cricket-scorer-xxxx.web.app`) — ye link tum WhatsApp/kahin bhi share kar sakte ho. Manager isi link ke `#/` pe match banayega, viewers ko `#/watch` wala link ya sirf code milega.

---

## Kaise kaam karta hai (architecture)

- Poora match ka data `matches/{code}` path par ek hi JSON object me store hota hai — `code` yahi 6-character **public** code hai jo viewers ko diya jata hai.
- Ek alag `adminCodes/{adminCode} -> code` mapping bhi store hoti hai. Manager `#/manage/{adminCode}` URL use karta hai — ye adminCode public code se **alag aur lamba** hota hai, taaki koi viewer galti se ya jaan-boojh kar manager ban na jaaye.
- **App load hote hi ab default screen viewer ka hai** (`#/` = "code daalo, live dekho" full screen). Manager/Admin sirf ek chhoti si link se milta hai (`#/admin`), jahan se naya match banao ya apna admin-code daal kar resume karo.
- **Manager ka screen ab optimistic hai**: koi bhi button dabate hi UI turant update hoti hai (Firebase round-trip ka wait nahi karta), phir background me Firebase ko sync kar deta hai. Agar sync fail ho (jaise Rules galat set ho), ek red error banner dikhega — is se pata chal jayega ki kya save nahi ho raha.
- **Manager tab band ho jaye ya app se hat jaye to bhi match khatam nahi hota** — `#/admin` pe jaakar apna admin-code daal kar wapas usi match par (usi state se) aa sakte ho.
- **Viewer** sirf `onValue()` se sunta hai — real-time update mil jata hai, kabhi likh nahi sakta.
- **Undo** sirf manager ke device par local hota hai (Firebase me store nahi hota) — agar manager refresh kar de to undo history khatam ho jayegi (current live state safe rehta hai).
- Match khatam hone par "End Live & Clear" dabane se `matches/{code}` aur `adminCodes/{adminCode}` dono Firebase se **delete** ho jate hain — isi se free-tier ka data usage control me rehta hai.

⚠️ **Admin code ko safe rakhna** — jo bhi is code ko jaanta hai wo match manage kar sakta hai. Match banate waqt ek popup me ye code dikhta hai, turant screenshot/note kar lena.

## Files kya karti hain

| File | Kaam |
|---|---|
| `src/gameLogic.js` | Saare scoring rules (runs, wide, no-ball, bye, free-hit, out, innings-end) — pure functions, Firebase se independent |
| `src/firebase.js` | Firebase config + exports |
| `src/SetupView.jsx` | Naya match banane ka form |
| `src/AdminHome.jsx` | Admin gateway — naya match ya admin-code se resume |
| `src/ManagerView.jsx` | Live scoring screen — sab kuch ek hi screen par |
| `src/ViewerView.jsx` | Read-only live viewing screen + default full-screen code-entry landing |
| `src/components/Scoreboard.jsx` | Score display (dono views me shared) |
| `src/components/AnimationOverlay.jsx` | Six/Four/Out ke fun animations |
| `src/styles.css` | Poori styling + animations |

## Aage badhane ke liye ideas
- Bowler tracking + bowling figures
- Individual batsman runs/strike-rate
- PWA manifest add karke "Add to Home Screen" ka proper app icon
- Manager ke liye simple PIN-based re-entry (agar galti se tab band ho jaye)
