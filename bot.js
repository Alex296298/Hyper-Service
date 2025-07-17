import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} from "discord.js"
import fs from "fs/promises"
import path from "path"
import express from "express"

// Config laden
let config
try {
  const configData = await fs.readFile("config.json", "utf8")
  config = JSON.parse(configData)
} catch (error) {
  console.error("❌ Fehler beim Laden der config.json:", error.message)
  console.log("💡 Stelle sicher, dass die config.json existiert und gültig ist!")
  process.exit(1)
}

// Express Server für Keep-Alive
const app = express()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.json({
    status: "🤖 Discord Bot ONLINE!",
    guilds: client.guilds?.cache.size || 0,
    uptime: Math.floor(process.uptime()),
    features: Object.keys(config.features).filter((key) => config.features[key]),
  })
})

app.listen(PORT, () => {
  console.log(`🌐 Keep-alive server läuft auf Port ${PORT}`)
})

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})

// Daten-Storage (JSON Files)
class SimpleStorage {
  constructor() {
    this.dataDir = "./data"
    this.ensureDataDir()
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.error("Fehler beim Erstellen des data Ordners:", error)
    }
  }

  async load(filename) {
    try {
      const data = await fs.readFile(path.join(this.dataDir, `${filename}.json`), "utf8")
      return JSON.parse(data)
    } catch (error) {
      return {}
    }
  }

  async save(filename, data) {
    try {
      await fs.writeFile(path.join(this.dataDir, `${filename}.json`), JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Fehler beim Speichern von ${filename}:`, error)
      return false
    }
  }

  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupDir = path.join(this.dataDir, "backups", timestamp)

    try {
      await fs.mkdir(backupDir, { recursive: true })

      const files = await fs.readdir(this.dataDir)
      for (const file of files) {
        if (file.endsWith(".json")) {
          await fs.copyFile(path.join(this.dataDir, file), path.join(backupDir, file))
        }
      }

      console.log(`✅ Backup erstellt: ${backupDir}`)
      return true
    } catch (error) {
      console.error("❌ Backup Fehler:", error)
      return false
    }
  }
}

const storage = new SimpleStorage()

// Utility Functions
const createEmbed = (type, title, description) => {
  const colors = {
    success: Number.parseInt(config.bot.color.success.replace("#", ""), 16),
    error: Number.parseInt(config.bot.color.error.replace("#", ""), 16),
    info: Number.parseInt(config.bot.color.info.replace("#", ""), 16),
    warning: Number.parseInt(config.bot.color.warning.replace("#", ""), 16),
  }

  const emojis = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  }

  return new EmbedBuilder()
    .setTitle(`${emojis[type]} ${title}`)
    .setDescription(description)
    .setColor(colors[type])
    .setTimestamp()
}

const hasPermission = (member, requiredPerms) => {
  return requiredPerms.some((perm) => member.permissions.has(PermissionFlagsBits[perm]))
}

// Team System
const teamCommands = {
  "team-create": async (interaction) => {
    if (!config.features.teamSystem) {
      return interaction.reply({
        embeds: [createEmbed("error", "Feature deaktiviert", "Team System ist deaktiviert!")],
        ephemeral: true,
      })
    }

    if (!hasPermission(interaction.member, config.permissions.teamManagement)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const teamName = interaction.options.getString("name")
    const description = interaction.options.getString("description") || "Keine Beschreibung"

    const teams = await storage.load(`teams_${interaction.guild.id}`)

    if (teams[teamName]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Team existiert bereits", `Team **${teamName}** existiert bereits!`)],
        ephemeral: true,
      })
    }

    if (Object.keys(teams).length >= config.settings.maxTeamsPerGuild) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "error",
            "Limit erreicht",
            `Maximale Anzahl Teams (${config.settings.maxTeamsPerGuild}) erreicht!`,
          ),
        ],
        ephemeral: true,
      })
    }

    teams[teamName] = {
      name: teamName,
      description: description,
      createdBy: interaction.user.id,
      createdAt: new Date().toISOString(),
      members: {},
    }

    await storage.save(`teams_${interaction.guild.id}`, teams)

    const embed = createEmbed(
      "success",
      "Team erstellt!",
      `Team **${teamName}** wurde erfolgreich erstellt.`,
    ).addFields(
      { name: "📝 Beschreibung", value: description },
      { name: "👤 Erstellt von", value: `<@${interaction.user.id}>` },
    )

    await interaction.reply({ embeds: [embed] })
  },

  "team-join": async (interaction) => {
    const teamName = interaction.options.getString("team")
    const user = interaction.options.getUser("user") || interaction.user

    const teams = await storage.load(`teams_${interaction.guild.id}`)

    if (!teams[teamName]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Team nicht gefunden", "Dieses Team existiert nicht!")],
        ephemeral: true,
      })
    }

    if (teams[teamName].members[user.id]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Bereits Mitglied", "Benutzer ist bereits im Team!")],
        ephemeral: true,
      })
    }

    if (Object.keys(teams[teamName].members).length >= config.settings.maxMembersPerTeam) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "error",
            "Team voll",
            `Team hat bereits die maximale Anzahl Mitglieder (${config.settings.maxMembersPerTeam})!`,
          ),
        ],
        ephemeral: true,
      })
    }

    teams[teamName].members[user.id] = {
      userId: user.id,
      rank: "member",
      joinedAt: new Date().toISOString(),
    }

    await storage.save(`teams_${interaction.guild.id}`, teams)

    const embed = createEmbed("success", "Team beigetreten!", `<@${user.id}> ist dem Team **${teamName}** beigetreten.`)

    await interaction.reply({ embeds: [embed] })
  },

  "team-kick": async (interaction) => {
    if (!hasPermission(interaction.member, config.permissions.teamManagement)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const teamName = interaction.options.getString("team")
    const user = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "Kein Grund angegeben"

    const teams = await storage.load(`teams_${interaction.guild.id}`)

    if (!teams[teamName]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Team nicht gefunden", "Dieses Team existiert nicht!")],
        ephemeral: true,
      })
    }

    if (!teams[teamName].members[user.id]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Nicht im Team", "Benutzer ist nicht im Team!")],
        ephemeral: true,
      })
    }

    delete teams[teamName].members[user.id]
    await storage.save(`teams_${interaction.guild.id}`, teams)

    const embed = createEmbed(
      "warning",
      "Benutzer entfernt",
      `<@${user.id}> wurde aus dem Team **${teamName}** entfernt.`,
    ).addFields({ name: "📝 Grund", value: reason })

    await interaction.reply({ embeds: [embed] })
  },

  "team-rank": async (interaction, isUprank = true) => {
    if (!hasPermission(interaction.member, config.permissions.teamManagement)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const teamName = interaction.options.getString("team")
    const user = interaction.options.getUser("user")
    const newRank = interaction.options.getString("rank")

    const teams = await storage.load(`teams_${interaction.guild.id}`)

    if (!teams[teamName] || !teams[teamName].members[user.id]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Fehler", "Team oder Benutzer nicht gefunden!")],
        ephemeral: true,
      })
    }

    teams[teamName].members[user.id].rank = newRank
    await storage.save(`teams_${interaction.guild.id}`, teams)

    const emoji = isUprank ? "⬆️" : "⬇️"
    const action = isUprank ? "befördert" : "degradiert"

    const embed = createEmbed(
      "success",
      `Rang ${isUprank ? "erhöht" : "verringert"}!`,
      `<@${user.id}> wurde im Team **${teamName}** zu **${newRank}** ${action}.`,
    )

    await interaction.reply({ embeds: [embed] })
  },

  "team-info": async (interaction) => {
    const teamName = interaction.options.getString("team")
    const teams = await storage.load(`teams_${interaction.guild.id}`)

    if (!teams[teamName]) {
      return interaction.reply({
        embeds: [createEmbed("error", "Team nicht gefunden", "Dieses Team existiert nicht!")],
        ephemeral: true,
      })
    }

    const team = teams[teamName]
    const members = Object.values(team.members)
    const memberList =
      members.length > 0
        ? members.map((member) => `<@${member.userId}> - **${member.rank}**`).join("\n")
        : "Keine Mitglieder"

    const embed = createEmbed("info", `Team: ${team.name}`, team.description).addFields(
      { name: "👥 Mitglieder", value: memberList },
      { name: "📊 Statistiken", value: `${members.length}/${config.settings.maxMembersPerTeam} Mitglieder` },
      { name: "📅 Erstellt am", value: new Date(team.createdAt).toLocaleDateString("de-DE") },
      { name: "👤 Erstellt von", value: `<@${team.createdBy}>` },
    )

    await interaction.reply({ embeds: [embed] })
  },

  "team-list": async (interaction) => {
    const teams = await storage.load(`teams_${interaction.guild.id}`)
    const teamList = Object.values(teams)

    if (teamList.length === 0) {
      return interaction.reply({
        embeds: [createEmbed("info", "Keine Teams", "Es wurden noch keine Teams erstellt.")],
        ephemeral: true,
      })
    }

    const teamInfo = teamList
      .map((team) => `**${team.name}** - ${Object.keys(team.members).length} Mitglieder`)
      .join("\n")

    const embed = createEmbed("info", "Team Liste", teamInfo).setFooter({
      text: `${teamList.length}/${config.settings.maxTeamsPerGuild} Teams`,
    })

    await interaction.reply({ embeds: [embed] })
  },
}

// Warning System
const warningCommands = {
  warn: async (interaction) => {
    if (!config.features.warningSystem) {
      return interaction.reply({
        embeds: [createEmbed("error", "Feature deaktiviert", "Warning System ist deaktiviert!")],
        ephemeral: true,
      })
    }

    if (!hasPermission(interaction.member, config.permissions.warnings)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const user = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason")

    const warnings = await storage.load(`warnings_${interaction.guild.id}`)
    if (!warnings[user.id]) warnings[user.id] = []

    const warning = {
      id: Date.now(),
      reason: reason,
      moderator: interaction.user.id,
      createdAt: new Date().toISOString(),
    }

    warnings[user.id].push(warning)
    await storage.save(`warnings_${interaction.guild.id}`, warnings)

    const embed = createEmbed("warning", "Verwarnung erteilt!", `<@${user.id}> wurde verwarnt.`).addFields(
      { name: "📝 Grund", value: reason },
      { name: "👮 Moderator", value: `<@${interaction.user.id}>` },
      { name: "📊 Gesamt Verwarnungen", value: warnings[user.id].length.toString() },
    )

    await interaction.reply({ embeds: [embed] })

    // DM an User
    try {
      const dmEmbed = createEmbed(
        "warning",
        "Du wurdest verwarnt!",
        `Du wurdest auf **${interaction.guild.name}** verwarnt.`,
      ).addFields({ name: "📝 Grund", value: reason })

      await user.send({ embeds: [dmEmbed] })
    } catch (error) {
      console.log("Konnte keine DM senden")
    }
  },

  warnings: async (interaction) => {
    const user = interaction.options.getUser("user") || interaction.user
    const warnings = await storage.load(`warnings_${interaction.guild.id}`)

    if (!warnings[user.id] || warnings[user.id].length === 0) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "info",
            "Keine Verwarnungen",
            `${user.id === interaction.user.id ? "Du hast" : "Dieser Benutzer hat"} keine Verwarnungen.`,
          ),
        ],
        ephemeral: true,
      })
    }

    const userWarnings = warnings[user.id].slice(-config.settings.maxWarningsShow)
    const warningList = userWarnings
      .map(
        (warning, index) =>
          `**${index + 1}.** ${warning.reason}\n*<t:${Math.floor(new Date(warning.createdAt).getTime() / 1000)}:R> von <@${warning.moderator}>*`,
      )
      .join("\n\n")

    const embed = createEmbed("warning", `Verwarnungen für ${user.username}`, warningList).setFooter({
      text: `${warnings[user.id].length} Verwarnungen insgesamt`,
    })

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}

// Announcement System
const announcementCommands = {
  announce: async (interaction) => {
    if (!config.features.announcementSystem) {
      return interaction.reply({
        embeds: [createEmbed("error", "Feature deaktiviert", "Announcement System ist deaktiviert!")],
        ephemeral: true,
      })
    }

    if (!hasPermission(interaction.member, config.permissions.announcements)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const title = interaction.options.getString("title")
    const message = interaction.options.getString("message")
    const channel = interaction.options.getChannel("channel") || interaction.channel

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(message)
      .setColor(Number.parseInt(config.bot.color.info.replace("#", ""), 16))
      .setFooter({ text: `Angekündigt von ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp()

    await channel.send({ embeds: [embed] })
    await interaction.reply({
      embeds: [createEmbed("success", "Ankündigung gesendet!", `Die Ankündigung wurde in <#${channel.id}> gesendet.`)],
      ephemeral: true,
    })
  },
}

// Ticket System
const ticketCommands = {
  "ticket-setup": async (interaction) => {
    if (!config.features.ticketSystem) {
      return interaction.reply({
        embeds: [createEmbed("error", "Feature deaktiviert", "Ticket System ist deaktiviert!")],
        ephemeral: true,
      })
    }

    if (!hasPermission(interaction.member, config.permissions.tickets)) {
      return interaction.reply({
        embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung für diesen Befehl!")],
        ephemeral: true,
      })
    }

    const embed = createEmbed(
      "info",
      "Support Ticket System",
      "Klicke auf den Button unten, um ein Support-Ticket zu erstellen.\n\n**Wann solltest du ein Ticket erstellen?**\n• Bei technischen Problemen\n• Für Support-Anfragen\n• Bei Fragen zur Moderation\n• Für private Anliegen",
    ).setFooter({ text: "Tickets werden privat behandelt" })

    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("🎫 Ticket erstellen")
      .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder().addComponents(button)

    await interaction.reply({ embeds: [embed], components: [row] })
  },
}

// Event Handlers
client.on("ready", () => {
  console.log(`🤖 ${client.user.tag} ist ONLINE!`)
  console.log(`📊 Bot läuft auf ${client.guilds.cache.size} Servern`)
  console.log(`👥 Erreicht ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} Benutzer`)
  console.log(
    `⚙️ Features: ${Object.keys(config.features)
      .filter((key) => config.features[key])
      .join(", ")}`,
  )

  client.user.setActivity(config.bot.status, { type: ActivityType.Watching })

  // Auto-Backup
  if (config.features.autoBackup) {
    setInterval(() => {
      storage.backup()
    }, config.settings.backupInterval)
  }

  // Heartbeat
  setInterval(() => {
    console.log(`💓 Bot Heartbeat - ${new Date().toLocaleTimeString("de-DE")}`)
  }, 300000)
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction

      // Team Commands
      if (commandName.startsWith("team-")) {
        if (commandName === "team-uprank") {
          await teamCommands["team-rank"](interaction, true)
        } else if (commandName === "team-derank") {
          await teamCommands["team-rank"](interaction, false)
        } else {
          await teamCommands[commandName]?.(interaction)
        }
      }
      // Warning Commands
      else if (warningCommands[commandName]) {
        await warningCommands[commandName](interaction)
      }
      // Announcement Commands
      else if (announcementCommands[commandName]) {
        await announcementCommands[commandName](interaction)
      }
      // Ticket Commands
      else if (ticketCommands[commandName]) {
        await ticketCommands[commandName](interaction)
      }
      // Utility Commands
      else if (commandName === "ping") {
        const embed = createEmbed(
          "info",
          "🏓 Pong!",
          `Latenz: ${client.ws.ping}ms\nUptime: ${Math.floor(process.uptime())}s`,
        )
        await interaction.reply({ embeds: [embed] })
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "create_ticket") {
        const tickets = await storage.load(`tickets_${interaction.guild.id}`)

        // Prüfen ob User bereits ein offenes Ticket hat
        const hasOpenTicket = Object.values(tickets).some(
          (ticket) => ticket.userId === interaction.user.id && ticket.status === "open",
        )

        if (hasOpenTicket) {
          return interaction.reply({
            embeds: [createEmbed("error", "Ticket bereits vorhanden", "Du hast bereits ein offenes Ticket!")],
            ephemeral: true,
          })
        }

        // Ticket Channel erstellen
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: interaction.channel.parent,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
          ],
        })

        // Ticket speichern
        tickets[ticketChannel.id] = {
          channelId: ticketChannel.id,
          userId: interaction.user.id,
          status: "open",
          createdAt: new Date().toISOString(),
        }

        await storage.save(`tickets_${interaction.guild.id}`, tickets)

        const embed = createEmbed("success", "Ticket erstellt!", `Dein Ticket wurde erstellt: <#${ticketChannel.id}>`)
        await interaction.reply({ embeds: [embed], ephemeral: true })

        // Welcome Message
        const welcomeEmbed = createEmbed(
          "info",
          "Support Ticket",
          `Hallo <@${interaction.user.id}>!\n\nBeschreibe bitte dein Problem detailliert und ein Teammitglied wird dir so schnell wie möglich helfen.`,
        )

        const closeButton = new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Ticket schließen")
          .setStyle(ButtonStyle.Danger)

        const closeRow = new ActionRowBuilder().addComponents(closeButton)

        await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeRow] })
      }

      if (interaction.customId === "close_ticket") {
        if (!hasPermission(interaction.member, config.permissions.tickets)) {
          return interaction.reply({
            embeds: [createEmbed("error", "Keine Berechtigung", "Du hast keine Berechtigung, Tickets zu schließen!")],
            ephemeral: true,
          })
        }

        const tickets = await storage.load(`tickets_${interaction.guild.id}`)
        if (tickets[interaction.channel.id]) {
          tickets[interaction.channel.id].status = "closed"
          tickets[interaction.channel.id].closedAt = new Date().toISOString()
          await storage.save(`tickets_${interaction.guild.id}`, tickets)
        }

        const embed = createEmbed(
          "error",
          "Ticket wird geschlossen...",
          `Dieses Ticket wird in ${config.settings.autoDeleteTicketAfter / 1000} Sekunden gelöscht.\n\nVielen Dank für deine Anfrage!`,
        )

        await interaction.reply({ embeds: [embed] })

        setTimeout(async () => {
          try {
            await interaction.channel.delete()
          } catch (error) {
            console.error("Fehler beim Löschen des Ticket-Channels:", error)
          }
        }, config.settings.autoDeleteTicketAfter)
      }
    }
  } catch (error) {
    console.error("❌ Interaction Error:", error)

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          embeds: [createEmbed("error", "Fehler", "Ein unerwarteter Fehler ist aufgetreten!")],
          ephemeral: true,
        })
      } catch (replyError) {
        console.error("❌ Could not send error reply:", replyError)
      }
    }
  }
})

// Error Handling
client.on("error", (error) => {
  console.error("❌ Discord Client Error:", error)
})

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error)
})

// Bot Login
if (!config.bot.token || config.bot.token === "DEIN_BOT_TOKEN_HIER") {
  console.error("❌ Bot Token nicht konfiguriert!")
  console.log("💡 Bitte trage deinen Bot Token in die config.json ein!")
  process.exit(1)
}

client.login(config.bot.token).catch((error) => {
  console.error("❌ Bot Login Fehler:", error)
  console.log("💡 Prüfe deinen Bot Token in der config.json!")
  process.exit(1)
})
