import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// 🔹 Configurações principais
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const ROLE_APROVADO_ID = "123456789012345678"; // ID do cargo que será dado ao aprovado
const CANAL_REGISTROS_ID = "123456789012345679"; // Canal onde as solicitações vão
const IMAGEM_BANNER = "https://i.imgur.com/abc123.png"; // Banner do topo do embed

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

// 🔹 Registro dos comandos /setup e /registrar
const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Cria a mensagem inicial de registro com botão."),
  new SlashCommandBuilder()
    .setName("registrar")
    .setDescription("Inicia o registro manualmente.")
].map(cmd => cmd.toJSON());

// Registrar comandos no servidor
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Comandos registrados!");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});


// 🔹 /setup -> Envia mensagem de introdução com botão
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "setup") {
    const embed = new EmbedBuilder()
      .setTitle("📋 Sistema de Registro")
      .setDescription("Clique no botão abaixo para iniciar seu registro.\n\n⚠️ Envie apenas **uma solicitação** e aguarde ser analisado.")
      .setImage(IMAGEM_BANNER)
      .setColor("Purple");

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("iniciar_registro")
        .setLabel("📋 Iniciar Registro")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: "✅ Mensagem de registro criada!", ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [botao] });
  }
});


// 🔹 Quando clicar em "Iniciar Registro"
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "iniciar_registro") return;

  const modal = new ModalBuilder()
    .setCustomId("form_registro")
    .setTitle("Solicitação de Registro");

  const nome = new TextInputBuilder()
    .setCustomId("nome")
    .setLabel("Nome no RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const idrp = new TextInputBuilder()
    .setCustomId("idrp")
    .setLabel("ID no RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const telefone = new TextInputBuilder()
    .setCustomId("telefone")
    .setLabel("Celular no RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const recrutador = new TextInputBuilder()
    .setCustomId("recrutador")
    .setLabel("Nome do Recrutador")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(idrp),
    new ActionRowBuilder().addComponents(telefone),
    new ActionRowBuilder().addComponents(recrutador)
  );

  await interaction.showModal(modal);
});


// 🔹 Envio do registro para o canal de análise
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "form_registro") return;

  const nome = interaction.fields.getTextInputValue("nome");
  const idrp = interaction.fields.getTextInputValue("idrp");
  const telefone = interaction.fields.getTextInputValue("telefone");
  const recrutador = interaction.fields.getTextInputValue("recrutador");

  const canal = await client.channels.fetch(CANAL_REGISTROS_ID);

  const embed = new EmbedBuilder()
    .setTitle("📝 Solicitação de Registro")
    .setColor("Yellow")
    .setDescription(`Registro enviado por ${interaction.user}`)
    .addFields(
      { name: "👤 Nome no RP", value: nome, inline: false },
      { name: "🆔 ID no RP", value: idrp, inline: false },
      { name: "📱 Celular", value: telefone, inline: false },
      { name: "🧑‍💼 Recrutador", value: recrutador, inline: false }
    )
    .setImage(IMAGEM_BANNER)
    .setFooter({ text: `ID do usuário: ${interaction.user.id}` })
    .setTimestamp();

  const aprovar = new ButtonBuilder()
    .setCustomId("aprovar")
    .setLabel("✅ Aprovar")
    .setStyle(ButtonStyle.Success);

  const recusar = new ButtonBuilder()
    .setCustomId("recusar")
    .setLabel("❌ Recusar")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(aprovar, recusar);

  await canal.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: "📨 Sua solicitação foi enviada com sucesso!", ephemeral: true });
});


// 🔹 Aprovar ou Recusar registro
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const msg = interaction.message;
  const embed = EmbedBuilder.from(msg.embeds[0]);
  const userId = embed.footer.text.replace("ID do usuário: ", "");
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);

  if (interaction.customId === "aprovar") {
    embed.setColor("Green")
      .setTitle("✅ Registro Aprovado")
      .addFields({ name: "Status", value: `Aprovado por: ${interaction.user}` });

    await msg.edit({ embeds: [embed], components: [] });
    if (membro && ROLE_APROVADO_ID) await membro.roles.add(ROLE_APROVADO_ID);
    await interaction.reply({ content: "✅ Registro aprovado!", ephemeral: true });
  }

  if (interaction.customId === "recusar") {
    const modal = new ModalBuilder()
      .setCustomId(`motivo_recusa_${msg.id}`)
      .setTitle("Motivo da Recusa");

    const motivo = new TextInputBuilder()
      .setCustomId("motivo")
      .setLabel("Digite o motivo da recusa")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(motivo));
    await interaction.showModal(modal);
  }
});


// 🔹 Modal de motivo de recusa
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("motivo_recusa_")) return;

  const motivo = interaction.fields.getTextInputValue("motivo");
  const msgId = interaction.customId.split("_")[2];
  const msg = await interaction.channel.messages.fetch(msgId);

  const embed = EmbedBuilder.from(msg.embeds[0]);
  embed.setColor("Red")
    .setTitle("❌ Registro Recusado")
    .addFields({ name: "Status", value: `Recusado por: ${interaction.user}\n📝 Motivo: ${motivo}` });

  await msg.edit({ embeds: [embed], components: [] });
  await interaction.reply({ content: "❌ Registro recusado com sucesso.", ephemeral: true });
});

client.login(TOKEN);
