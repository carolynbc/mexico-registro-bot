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
            .setLabel('Iniciar')
            .setStyle(ButtonStyle.Success)
        );

    canal.send({ content: '**Solicitação de Recrutamento**\n\n**Informações necessárias:**\nId no RP\nNome no RP\nCelular no RP\nNome do Recrutador\n\n**Importante:**\nEnvie apenas 1 solicitação!\nQualquer dúvida, entre em contato com seu recrutador!', components: [row] });
});

client.on('interactionCreate', async interaction => {

    // --- BOTÃO DE REGISTRO ---
    if (interaction.isButton() && interaction.customId === 'registrar') {
        const modal = new ModalBuilder()
            .setCustomId('registroModal')
            .setTitle('Formulário de Recrutamento');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome no RP')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const idInput = new TextInputBuilder()
            .setCustomId('id')
            .setLabel('ID no RP')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const telefoneInput = new TextInputBuilder()
            .setCustomId('telefone')
            .setLabel('Celular no RP')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const recrutadorInput = new TextInputBuilder()
            .setCustomId('recrutador')
            .setLabel('Nome do Recrutador')
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
            .setTitle('Solicitação de Recrutamento')
            .setColor('Blue')
            .setDescription('Dados da Solicitação')
            .addFields(
                { name: 'Nome no RP', value: nome, inline: true },
                { name: 'Id no RP', value: id, inline: true },
                { name: 'Celular no RP', value: telefone, inline: true },
                { name: 'Nome do Recrutador', value: recrutador, inline: true }
            )
            .setFooter({ text: 'Stevezin Free - Exclusividades na versão Premium (link na Bio)' });

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

            const embedAprovado = new EmbedBuilder()
                .setTitle('Recrutamento Aprovado')
                .setColor('Green')
                .setDescription('Status: Aprovado')
                .addFields(
                    { name: 'Usuário', value: `<@${userId}>`, inline: true },
                    { name: 'Data', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Stevezin Free - Exclusividades na versão Premium (link na Bio)' });

            await interaction.update({ embeds: [embedAprovado], components: [] });
        }

        if (acao === 'recusar') {
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

        const embedRecusado = new EmbedBuilder()
            .setTitle('Recrutamento Recusado')
            .setColor('Red')
            .setDescription('Status: Recusado')
            .addFields(
                { name: 'Usuário', value: `<@${userId}>`, inline: true },
                { name: 'Motivo', value: motivo, inline: false },
                { name: 'Data', value: new Date().toLocaleString(), inline: true }
            )
            .setFooter({ text: 'Stevezin Free - Exclusividades na versão Premium (link na Bio)' });

        await interaction.update({ embeds: [embedRecusado], components: [] });
    }
});

client.login(token);

// --- SERVIDOR WEB PARA UPTIMEROBOT ---
const app = express();
app.get('/', (req, res) => res.send('Bot Discord está online!'));
app.listen(3000, () => console.log('Servidor web rodando na porta 3000'));
