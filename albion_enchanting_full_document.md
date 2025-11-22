
# Albion Enchanting Tool – Gesamtdokument

## 1. PRD (Product Requirements Document)

### 1.1 Projektbeschreibung
Eine private Web-App zur Berechnung von Profitabilität beim Enchanten in Albion Online.  
Die App hilft:
- Profitable Crafts zu finden
- Manuell Profit berechnen
- Eigene Items speichern
- Preise manuell eingeben

Technologie:
- Next.js (App Router)
- React
- CSS pro Seite
- TypeScript

---

## 2. Seitenstruktur

```
/src/app
  /page
    dashboard.tsx
    discovery.tsx
    calculate.tsx
    my-enchants.tsx
    prices.tsx
  /css
    dashboard.css
    discovery.css
    calculate.css
    my-enchants.css
    prices.css
  layout.tsx
  globals.css
```

### Seitenbeschreibung
**Dashboard** – Übersicht, wichtigste Kennzahlen  
**Discovery** – Anzeige profitabler Crafts  
**Calculate** – Manuelle Profit-Berechnung  
**My Enchants** – Favoritenliste  
**Prices** – Manuelle Materialpreis-Eingabe

---

## 3. Layout
Navigation in `layout.tsx`  
Links:
- /page/dashboard  
- /page/discovery  
- /page/calculate  
- /page/my-enchants  
- /page/prices  

---

## 4. Styling
Jede Seite hat eine eigene CSS-Datei, importiert direkt:

```tsx
import "../../css/dashboard.css";
```

Dieses Dokument enthält vollständiges PRD + README und kann direkt für Dokumentation oder Copilot verwendet werden.
