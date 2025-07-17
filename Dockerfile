FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production && npm cache clean --force

# App Code kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.json()).then(d=>process.exit(d.status==='healthy'?0:1))" || exit 1

# Bot starten
CMD ["npm", "start"]
