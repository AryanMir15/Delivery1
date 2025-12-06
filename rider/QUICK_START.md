# 🚴 Rider App - Quick Start (2 Minutes)

## ⚡ Super Fast Setup

### 1️⃣ Configure IP (30 seconds)
```bash
# Edit rider/src/config/constants.js
export const BACKEND_IP = '192.168.137.1'; // ← Your IP here!
```

**Find your IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

---

### 2️⃣ Start Backend (30 seconds)
```bash
npm start
```

**Wait for:** `🚀 Server running on port 4000`

---

### 3️⃣ Start Rider App (30 seconds)
```bash
cd rider
npm start
```

**Press:** `a` for Android or `i` for iOS

---

### 4️⃣ Login (30 seconds)
```
Email: rider@test.com
Password: password123
```

---

## ✅ You're Ready!

**Toggle "Online"** → Accept orders → Start delivering! 🚴💨

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
npm run kill-port
npm start
```

### Can't connect?
```bash
node rider/test-backend-connection.js
```

### Socket errors?
**Ignore them!** App works perfectly without Socket.io.

---

## 📚 Full Guides

- **Complete Setup:** `COMPLETE_SETUP_GUIDE.md`
- **Socket Issues:** `SOCKET_TROUBLESHOOTING.md`
- **App Status:** `RIDER_APP_STATUS.md`

---

**That's it! Start delivering! 🎉**
