# 🤖 Einfacher Discord Bot

**Plug & Play Discord Bot - Nur Token eingeben und starten!**

## 🚀 Super Einfache Installation

### 1. Bot Token holen
1. Gehe zu https://discord.com/developers/applications
2. **"New Application"** → Name eingeben
3. **"Bot"** → **"Add Bot"**
4. **Token kopieren** 📋

### 2. Client ID holen
1. **"General Information"** Tab
2. **Application ID kopieren** 📋

### 3. Config ausfüllen
Öffne `config.json` und trage ein:
\`\`\`json
{
  "bot": {
    "token": "HIER_DEIN_BOT_TOKEN",
    "clientId": "HIER_DEINE_CLIENT_ID"
  }
}
\`\`\`

### 4. Bot starten
\`\`\`bash
npm run install-and-run
\`\`\`

**FERTIG! 🎉**

## ✨ Features

### 🏆 Team System
- `/team-create` - Team erstellen
- `/team-join` - Team beitreten  
- `/team-kick` - Mitglied entfernen
- `/team-uprank` / `/team-derank` - Ränge verwalten
- `/team-info` - Team-Informationen
- `/team-list` - Alle Teams anzeigen

### ⚠️ Verwarnungen
- `/warn` - Benutzer verwarnen
- `/warnings` - Verwarnungen anzeigen

### 📢 Ankündigungen
- `/announce` - Professionelle Ankündigungen

### 🎫 Support Tickets
- `/ticket-setup` - Ticket-System aktivieren
- Interaktive Buttons für Tickets

### 🔧 Utility
- `/ping` - Bot-Status prüfen

## ⚙️ Konfiguration

Alle Einstellungen in `config.json`:

\`\`\`json
{
  "features": {
    "teamSystem": true,        // Team System an/aus
    "warningSystem": true,     // Verwarnungen an/aus
    "ticketSystem": true,      // Tickets an/aus
    "announcementSystem": true // Ankündigungen an/aus
  },
  "settings": {
    "maxTeamsPerGuild": 50,    // Max Teams pro Server
    "maxMembersPerTeam": 100,  // Max Mitglieder pro Team
    "autoDeleteTicketAfter": 5000 // Ticket löschen nach X ms
  }
}
\`\`\`

## 📁 Datenspeicherung

- **Keine Datenbank nötig!** 
- Alles wird in `./data/` Ordner gespeichert
- Automatische Backups in `./data/backups/`
- JSON-Format für einfache Bearbeitung

## 🔒 Permissions

Der Bot braucht diese Discord-Permissions:
- Send Messages
- Use Slash Commands
- Manage Channels (für Tickets)
- Manage Messages (für Ankündigungen)
- Moderate Members (für Verwarnungen)

## 🆘 Troubleshooting

**Bot startet nicht:**
- Prüfe Token in `config.json`
- Stelle sicher, dass `npm install` ausgeführt wurde

**Commands funktionieren nicht:**
- Führe `npm run setup` aus
- Warte 1-2 Minuten nach dem Setup

**Daten weg:**
- Prüfe `./data/backups/` Ordner
- Automatische Backups alle Stunde

## 🚀 Online Hosting

### Railway (Empfohlen)
1. Code auf GitHub pushen
2. Railway.app → "Deploy from GitHub"
3. Automatisch online! ✅

### Render
1. Render.com → "New Web Service"
2. GitHub Repository verbinden
3. Build Command: `npm install`
4. Start Command: `npm run install-and-run`

---

**🎯 Einfacher geht's nicht! Token rein, starten, fertig!**
