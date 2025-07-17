// Für Hosting-Services die HTTP-Endpoints brauchen
import express from "express"

const app = express()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.send("Discord Bot ist online! 🤖")
})

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`Keep-alive server läuft auf Port ${PORT}`)
})

export default app
