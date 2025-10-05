const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const TOKEN = process.env.TOKEN;
const REGISTRO_CHANNEL_ID = process.env.REGISTRO_CHANNEL_ID;
const ROLE_APROVADO_ID = process.env.ROLE_APROVADO_ID;

// ===== BOT ONLINE =====
client.once('ready', async () => {
  console.log(`${client.user.tag} está online!`);
  
  const canal = await client.channels.fetch(REGISTRO_CHANNEL_ID);
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('iniciar')
        .setLabel('Iniciar')
        .setStyle(ButtonStyle.Success)
    );

  const embed = new EmbedBuilder()
    .setTitle('Solicitação de Recrutamento')
    .setColor('#00AAFF')
    .setDescription(
      '**Informações necessárias:**\n' +
      'Id no RP\n' +
      'Nome no RP\n' +
      'Celular no RP\n' +
      'Nome do Recrutador\n\n' +
      '**Importante:**\nEnvie apenas 1 solicitação!\nQualquer dúvida, entre em contato com seu recrutador!'
    )
    .setFooter({ text: 'MÉXICO | By: 14lua' });

  canal.send({ embeds: [embed], components: [row] });
});

// ===== BOTÃO INICIAR =====
client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'iniciar') {
    const modal = new ModalBuilder()
      .setCustomId('formularioRecrutamento')
      .setTitle('Formulário de Recrutamento');

    const nome = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome no RP')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const id = new TextInputBuilder()
      .setCustomId('id')
      .setLabel('ID no RP')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const telefone = new TextInputBuilder()
      .setCustomId('telefone')
      .setLabel('Celular no RP')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const recrutador = new TextInputBuilder()
      .setCustomId('recrutador')
      .setLabel('Nome do Recrutador')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(id),
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(telefone),
      new ActionRowBuilder().addComponents(recrutador)
    );

    await interaction.showModal(modal);
  }

  // ===== ENVIAR FORMULÁRIO =====
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'formularioRecrutamento') {
    const id = interaction.fields.getTextInputValue('id');
    const nome = interaction.fields.getTextInputValue('nome');
    const telefone = interaction.fields.getTextInputValue('telefone');
    const recrutador = interaction.fields.getTextInputValue('recrutador');

    const embed = new EmbedBuilder()
      .setTitle('Solicitação de Recrutamento')
      .setColor('#0099ff')
      .addFields(
        { name: 'Por', value: `${interaction.user}`, inline: false },
        { name: 'Em', value: new Date().toLocaleString('pt-BR'), inline: false },
        { name: 'Id no RP', value: id, inline: true },
        { name: 'Nome no RP', value: nome, inline: true },
        { name: 'Celular no RP', value: telefone, inline: true },
        { name: 'Nome do Recrutador', value: recrutador, inline: true }
      )
      .setFooter({ text: 'MÉXICO | By: 14lua' });

    const botoes = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`aprovar_${interaction.user.id}`)
          .setLabel('✅ Aprovar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`recusar_${interaction.user.id}`)
          .setLabel('❌ Recusar')
          .setStyle(ButtonStyle.Danger)
      );

    const canal = await client.channels.fetch(REGISTRO_CHANNEL_ID);
    await canal.send({ embeds: [embed], components: [botoes] });

    await interaction.reply({ content: '✅ Sua solicitação foi enviada para análise!', ephemeral: true });
  }

  // ===== AÇÃO DE APROVAR / RECUSAR =====
  if (interaction.isButton()) {
    const [acao, userId] = interaction.customId.split('_');
    if (!acao || !userId) return;

    if (acao === 'aprovar') {
      const embedAprovado = new EmbedBuilder()
        .setTitle('Recrutamento Aprovado')
        .setColor('Green')
        .addFields(
          { name: 'Por', value: `<@${userId}>`, inline: true },
          { name: 'Em', value: new Date().toLocaleString('pt-BR'), inline: true }
        )
        .setFooter({ text: 'MÉXICO | By: 14lua' });

      await interaction.update({ embeds: [embedAprovado], components: [] });
    }

    if (acao === 'recusar') {
      const modal = new ModalBuilder()
        .setCustomId(`motivoRecusa_${userId}`)
        .setTitle('Motivo da Recusa');

      const motivo = new TextInputBuilder()
        .setCustomId('motivo')
        .setLabel('Motivo da recusa')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(motivo));
      await interaction.showModal(modal);
    }
  }

  // ===== MODAL DE RECUSA =====
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('motivoRecusa_')) {
    const userId = interaction.customId.split('_')[1];
    const motivo = interaction.fields.getTextInputValue('motivo');

    const embedRecusado = new EmbedBuilder()
      .setTitle('Recrutamento Recusado')
      .setColor('Red')
      .addFields(
        { name: 'Por', value: `<@${userId}>`, inline: true },
        { name: 'Motivo', value: motivo, inline: false },
        { name: 'Data', value: new Date().toLocaleString('pt-BR'), inline: true }
      )
      .setFooter({ text: 'MÉXICO | By: 14lua' });

    await interaction.update({ embeds: [embedRecusado], components: [] });
  }
});

client.login(TOKEN);

// ===== SERVIDOR WEB (para manter 24h com UptimeRobot) =====
const app = express();
app.get('/', (req, res) => res.send('Bot online 24h'));
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
