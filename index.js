const { Client, LocalAuth  , MessageMedia} = require('whatsapp-web.js');
const qrcode = require("qrcode-terminal");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
       }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
  
    const groupName = await chat.name;
  
  
    const welcomeMessage = `Selamat datang di grup ${groupName}, Member Baru! Kenalin admin ganteng @Risnanto (6282136600468) 🎉`;
  
    chat.sendMessage(welcomeMessage);
    const rules =
      "Ini adalah rules grup:\n\n" +
      "1. jangan membuly (atmin) \n" +
      "2. Ketemu nick (Pemula , Blast_ID) lock aja"+
      "3. Share link wajib yang bermanfaat \n" +
      "4. War jam 8 malam (wajib setiap malming) / setiap hari \n"+
      "5. webiste atmin : www.jongnesia.com"; 
  
    await chat.sendMessage(rules);
  
    const intro =
    "Yuk intro biar saling kenal \n\n"+
    "Nama : \n\n"+
    "Umur : \n\n"+
    "Asal : \n\n"+
    "Nick Game : \n\n"+
    "Main berapa jari: \n\n";
    await chat.sendMessage(intro);
  });

  client.on('message', async (msg) =>{
    if(msg.body.startsWith('!sticker') && msg.type === 'image'){
      const media = await msg.downloadMedia();
      client.sendMessage(msg.from,media,{
        sendMediaAsSticker:true,
      });
    }
  });
 

  const userWarnings = {}; 

  client.on('message', async (message) => {
      const badWords = ['cok', 'anjing', 'babi', 'monyet', 'kunyuk', 'bajingan', 'asu', 'bangsat', 'kampret', 'anj', 'kntl', 'jnck', 'jnco', 'asw', 'memek', 'mmk', 'jembut', 'jmbt', 'jembot', 'ngen', 'ngentot', 'ngemtod', 'ngentod', 'ngewe', 'ngew'];
      const sender = await message.getContact();
      const userId = sender.id._serialized;

      const content = message.body.toLowerCase();
      const containsBadWord = badWords.some((word) => content.includes(word));

      if (containsBadWord) {
          if (!userWarnings[userId]) {
              userWarnings[userId] = 1;
              message.reply('Jangan berkata kasar. Ini peringatan pertama.');
          } else {
                 userWarnings[userId]++;
                  message.reply(`Jangan berkata kasar. Ini peringatan ke-${userWarnings[userId]}.`);
            }
          
      }
  });


client.initialize();
