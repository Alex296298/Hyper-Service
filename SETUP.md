# 🚀 Discord Bot Setup - Schritt für Schritt

## 1. Discord Bot erstellen

1. Gehe zu https://discord.com/developers/applications
2. Klicke **"New Application"**
3. Gib einen Namen ein (z.B. "Team Manager")
4. Gehe zu **"Bot"** → **"Add Bot"**
5. Kopiere den **Token** (das ist dein `DISCORD_BOT_TOKEN`)
6. Gehe zu **"General Information"** und kopiere die **Application ID** (das ist deine `DISCORD_CLIENT_ID`)

## 2. Bot Permissions

Unter **"Bot"** → **"Privileged Gateway Intents"**:
- ✅ Message Content Intent

Unter **"OAuth2"** → **"URL Generator"**:
- **Scopes**: `bot`, `applications.commands`
- **Permissions**: 
  - Send Messages
  - Use Slash Commands
  - Manage Channels
  - Manage Messages
  - Moderate Members
  - Manage Roles

## 3. Supabase Setup

1. Gehe zu https://supabase.com
2. Erstelle ein neues Projekt
3. Gehe zu **Settings** → **API**
4. Kopiere:
   - **URL** (das ist deine `SUPABASE_URL`)
   - **anon public** key (das ist dein `SUPABASE_ANON_KEY`)

## 4. Hosting auf Railway (Empfohlen)

1. Gehe zu https://railway.app
2. Klicke **"Start a New Project"**
3. Wähle **"Deploy from GitHub repo"**
4. Verbinde dein Repository
5. Setze Environment Variables:
   \`\`\`
   DISCORD_BOT_TOKEN=dein_token
   DISCORD_CLIENT_ID=deine_id
   SUPABASE_URL=deine_url
   SUPABASE_ANON_KEY=dein_key
   \`\`\`
6. Deploy!

## 5. Alternative: Render

1. Gehe zu https://render.com
2. **"New"** → **"Web Service"**
3. Verbinde GitHub Repository
4. Build Command: `npm install && npm run deploy`
5. Start Command: `npm start`
6. Setze Environment Variables (wie oben)

## 6. Bot zu Server hinzufügen

1. Verwende die URL aus dem OAuth2 URL Generator
2. Wähle deinen Server
3. Klicke **"Authorize"**

## 7. Testen

Nach dem Deployment:
- `/ping` - Bot Latenz testen
- `/team-create name:TestTeam` - Erstes Team erstellen
- `/ticket-setup` - Ticket System aktivieren

## 🆘 Troubleshooting

**Bot antwortet nicht:**
- Prüfe ob alle Environment Variables gesetzt sind
- Schaue in die Logs (Railway/Render Dashboard)
- Stelle sicher, dass der Bot die richtigen Permissions hat

**Database Fehler:**
- Prüfe Supabase URL und Key
- Stelle sicher, dass die Tabellen existieren

**Commands funktionieren nicht:**
- Warte 1-2 Minuten nach dem Deployment
- Prüfe ob `npm run deploy` erfolgreich war

## 📞 Support

Bei Problemen:
1. Prüfe die Logs im Hosting Dashboard
2. Teste `/ping` Command
3. Überprüfe alle Environment Variables
