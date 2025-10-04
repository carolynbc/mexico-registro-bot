// index.js
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } = require('discord.js');
const express = require('express');

const token = process.env.TOKEN;
const registroChannelId = process.env.REGISTRO_CHANNEL_ID;
const roleAprovadoId = process.env.ROLE_APROVADO_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- BOT ONLINE ---
client.once('ready', async () => {
    console.log(`${client.user.tag} está online!`);
    
    const canal = await client.channels.fetch(registroChannelId);
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('registrar')
            .setLabel('Registrar')
            .setStyle(ButtonStyle.Primary)
        );

    canal.send({ content: 'Clique no botão para se registrar:', components: [row] });
});

client.on('interactionCreate', async interaction => {

    // --- BOTÃO DE REGISTRO ---
    if (interaction.isButton() && interaction.customId === 'registrar') {
        const modal = new ModalBuilder()
            .setCustomId('registroModal')
            .setTitle('Formulário de Registro');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const idInput = new TextInputBuilder()
            .setCustomId('id')
            .setLabel('ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const telefoneInput = new TextInputBuilder()
            .setCustomId('telefone')
            .setLabel('Telefone')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const recrutadorInput = new TextInputBuilder()
            .setCustomId('recrutador')
            .setLabel('Recrutador')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nomeInput),
            new ActionRowBuilder().addComponents(idInput),
            new ActionRowBuilder().addComponents(telefoneInput),
            new ActionRowBuilder().addComponents(recrutadorInput)
        );

        await interaction.showModal(modal);
    }

    // --- SUBMISSÃO DO MODAL DE REGISTRO ---
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'registroModal') {
        const nome = interaction.fields.getTextInputValue('nome');
        const id = interaction.fields.getTextInputValue('id');
        const telefone = interaction.fields.getTextInputValue('telefone');
        const recrutador = interaction.fields.getTextInputValue('recrutador');

        const embed = new EmbedBuilder()
            .setTitle('Novo Registro')
            .setDescription(`**Nome:** ${nome}\n**ID:** ${id}\n**Telefone:** ${telefone}\n**Recrutador:** ${recrutador}`)
            .setColor('Blue');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`aprovar_${interaction.user.id}`)
                    .setLabel('Aprovar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`recusar_${interaction.user.id}`)
                    .setLabel('Recusar')
                    .setStyle(ButtonStyle.Danger)
            );

        const canal = await client.channels.fetch(registroChannelId);
        await canal.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Seu registro foi enviado para análise!', ephemeral: true });
    }

    // --- APROVAR / RECUSAR ---
    if (interaction.isButton()) {
        const [acao, userId] = interaction.customId.split('_');
        const membro = await interaction.guild.members.fetch(userId);

        if (acao === 'aprovar') {
            const cargo = interaction.guild.roles.cache.get(roleAprovadoId);
            if (cargo) await membro.roles.add(cargo);
            await interaction.update({ content: `Registro aprovado: ${membro.user.tag}`, embeds: [], components: [] });
        }

        if (acao === 'recusar') {
            // Abrir modal para informar motivo da recusa
            const modalRecusa = new ModalBuilder()
                .setCustomId(`recusaModal_${userId}`)
                .setTitle('Motivo da Recusa');

            const motivoInput = new TextInputBuilder()
                .setCustomId('motivo')
                .setLabel('Por que este registro foi recusado?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modalRecusa.addComponents(new ActionRowBuilder().addComponents(motivoInput));
            await interaction.showModal(modalRecusa);
        }
    }

    // --- SUBMISSÃO DO MODAL DE RECUSA ---
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('recusaModal_')) {
        const userId = interaction.customId.split('_')[1];
        const motivo = interaction.fields.getTextInputValue('motivo');
        const membro = await interaction.guild.members.fetch(userId);

        await interaction.update({ content: `Registro recusado: ${membro.user.tag}\nMotivo: ${motivo}`, embeds: [], components: [] });
    }
});

client.login(token);

// --- SERVIDOR WEB PARA UPTIMEROBOT ---
const app = express();
app.get('/', (req, res) => res.send('Bot Discord está online!'));
app.listen(3000, () => console.log('Servidor web rodando na porta 3000'));
