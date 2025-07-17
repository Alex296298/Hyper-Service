import { REST, Routes, SlashCommandBuilder } from "discord.js"
import fs from "fs/promises"

// Config laden
const configData = await fs.readFile("config.json", "utf8")
const config = JSON.parse(configData)

const commands = [
  // Team Commands
  new SlashCommandBuilder()
    .setName("team-create")
    .setDescription("🏆 Erstelle ein neues Team")
    .addStringOption((option) => option.setName("name").setDescription("Name des Teams").setRequired(true))
    .addStringOption((option) =>
      option.setName("description").setDescription("Beschreibung des Teams").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("team-join")
    .setDescription("👥 Einem Team beitreten")
    .addStringOption((option) => option.setName("team").setDescription("Name des Teams").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Benutzer (optional)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("team-kick")
    .setDescription("👢 Einen Benutzer aus einem Team entfernen")
    .addStringOption((option) => option.setName("team").setDescription("Name des Teams").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Zu entfernender Benutzer").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Grund für das Entfernen").setRequired(false)),

  new SlashCommandBuilder()
    .setName("team-uprank")
    .setDescription("⬆️ Einen Benutzer im Team befördern")
    .addStringOption((option) => option.setName("team").setDescription("Name des Teams").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Zu befördernder Benutzer").setRequired(true))
    .addStringOption((option) =>
      option
        .setName("rank")
        .setDescription("Neuer Rang")
        .setRequired(true)
        .addChoices(
          { name: "👤 Member", value: "member" },
          { name: "⭐ Officer", value: "officer" },
          { name: "👑 Leader", value: "leader" },
          { name: "🔥 Elite", value: "elite" },
          { name: "💎 VIP", value: "vip" },
        ),
    ),

  new SlashCommandBuilder()
    .setName("team-derank")
    .setDescription("⬇️ Einen Benutzer im Team degradieren")
    .addStringOption((option) => option.setName("team").setDescription("Name des Teams").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Zu degradierender Benutzer").setRequired(true))
    .addStringOption((option) =>
      option
        .setName("rank")
        .setDescription("Neuer Rang")
        .setRequired(true)
        .addChoices(
          { name: "👤 Member", value: "member" },
          { name: "⭐ Officer", value: "officer" },
          { name: "👑 Leader", value: "leader" },
          { name: "🔥 Elite", value: "elite" },
          { name: "💎 VIP", value: "vip" },
        ),
    ),

  new SlashCommandBuilder()
    .setName("team-info")
    .setDescription("📋 Informationen über ein Team anzeigen")
    .addStringOption((option) => option.setName("team").setDescription("Name des Teams").setRequired(true)),

  new SlashCommandBuilder().setName("team-list").setDescription("📜 Alle Teams auf diesem Server anzeigen"),

  // Warning Commands
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("⚠️ Einen Benutzer verwarnen")
    .addUserOption((option) => option.setName("user").setDescription("Zu verwarnender Benutzer").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Grund für die Verwarnung").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("📜 Verwarnungen eines Benutzers anzeigen")
    .addUserOption((option) => option.setName("user").setDescription("Benutzer (optional)").setRequired(false)),

  // Announcement Commands
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("📢 Eine Ankündigung senden")
    .addStringOption((option) => option.setName("title").setDescription("Titel der Ankündigung").setRequired(true))
    .addStringOption((option) =>
      option.setName("message").setDescription("Nachricht der Ankündigung").setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Kanal für die Ankündigung (optional)").setRequired(false),
    ),

  // Ticket Commands
  new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("🎫 Ticket-System einrichten"),

  // Utility Commands
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🏓 Bot Latenz prüfen"),
].map((command) => command.toJSON())

const rest = new REST().setToken(config.bot.token)
;(async () => {
  try {
    console.log("🔄 Registriere Slash Commands...")

    await rest.put(Routes.applicationCommands(config.bot.clientId), {
      body: commands,
    })

    console.log("✅ Slash Commands erfolgreich registriert!")
    console.log(`📊 ${commands.length} Commands registriert`)
  } catch (error) {
    console.error("❌ Fehler beim Registrieren der Commands:", error)
    console.log("💡 Prüfe deine clientId in der config.json!")
  }
})()
