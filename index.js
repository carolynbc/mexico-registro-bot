const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// IDs dos canais
const canalRegistroId = 'ID_DO_CANAL_DE_REGISTRO'; // Canal onde o usuário vai iniciar o registro
const canalAprovacaoId = 'ID_DO_CANAL_DE_APROVACAO'; // Canal onde a equipe aprova ou recusa

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    // BOTÃO INICIAR
    if (interaction.isButton() && interaction.customId === 'iniciar_registro') {
        // Cria o modal de registro
        const modal = new ModalBuilder()
            .setCustomId('modal_registro')
            .setTitle('Formulário de Registro');

        const inputNome = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel("Nome no RP")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputId = new TextInputBuilder()
            .setCustomId('id')
            .setLabel("ID no RP")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputTelefone = new TextInputBuilder()
            .setCustomId('telefone')
            .setLabel("Celular no RP")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputRecrutador = new TextInputBuilder()
            .setCustomId('recrutador')
            .setLabel("Nome do Recrutador")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(inputNome);
        const row2 = new ActionRowBuilder().addComponents(inputId);
        const row3 = new ActionRowBuilder().addComponents(inputTelefone);
        const row4 = new ActionRowBuilder().addComponents(inputRecrutador);

        modal.addComponents(row1, row2, row3, row4);

        await interaction.showModal(modal);
    }

    // MODAL DE REGISTRO
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_registro') {
        const nome = interaction.fields.getTextInputValue('nome');
        const id = interaction.fields.getTextInputValue('id');
        const telefone = interaction.fields.getTextInputValue('telefone');
        const recrutador = interaction.fields.getTextInputValue('recrutador');

        const embedRegistro = new EmbedBuilder()
            .setTitle('Novo Registro')
            .setColor('Yellow')
            .setDescription(`**Nome:** ${nome}\n**ID:** ${id}\n**Telefone:** ${telefone}\n**Recrutador:** ${recrutador}`);

        const botoes = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('aprovar')
                    .setLabel('Aprovar ✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('recusar')
                    .setLabel('Recusar ❌')
                    .setStyle(ButtonStyle.Danger)
            );

        const canalAprovacao = interaction.guild.channels.cache.get(canalAprovacaoId);
        if (!canalAprovacao) return interaction.reply({ content: 'Canal de aprovação não encontrado!', ephemeral: true });

        await canalAprovacao.send({ embeds: [embedRegistro], components: [botoes] });
        await interaction.reply({ content: 'Seu registro foi enviado para aprovação!', ephemeral: true });
    }

    // APROVAÇÃO/RECUSA
    if (interaction.isButton() && (interaction.customId === 'aprovar' || interaction.customId === 'recusar')) {
        const embedOriginal = interaction.message.embeds[0];
        if (!embedOriginal) return interaction.reply({ content: 'Embed não encontrado!', ephemeral: true });

        const nome = embedOriginal.description.match(/\*\*Nome:\*\* (.+)/)[1];

        if (interaction.customId === 'aprovar') {
            await interaction.update({ content: `✅ Registro de ${nome} aprovado!`, embeds: [], components: [] });
        }

        if (interaction.customId === 'recusar') {
            await interaction.reply({ content: 'Digite o motivo da recusa:', ephemeral: true });

            const filtro = m => m.author.id === interaction.user.id;
            const coletor = interaction.channel.createMessageCollector({ filter: filtro, max: 1, time: 60000 });

            coletor.on('collect', async m => {
                await interaction.editReply({ content: `❌ Registro de ${nome} recusado!\nMotivo: ${m.content}` });
            });
        }
    }
});

// MENSAGEM DE INTRODUÇÃO
client.on('messageCreate', async message => {
    if (message.channel.id === canalRegistroId && message.content.toLowerCase() === '!registrar') {
        const botoes = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('iniciar_registro')
                    .setLabel('Iniciar')
                    .setStyle(ButtonStyle.Primary)
            );

        const embedIntro = new EmbedBuilder()
            .setTitle('Solicitação de Recrutamento')
            .setColor('Green')
            .setDescription(
`**Informações necessárias**
Id no RP
Nome no RP
Celular no RP
Nome do Recrutador

**Importante**
Envie apenas 1 solicitação!
Qualquer dúvida, entre em contato com seu recrutador!`
            );

        await message.channel.send({ embeds: [embedIntro], components: [botoes] });
    }
});

client.login(process.env.TOKEN);
