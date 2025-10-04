// index.js
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const PREFIX = "!"; // você pode mudar para "/registrar" se quiser usar comandos slash

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  client.user.setActivity("Registrando membros 📝");
});

client.on("messageCreate", (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "registrar") {
    const [nome, id, telefone, recrutador] = args;

    if (!nome || !id || !telefone || !recrutador) {
      return message.reply("⚠️ Uso correto: !registrar <nome> <id> <telefone> <recrutador>");
    }

    message.channel.send(
      `📋 **Novo registro criado!**\n👤 Nome: ${nome}\n🆔 ID: ${id}\n📞 Telefone: ${telefone}\n🧩 Recrutador: ${recrutador}`
    );
  }
});

client.login("TOKEN DO BOT");
