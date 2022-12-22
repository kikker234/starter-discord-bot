require("dotenv").config();

const SUGGESTION_CHANNEL = ["1054868524612456490", "1055045412588896286"];

const WHITELIST_TWITCH = "1055041634577956874";
const NO_WHITELIST_TWITCH = "1055042133578485780";

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.login(process.env.TOKEN);

client.on("ready", async (c) => {
  cacheAll();
  console.log("Bot launched successfully!");
});

client.on("messageReactionAdd", async (reaction) => {
  let emote = reaction.emoji;
  let message = emote.reaction.message;
  let channel = emote.reaction.message.channelId;

  if (!SUGGESTION_CHANNEL.includes(channel)) {
    return;
  }

  if (emote.name == "✅" || emote.name == "❌") {
    let isAccepted = emote.name == "✅";

    let color = getColor(isAccepted);
    let pronounce = getPronounce(isAccepted);

    let userName;

    reaction.users.cache.forEach((user) => {
      userName = user.username;
    });

    let editedEmbed = message.embeds[0];

    let embBuilder = new EmbedBuilder(editedEmbed)
      .setColor(color)
      .setFooter({ text: `${pronounce} door: ${userName}` });

    message.edit({ embeds: [embBuilder] });
    message.reactions.removeAll();
  }
});

client.on("messageCreate", (message) => {
  let isRobot = message.author.bot;
  let channel = message.channelId;

  if (isRobot) return;

  if (message.channelId == WHITELIST_TWITCH) {
    client.channels.fetch(NO_WHITELIST_TWITCH).then((channel) => {
      channel.send(message);
    });
    return;
  }

  if (SUGGESTION_CHANNEL.includes(message.channelId)) {
    let messageContent = message.content;
    let name = message.author.username;
    let iconURL = message.author.avatarURL();

    let embed = new EmbedBuilder()
      .setColor("#FAF9F6")
      .setAuthor({ name: name, iconURL: iconURL })
      .setDescription(messageContent)
      .setTimestamp();

    message.channel.send({ embeds: [embed] }).then((msg) => {
      msg.react("👍");
      msg.react("👎");
      msg.startThread({
        name: `Suggestie van: ` + name,
        autoArchiveDuration: 60,
        type: "GUILD_PUBLIC_THREAD",
      });
    });

    message.delete();
  }
});

function getColor(accepted) {
  return accepted ? "#37eb34" : "#fd0037";
}

function getPronounce(accepted) {
  return accepted ? "Goedgekeurd" : "Afgekeurd";
}

async function cacheAll() {
  SUGGESTION_CHANNEL.forEach(async (channelId) => {
    let channel = await client.channels.fetch(channelId);
    let msgs = await channel.messages.fetch({ limit: 100 });

    msgs.forEach((msg) => {
      channel.fetch(msg.id);
    });
  });
}
