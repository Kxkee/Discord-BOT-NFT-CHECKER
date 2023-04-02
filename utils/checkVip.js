const { createClient } = require('@supabase/supabase-js');


const utils = {
    supabase: createClient('https://mbsubdfkquqteagazpdj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ic3ViZGZrcXVxdGVhZ2F6cGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAzNzY1NTMsImV4cCI6MTk5NTk1MjU1M30.U6QAWghxaVP2JTTROx6c_HI4K6VBdw3onsFzkbo6j1M'),
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