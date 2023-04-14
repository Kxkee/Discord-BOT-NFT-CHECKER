const { createClient } = require('@supabase/supabase-js');


const utils = {
    supabase: createClient(`${process.env.SUPABASE_URL}`, `${process.env.SUPABASE_KEY}`),
    checkVip: async (discordId) => {
    const {data: user, error} = await utils.supabase
        .from('discordUser')
        .select()
        .eq("discord_id", discordId);
    if (user.length === 0) return false
    return true;
    }
}


module.exports = utils;