# Częściomania — Pełny Stack

Internetowy sklep z częściami samochodowymi. React/Vite na froncie + Node.js/Express jako API + MariaDB.

```
czesciomania/
├── backend/          ← Node.js/Express REST API
│   ├── src/
│   │   ├── index.js              ← punkt wejścia, Express app
│   │   ├── db/pool.js            ← pula połączeń MySQL2
│   │   ├── middleware/auth.js    ← weryfikacja JWT
│   │   └── routes/
│   │       ├── auth.js           ← POST /api/auth/login, /register, GET /me
│   │       ├── produkty.js       ← GET /api/produkty, /produkty/:id
│   │       ├── kategorie.js      ← GET /api/kategorie (drzewo)
│   │       ├── koszyk.js         ← GET/POST/PATCH/DELETE /api/koszyk
│   │       ├── zamowienia.js     ← GET/POST /api/zamowienia
│   │       └── konto.js          ← garaż, adresy, marki/modele/typy
│   └── package.json
│
└── frontend/         ← React 18 + Vite
    ├── src/
    │   ├── api/index.js          ← JEDYNY plik komunikacji z API
    │   ├── hooks/
    │   │   ├── useAuth.jsx       ← Context: user, login, logout
    │   │   └── useCart.jsx       ← Context: koszyk z API
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── Sidebar.jsx       ← kategorie z /api/kategorie
    │   │   ├── ProductCard.jsx
    │   │   └── ProductModal.jsx  ← szczegóły z /api/produkty/:id
    │   ├── pages/
    │   │   ├── ShopPage.jsx      ← lista z /api/produkty
    │   │   ├── CartPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── AccountPage.jsx   ← garaż, zamówienia
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── vite.config.js            ← proxy /api → localhost:3001
```

---

## 1. Baza danych

Importuj plik SQL do MariaDB/MySQL:

```bash
mysql -u root -p < czesciomania.sql
```

Lub przez phpMyAdmin: Importuj → wybierz `czesciomania.sql`.

> Plik tworzy bazę `czesciomania` z 18 tabelami i danymi testowymi.

---

## 2. Backend (Node.js/Express)

```bash
cd backend

# Zainstaluj zależności
npm install

# Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Edytuj .env — ustaw DB_PASSWORD i JWT_SECRET

# Uruchom w trybie dev (z auto-reloading)
npm run dev

# Lub produkcyjnie
npm start
```

Backend wystartuje na **http://localhost:3001**

### Endpointy API

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/auth/login` | Logowanie → zwraca JWT token |
| POST | `/api/auth/register` | Rejestracja → zwraca JWT token |
| GET | `/api/auth/me` | Dane zalogowanego (wymaga JWT) |
| GET | `/api/produkty` | Lista z filtrowaniem (`?search=&kategoria_id=&sort=&page=&limit=`) |
| GET | `/api/produkty/:id` | Szczegóły + cechy + dopasowania + opinie |
| GET | `/api/kategorie` | Drzewo kategorii (parent + children) |
| GET | `/api/koszyk` | Koszyk zalogowanego (JWT) |
| POST | `/api/koszyk` | Dodaj produkt do koszyka (JWT) |
| PATCH | `/api/koszyk/:id` | Zmień ilość (JWT) |
| DELETE | `/api/koszyk/:id` | Usuń pozycję (JWT) |
| GET | `/api/zamowienia` | Historia zamówień (JWT) |
| POST | `/api/zamowienia` | Złóż zamówienie z koszyka (JWT) |
| GET | `/api/konto/garaz` | Pojazdy użytkownika (JWT) |
| POST | `/api/konto/garaz` | Dodaj pojazd (JWT) |
| DELETE | `/api/konto/garaz/:id` | Usuń pojazd (JWT) |
| GET | `/api/konto/marki` | Wszystkie marki samochodów |
| GET | `/api/konto/modele?marka_id=` | Modele dla marki |
| GET | `/api/konto/typy?model_id=` | Typy silnikowe dla modelu |

---

## 3. Frontend (React/Vite)

```bash
cd frontend

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

Frontend wystartuje na **http://localhost:5173**

Vite automatycznie proxuje `/api/*` → `http://localhost:3001` (skonfigurowane w `vite.config.js`).

### Build produkcyjny

```bash
npm run build   # → dist/
npm run preview # podgląd builda
```

---

## 4. Hasła testowych kont

Konta z bazy SQL mają hasła zahashowane. Zarejestruj nowe konto przez UI — działa od razu.

Jeśli chcesz nadpisać hasło dla istniejącego konta:
```bash
node -e "const b=require('bcryptjs'); b.hash('haslo123',12).then(h=>console.log(h))"
# Wstaw wynik do: UPDATE uzytkownicy SET haslo='...' WHERE email='...'
```

---

## 5. Architektura przepływu danych

```
Przeglądarka
    ↓  fetch /api/produkty?search=...
Vite Dev Server (proxy)
    ↓  → http://localhost:3001/api/produkty
Express Router
    ↓  SQL JOIN produkty + producenci + kategorie + tagi
MariaDB (czesciomania)
    ↓  rows
Express → JSON
    ↓
React (ShopPage) → renderuje ProductCard[]
```

Token JWT jest przechowywany w `localStorage` pod kluczem `czesciomania_token` i dołączany do każdego chronionego requestu jako `Authorization: Bearer <token>`.
