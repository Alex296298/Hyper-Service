# 📋 Schritt-für-Schritt Setup Guide

## 🎯 Ziel: Bot in 5 Minuten online!

### Schritt 1: Discord Application erstellen
1. **Öffne:** https://discord.com/developers/applications
2. **Klicke:** "New Application"
3. **Name:** z.B. "Mein Team Bot"
4. **Klicke:** "Create"

### Schritt 2: Bot erstellen
1. **Gehe zu:** "Bot" Tab (links)
2. **Klicke:** "Add Bot"
3. **Bestätige:** "Yes, do it!"
4. **Kopiere:** Den Token (unter "Token")
   - ⚠️ **WICHTIG:** Token geheim halten!

### Schritt 3: Client ID holen
1. **Gehe zu:** "General Information" Tab
2. **Kopiere:** Application ID

### Schritt 4: Bot Permissions setzen
1. **Gehe zu:** "Bot" Tab
2. **Aktiviere unter "Privileged Gateway Intents":**
   - ✅ Message Content Intent
3. **Unter "Bot Permissions" aktiviere:**
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Manage Channels
   - ✅ Manage Messages
   - ✅ Moderate Members

### Schritt 5: Config ausfüllen
**Öffne `config.json` und ersetze:**
\`\`\`json
{
  "bot": {
    "token": "HIER_DEINEN_ECHTEN_TOKEN_EINFÜGEN",
    "clientId": "HIER_DEINE_ECHTE_CLIENT_ID_EINFÜGEN"
  }
}
\`\`\`

### Schritt 6: Bot installieren und starten
**Terminal/Kommandozeile öffnen und eingeben:**
\`\`\`bash
npm run install-and-run
\`\`\`

**Das war's! Bot sollte jetzt online sein! 🎉**

### Schritt 7: Bot zu Server hinzufügen
1. **Gehe zu:** "OAuth2" → "URL Generator"
2. **Wähle Scopes:**
   - ✅ bot
   - ✅ applications.commands
3. **Wähle Bot Permissions:**
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Manage Channels
   - ✅ Manage Messages
   - ✅ Moderate Members
4. **Kopiere** die generierte URL
5. **Öffne** URL im Browser
6. **Wähle** deinen Server
7. **Klicke** "Authorize"

### Schritt 8: Bot testen
**Teste diese Commands:**
- `/ping` - Sollte "Pong!" antworten
- `/team-create name:TestTeam` - Erstellt ein Test-Team
- `/ticket-setup` - Aktiviert Ticket-System

## 🎯 Fertig!

**Dein Bot ist jetzt online und einsatzbereit!**

### 📊 Nächste Schritte:
1. **Features anpassen** in `config.json`
2. **Mehr Teams erstellen** mit `/team-create`
3. **Ticket-System aktivieren** mit `/ticket-setup`
4. **Ankündigungen senden** mit `/announce`

### 🆘 Probleme?
- **Bot antwortet nicht:** Prüfe Token in config.json
- **Commands nicht da:** Führe `npm run setup` aus
- **Permissions fehlen:** Prüfe Bot-Permissions im Discord

---

**🚀 Viel Spaß mit deinem Bot!**
