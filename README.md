# UnAlone Frontend (React + MUI)

Application React (TypeScript) pour UnAlone, avec Material UI, Leaflet et Socket.IO.

## Démarrer

```powershell
# depuis la racine du repo
npm run start:frontend
# ou dans le dossier frontend
npm start
```

URL par défaut: http://localhost:3000

## Configuration

Variables `.env.local` (générées automatiquement par `scripts/sync-env.js` en dev):

- `REACT_APP_API_URL` (ex: http://localhost:5000/api)
- `REACT_APP_SOCKET_URL` (ex: http://localhost:5001)

## RGPD & Vie privée (Frontend)

Composants clés:

- `src/components/CookieConsent.tsx` — Bandeau cookies avec préférences
- `src/components/RGPDMenu.tsx` — Menu flottant RGPD (politique, cookies, export, suppression)
- `src/components/PrivacyPolicyModal.tsx` — Politique de confidentialité
- `src/components/AccountPage.tsx` — Onglet Paramètres > section “Vie privée & RGPD”

API côté frontend:

- `src/services/api.ts`
	- `rgpdApi.exportData()` — Export JSON des données
	- `rgpdApi.deleteAccount(password)` — Suppression définitive du compte
	- `rgpdApi.getConsentHistory()` — Consentement actuel et historique (si connecté)
	- `rgpdApi.saveConsent(preferences)` — Sauvegarder les préférences

Sauvegarde du consentement:
- Les préférences sont stockées en localStorage (`cookieConsent`, `cookieConsentDate`)
- Si l’utilisateur est connecté, elles sont aussi sauvegardées côté serveur via `POST /api/rgpd/consent`

Bonnes pratiques (gating des services tiers):
```ts
const raw = localStorage.getItem('cookieConsent');
const prefs = raw ? JSON.parse(raw) : { analytics: false, marketing: false };
if (prefs.analytics) {
	// initAnalytics();
}
if (prefs.marketing) {
	// initMarketingTags();
}
```

## Tests

```powershell
npm test
```

## Build

```powershell
npm run build
```
