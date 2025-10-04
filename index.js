const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } = require('discord.js');
const { token, registroChannelId, roleAprovadoId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', async () => {
    console.log(`${client.user.tag} está online!`);
    
    // Criação de botão de registro no canal
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
    if (interaction.isButton()) {
        if (interaction.customId === 'registrar') {
            const modal = new ModalBuilder()
                .setCustomId('registroModal')
                .setTitle('Formulário de Registro');

            const nomeInput = new TextInputBuilder()
                .setCustomId('nome')
                .setLabel('Seu Nome')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const idadeInput = new TextInputBuilder()
                .setCustomId('id')
                .setLabel('Seu ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const motivoInput = new TextInputBuilder()
                .setCustomId('telefone')
                .setLabel('Seu Telefone')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

	    const motivoInput = new TextInputBuilder()
                .setCustomId('recrutador')
                .setLabel('Recrutador(a)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(nomeInput);
            const secondRow = new ActionRowBuilder().addComponents(idadeInput);
            const thirdRow = new ActionRowBuilder().addComponents(motivoInput);

            modal.addComponents(firstRow, secondRow, thirdRow);
            await interaction.showModal(modal);
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'registroModal') {
            const nome = interaction.fields.getTextInputValue('nome');
            const idade = interaction.fields.getTextInputValue('idade');
            const motivo = interaction.fields.getTextInputValue('motivo');

            const embed = new EmbedBuilder()
                .setTitle('Novo Registro')
                .setDescription(`**Nome:** ${nome}\n**ID:** ${id}\n**Telefone:** ${telefone} \n**Recrutador(a):** ${recrutador}`)
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
    }

    if (interaction.isButton()) {
        const [acao, userId] = interaction.customId.split('_');
        const membro = await interaction.guild.members.fetch(userId);

        if (acao === 'aprovar') {
            const cargo = interaction.guild.roles.cache.get(roleAprovadoId);
            if (cargo) await membro.roles.add(cargo);
            await interaction.update({ content: `Registro aprovado: ${membro.user.tag}`, embeds: [], components: [] });
        }

        if (acao === 'recusar') {
            await interaction.update({ content: `Registro recusado: ${membro.user.tag}`, embeds: [], components: [] });
        }
    }
});

client.login(token);
