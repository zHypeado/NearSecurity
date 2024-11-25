//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

require('dotenv').config();
const Timers = require('../schemas/timersSchema');
const Guild = require('../schemas/guildsSchema');
const { pulk } = require('../functions');
const { version} = require("../package.json");

module.exports = async (client) => {
  
  client.guilds.cache.get("YOUR-STAFF-SERVER").members.fetch();

  const states = [
    'a ${userCount} usuarios',
    'a ${serverCount} servidores',
    'n!ayuda',
    'la versión ' + version + ''
  ];

  let stateIndex = 0; 

  const updateStatus = async () => {
    const serverCount = client.guilds.cache.size;
    let userCount = 0;

    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch(); 
      userCount += guild.memberCount; 
    }

    // Set the current state based on the index
    let currentState = states[stateIndex];
    currentState = currentState.replace('${userCount}', userCount).replace('${serverCount}', serverCount);

    // Update bot status
    client.user.setActivity(currentState, {
      type: 'WATCHING' 
    });

    stateIndex = (stateIndex + 1) % states.length;
  };

  // Update status initially
  await updateStatus();

  setInterval(updateStatus, 5000);

  setTimeout(async () => {

    // Timers logic
    let _timers = await Timers.findOne({});
    let count = 0;

    if (!_timers.servers) return;

    for (const x of _timers.servers) {
      if (typeof x !== 'string') return;
      let _guild = await Guild.findOne({ id: x });
      if (!_guild) {
        _timers.servers = await pulk(_timers.servers, x);
        _timers.save();
        return;
      }
      let LANG = require(`../LANG/${_guild.configuration.language}.json`);

      _guild.moderation.dataModeration.timers.forEach(async (i) => {
        if (Date.now() > i.endAt) {
          try {
            if (i.action === 'UNBAN') {
              await client.guilds.cache.get(x).members.unban(i.user.id);
              client.channels.cache.get(i.channel).send(`${LANG.events.ready.theUser} \`${i.user.username}\` ${LANG.events.ready.unbanned} \`${i.inputTime}\`.`);  

            } else if (i.action === 'UNMUTE') {
              const member = await client.guilds.cache.get(x).members.cache.get(i.user.id);
              await member.roles.remove(_guild.moderation.dataModeration.muterole);
              i.user.roles.forEach(async (n) => {
                await member.roles.add(n); 
              });
              client.channels.cache.get(i.channel).send(`${LANG.events.ready.theUser} \`${i.username}\` ${LANG.events.ready.unmuted} \`${i.inputTime}\`.`);
            }


          } catch (err) {
          }
        }
      });
    }
  }, 60000);
};