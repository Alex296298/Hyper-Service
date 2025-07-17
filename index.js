import {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} from "discord.js"
import { createClient } from "@supabase/supabase-js"
import express from "express"

// Express Server für Hosting Services
const app = express()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.json({
    status: "🤖 Discord Bot ist ONLINE!",
    uptime: process.uptime(),
    guilds: client.guilds?.cache.size || 0,
    timestamp: new Date().toISOString(),
  })
})

app.get("/health", (req, res) => {
  res.json({ status: "healthy", bot: client.isReady() })
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

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

client.commands = new Collection()

// Error Handling
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error)
})

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error)
})

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("🔄 Bot wird heruntergefahren...")
  client.destroy()
  process.exit(0)
})

// Utility Functions
const createSuccessEmbed = (title, description) => {
  return new EmbedBuilder().setTitle(`✅ ${title}`).setDescription(description).setColor(0x00ff00).setTimestamp()
}

const createErrorEmbed = (message) => {
  return new EmbedBuilder().setTitle("❌ Fehler").setDescription(message).setColor(0xff0000).setTimestamp()
}

const createInfoEmbed = (title, description) => {
  return new EmbedBuilder().setTitle(`ℹ️ ${title}`).setDescription(description).setColor(0x0099ff).setTimestamp()
}

// Command Handlers
const handleTeamCreate = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const teamName = interaction.options.getString("name")
  const description = interaction.options.getString("description") || "Keine Beschreibung"

  try {
    const { data, error } = await supabase
      .from("teams")
      .insert([
        {
          name: teamName,
          description: description,
          guild_id: interaction.guild.id,
          created_by: interaction.user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error

    const embed = createSuccessEmbed("Team erstellt!", `Team **${teamName}** wurde erfolgreich erstellt.`).addFields(
      { name: "📝 Beschreibung", value: description },
      { name: "👤 Erstellt von", value: `<@${interaction.user.id}>` },
    )

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Team Create Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Erstellen des Teams!")],
      ephemeral: true,
    })
  }
}

const handleTeamJoin = async (interaction) => {
  const teamName = interaction.options.getString("team")
  const user = interaction.options.getUser("user") || interaction.user

  try {
    // Team finden
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("name", teamName)
      .eq("guild_id", interaction.guild.id)
      .single()

    if (teamError || !team) {
      return interaction.reply({
        embeds: [createErrorEmbed("Team nicht gefunden!")],
        ephemeral: true,
      })
    }

    // Prüfen ob User bereits im Team
    const { data: existing } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", team.id)
      .eq("user_id", user.id)

    if (existing && existing.length > 0) {
      return interaction.reply({
        embeds: [createErrorEmbed("Benutzer ist bereits im Team!")],
        ephemeral: true,
      })
    }

    // User zum Team hinzufügen
    const { error } = await supabase.from("team_members").insert([
      {
        team_id: team.id,
        user_id: user.id,
        rank: "member",
        joined_at: new Date().toISOString(),
      },
    ])

    if (error) throw error

    const embed = createSuccessEmbed("Team beigetreten!", `<@${user.id}> ist dem Team **${teamName}** beigetreten.`)

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Team Join Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Beitreten des Teams!")],
      ephemeral: true,
    })
  }
}

const handleTeamKick = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const teamName = interaction.options.getString("team")
  const user = interaction.options.getUser("user")
  const reason = interaction.options.getString("reason") || "Kein Grund angegeben"

  try {
    // Team finden
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("name", teamName)
      .eq("guild_id", interaction.guild.id)
      .single()

    if (!team) {
      return interaction.reply({
        embeds: [createErrorEmbed("Team nicht gefunden!")],
        ephemeral: true,
      })
    }

    // User aus Team entfernen
    const { error } = await supabase.from("team_members").delete().eq("team_id", team.id).eq("user_id", user.id)

    if (error) throw error

    const embed = new EmbedBuilder()
      .setTitle("👢 Benutzer aus Team entfernt!")
      .setDescription(`<@${user.id}> wurde aus dem Team **${teamName}** entfernt.`)
      .addFields({ name: "📝 Grund", value: reason })
      .setColor(0xff0000)
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Team Kick Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Entfernen des Benutzers!")],
      ephemeral: true,
    })
  }
}

const handleTeamRank = async (interaction, isUprank = true) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const teamName = interaction.options.getString("team")
  const user = interaction.options.getUser("user")
  const newRank = interaction.options.getString("rank")

  try {
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("name", teamName)
      .eq("guild_id", interaction.guild.id)
      .single()

    if (!team) {
      return interaction.reply({
        embeds: [createErrorEmbed("Team nicht gefunden!")],
        ephemeral: true,
      })
    }

    const { error } = await supabase
      .from("team_members")
      .update({ rank: newRank })
      .eq("team_id", team.id)
      .eq("user_id", user.id)

    if (error) throw error

    const emoji = isUprank ? "⬆️" : "⬇️"
    const action = isUprank ? "befördert" : "degradiert"
    const color = isUprank ? 0x00ff00 : 0xff9900

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Rang ${isUprank ? "erhöht" : "verringert"}!`)
      .setDescription(`<@${user.id}> wurde im Team **${teamName}** zu **${newRank}** ${action}.`)
      .setColor(color)
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Team Rank Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Aktualisieren des Ranges!")],
      ephemeral: true,
    })
  }
}

const handleTeamInfo = async (interaction) => {
  const teamName = interaction.options.getString("team")

  try {
    const { data: team } = await supabase
      .from("teams")
      .select(`
        *,
        team_members (
          user_id,
          rank,
          joined_at
        )
      `)
      .eq("name", teamName)
      .eq("guild_id", interaction.guild.id)
      .single()

    if (!team) {
      return interaction.reply({
        embeds: [createErrorEmbed("Team nicht gefunden!")],
        ephemeral: true,
      })
    }

    const members = team.team_members || []
    const memberList =
      members.length > 0
        ? members.map((member) => `<@${member.user_id}> - **${member.rank}**`).join("\n")
        : "Keine Mitglieder"

    const embed = new EmbedBuilder()
      .setTitle(`📋 Team: ${team.name}`)
      .setDescription(team.description)
      .addFields(
        { name: "👥 Mitglieder", value: memberList },
        { name: "📅 Erstellt am", value: new Date(team.created_at).toLocaleDateString("de-DE") },
        { name: "👤 Erstellt von", value: `<@${team.created_by}>` },
      )
      .setColor(0x0099ff)
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Team Info Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Laden der Team-Informationen!")],
      ephemeral: true,
    })
  }
}

const handleWarn = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const user = interaction.options.getUser("user")
  const reason = interaction.options.getString("reason")

  try {
    const { error } = await supabase.from("warnings").insert([
      {
        user_id: user.id,
        guild_id: interaction.guild.id,
        moderator_id: interaction.user.id,
        reason: reason,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) throw error

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Verwarnung erteilt!")
      .setDescription(`<@${user.id}> wurde verwarnt.`)
      .addFields({ name: "📝 Grund", value: reason }, { name: "👮 Moderator", value: `<@${interaction.user.id}>` })
      .setColor(0xff9900)
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })

    // DM an User senden
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("⚠️ Du wurdest verwarnt!")
        .setDescription(`Du wurdest auf **${interaction.guild.name}** verwarnt.`)
        .addFields({ name: "📝 Grund", value: reason })
        .setColor(0xff9900)
        .setTimestamp()

      await user.send({ embeds: [dmEmbed] })
    } catch (dmError) {
      console.log("Konnte keine DM senden:", dmError.message)
    }
  } catch (error) {
    console.error("Warn Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Erstellen der Verwarnung!")],
      ephemeral: true,
    })
  }
}

const handleWarnings = async (interaction) => {
  const user = interaction.options.getUser("user") || interaction.user

  try {
    const { data: warnings } = await supabase
      .from("warnings")
      .select("*")
      .eq("user_id", user.id)
      .eq("guild_id", interaction.guild.id)
      .order("created_at", { ascending: false })

    if (!warnings || warnings.length === 0) {
      return interaction.reply({
        embeds: [
          createInfoEmbed(
            "Keine Verwarnungen",
            `${user.id === interaction.user.id ? "Du hast" : "Dieser Benutzer hat"} keine Verwarnungen.`,
          ),
        ],
        ephemeral: true,
      })
    }

    const warningList = warnings
      .slice(0, 10) // Nur die letzten 10 anzeigen
      .map(
        (warning, index) =>
          `**${index + 1}.** ${warning.reason}\n*<t:${Math.floor(new Date(warning.created_at).getTime() / 1000)}:R>*`,
      )
      .join("\n\n")

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Verwarnungen für ${user.username}`)
      .setDescription(warningList)
      .setFooter({ text: `Gesamt: ${warnings.length} Verwarnungen` })
      .setColor(0xff9900)
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  } catch (error) {
    console.error("Warnings Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Laden der Verwarnungen!")],
      ephemeral: true,
    })
  }
}

const handleAnnounce = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const title = interaction.options.getString("title")
  const message = interaction.options.getString("message")
  const channel = interaction.options.getChannel("channel") || interaction.channel

  try {
    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(message)
      .setColor(0x0099ff)
      .setFooter({
        text: `Angekündigt von ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()

    await channel.send({ embeds: [embed] })
    await interaction.reply({
      embeds: [createSuccessEmbed("Ankündigung gesendet!", `Die Ankündigung wurde in <#${channel.id}> gesendet.`)],
      ephemeral: true,
    })
  } catch (error) {
    console.error("Announce Error:", error)
    await interaction.reply({
      embeds: [createErrorEmbed("Fehler beim Senden der Ankündigung!")],
      ephemeral: true,
    })
  }
}

const handleTicketSetup = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Du hast keine Berechtigung für diesen Befehl!")],
      ephemeral: true,
    })
  }

  const embed = new EmbedBuilder()
    .setTitle("🎫 Support Ticket System")
    .setDescription(
      "Klicke auf den Button unten, um ein Support-Ticket zu erstellen.\n\n**Wann solltest du ein Ticket erstellen?**\n• Bei technischen Problemen\n• Für Support-Anfragen\n• Bei Fragen zur Moderation\n• Für private Anliegen",
    )
    .setColor(0x0099ff)
    .setFooter({ text: "Tickets werden privat behandelt" })

  const button = new ButtonBuilder()
    .setCustomId("create_ticket")
    .setLabel("🎫 Ticket erstellen")
    .setStyle(ButtonStyle.Primary)

  const row = new ActionRowBuilder().addComponents(button)

  await interaction.reply({ embeds: [embed], components: [row] })
}

// Event Handlers
client.on("ready", () => {
  console.log(`🤖 ${client.user.tag} ist ONLINE!`)
  console.log(`📊 Bot läuft auf ${client.guilds.cache.size} Servern`)
  console.log(`👥 Erreicht ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} Benutzer`)

  // Bot Status setzen
  client.user.setActivity("Team Management | /help", { type: ActivityType.Watching })

  // Heartbeat für Keep-Alive
  setInterval(() => {
    console.log(`💓 Bot Heartbeat - ${new Date().toLocaleTimeString("de-DE")}`)
  }, 300000) // Alle 5 Minuten
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction

      switch (commandName) {
        case "team-create":
          await handleTeamCreate(interaction)
          break
        case "team-join":
          await handleTeamJoin(interaction)
          break
        case "team-kick":
          await handleTeamKick(interaction)
          break
        case "team-uprank":
          await handleTeamRank(interaction, true)
          break
        case "team-derank":
          await handleTeamRank(interaction, false)
          break
        case "team-info":
          await handleTeamInfo(interaction)
          break
        case "warn":
          await handleWarn(interaction)
          break
        case "warnings":
          await handleWarnings(interaction)
          break
        case "announce":
          await handleAnnounce(interaction)
          break
        case "ticket-setup":
          await handleTicketSetup(interaction)
          break
        case "ping":
          const embed = createInfoEmbed(
            "🏓 Pong!",
            `Latenz: ${client.ws.ping}ms\nUptime: ${Math.floor(process.uptime())}s`,
          )
          await interaction.reply({ embeds: [embed] })
          break
        default:
          await interaction.reply({
            embeds: [createErrorEmbed("Unbekannter Befehl!")],
            ephemeral: true,
          })
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "create_ticket") {
        // Prüfen ob User bereits ein offenes Ticket hat
        const { data: existingTicket } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", interaction.user.id)
          .eq("guild_id", interaction.guild.id)
          .eq("status", "open")

        if (existingTicket && existingTicket.length > 0) {
          return interaction.reply({
            embeds: [createErrorEmbed("Du hast bereits ein offenes Ticket!")],
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

        // Ticket in Datenbank speichern
        await supabase.from("tickets").insert([
          {
            channel_id: ticketChannel.id,
            user_id: interaction.user.id,
            guild_id: interaction.guild.id,
            status: "open",
            created_at: new Date().toISOString(),
          },
        ])

        const embed = createSuccessEmbed("Ticket erstellt!", `Dein Ticket wurde erstellt: <#${ticketChannel.id}>`)

        await interaction.reply({ embeds: [embed], ephemeral: true })

        // Welcome Message im Ticket Channel
        const welcomeEmbed = new EmbedBuilder()
          .setTitle("🎫 Support Ticket")
          .setDescription(
            `Hallo <@${interaction.user.id}>!\n\nBeschreibe bitte dein Problem detailliert und ein Teammitglied wird dir so schnell wie möglich helfen.\n\n**Bitte gib folgende Informationen an:**\n• Was ist das Problem?\n• Wann ist es aufgetreten?\n• Welche Schritte hast du bereits versucht?`,
          )
          .setColor(0x0099ff)
          .setTimestamp()

        const closeButton = new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Ticket schließen")
          .setStyle(ButtonStyle.Danger)

        const closeRow = new ActionRowBuilder().addComponents(closeButton)

        await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeRow] })
      }

      if (interaction.customId === "close_ticket") {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({
            embeds: [createErrorEmbed("Du hast keine Berechtigung, Tickets zu schließen!")],
            ephemeral: true,
          })
        }

        // Ticket Status aktualisieren
        await supabase
          .from("tickets")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("channel_id", interaction.channel.id)

        const embed = new EmbedBuilder()
          .setTitle("🔒 Ticket wird geschlossen...")
          .setDescription("Dieses Ticket wird in 5 Sekunden gelöscht.\n\nVielen Dank für deine Anfrage!")
          .setColor(0xff0000)
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })

        setTimeout(async () => {
          try {
            await interaction.channel.delete()
          } catch (error) {
            console.error("Fehler beim Löschen des Ticket-Channels:", error)
          }
        }, 5000)
      }
    }
  } catch (error) {
    console.error("❌ Interaction Error:", error)

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          embeds: [createErrorEmbed("Ein unerwarteter Fehler ist aufgetreten!")],
          ephemeral: true,
        })
      } catch (replyError) {
        console.error("❌ Could not send error reply:", replyError)
      }
    }
  }
})

// Connection Events
client.on("disconnect", () => {
  console.log("🔌 Bot disconnected, versuche Reconnect...")
})

client.on("reconnecting", () => {
  console.log("🔄 Bot reconnecting...")
})

client.on("error", (error) => {
  console.error("❌ Discord Client Error:", error)
})

// Bot Login
const token = process.env.DISCORD_BOT_TOKEN
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN nicht gefunden!")
  process.exit(1)
}

client.login(token).catch((error) => {
  console.error("❌ Bot Login Fehler:", error)
  process.exit(1)
})

export default app
