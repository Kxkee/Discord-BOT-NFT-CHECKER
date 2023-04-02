const { Client, Events, GatewayIntentBits, SlashCommandBuilder, inlineCode } = require('discord.js');
const { token } = require('./config.json');
const { ethers } = require("ethers");
const odysseyAbi = require("./abi/odissey.json");
const { createClient } = require('@supabase/supabase-js');
const {checkVip, supabase} = require('./utils/checkVip');

const odysseyContractAddress = "0xfAe39eC09730CA0F14262A636D2d7C5539353752";
const provider = new ethers.AlchemyProvider("arbitrum", "Nzh8TUnFXk60XRVydoI54LjgvDz6h39d");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.ClientReady, async () => {
    const link = new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link you wallet to our server.');

    const getAddress = new SlashCommandBuilder()
        .setName('get-address')
        .setDescription('Check your linked address');

    const getVip = new SlashCommandBuilder()
        .setName('get-vip')
        .setDescription('claim your vip role !');

    // Register the slash command with Discord
    const linkCommand = await client.application.commands.create(link);
    console.log(`Registered command ${linkCommand.name} (${linkCommand.id})`);

    const getAddressCommand = await client.application.commands.create(getAddress);
    console.log(`Registered command ${getAddressCommand.name} (${getAddressCommand.id})`);

    const getVipCommand = await client.application.commands.create(getVip);
    console.log(`Registered command ${getVipCommand.name} (${getVipCommand.id})`);
});


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (commandName === 'link') {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.user.send(`Link your address here : http://localhost:3000/connect?id=${user.id}`);
            await interaction.reply({ content: "Link sent!", ephemeral: true });
        }
    } else if (commandName === 'get-address') {
        const { data, error } = await supabase
            .from('discordUser')
            .select()
            .eq('discord_id', user.id);

        if (error) {
            console.error(error);
            return;
        }

        if (data.length === 0) {
            await interaction.reply({ content: "You haven't linked your wallet address yet. Use /link", ephemeral: true });
            return;
        }

        const walletAddress = data[0].wallet_address;
        const code = inlineCode(walletAddress)
        await interaction.reply({ content: `Your linked wallet address is: ${code}`, ephemeral: true });
    } else if(commandName === "get-vip") {
        const { data: userInfo, error } = await supabase
            .from('discordUser')
            .select()
            .eq("discord_id", user.id);
        if(userInfo[0]) {
            const odysseyContract = new ethers.Contract(odysseyContractAddress, odysseyAbi, provider);
            const balance = await odysseyContract.balanceOf(userInfo[0].wallet_address);
            if(Number(balance) >= 1 ) {
                const guild = client.guilds.cache.get('419116853047197696');
                const member = await guild.members.fetch(user.id);
                if (member.roles.cache.has('1091848441199599778')) {
                    await interaction.reply({ content: "You already claim your vip.", ephemeral: true });
                    return
                }
                await member.roles.add('1091848441199599778');
                await interaction.reply({ content: "Your vip role has been claim, you can now check our several channel !", ephemeral: true });
            } else {
                await interaction.reply({ content: "You don't have our NFT to get access to vip role.", ephemeral: true });
            }
        } else {
            await interaction.reply({ content: "You didn't linked your wallet or your don't have our NFT in your wallet.", ephemeral: true });
        }
    }
});

client.on(Events.ClientReady, async () => {
    const interval = 2 * 60 * 1000;

    setInterval(async () => {
        const { data: users, error } = await supabase
            .from('discordUser')
            .select()

        if (error) {
            console.error(error);
            return;
        }

        const guild = await client.guilds.fetch('419116853047197696');
        const vipMembers = [];
        const members = await guild.members.fetch();
        for(const member of members.values()) {
            if(member._roles.includes("1091848441199599778")) {
                vipMembers.push(member.id);
            }
        }


        for(const member of vipMembers) {
            const isInBDD = await checkVip(member);
            if(!isInBDD) {
                const guild = client.guilds.cache.get('419116853047197696');
                const user = await guild.members.fetch(member);
                await user.roles.remove("1091848441199599778");
                const index = vipMembers.indexOf(member)
                vipMembers.splice(index, 1);
            }
        }
        //console.log(vipMembers);
        // Itérer sur chaque utilisateur et vérifier s'ils possèdent toujours le NFT
        for (const user of users) {
            const walletAddress = user.wallet_address;
            const odysseyContract = new ethers.Contract(odysseyContractAddress, odysseyAbi, provider);
            const balance = await odysseyContract.balanceOf(walletAddress);

            if (Number(balance) === 0) { // Si l'utilisateur ne possède plus le NFT, retirer le rôle

                const { error } = await supabase
                    .from('discordUser')
                    .delete()
                    .eq('discord_id', user.discord_id);

                const guild = client.guilds.cache.get('419116853047197696'); // Remplacez 'guildId' par l'ID de votre serveur Discord
                if(user.discord_id <= 9223372036854775807) {
                    const member = await guild.members.fetch(user.discord_id).catch(() => null);
                    if(member) {
                        if (member.roles.cache.has('1091848441199599778')) { // Vérifier si l'utilisateur a déjà le rôle
                            await member.roles.remove('1091848441199599778');
                        }
                    }

                }

            }
        }
    }, 30000);
});

client.login(token);
