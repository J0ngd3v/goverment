const { Client, LocalAuth , MessageMedia  } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

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

  if (msg.body === '!update') {
    const scrapedData = await scrapeData();
    saveToJson(scrapedData, 'meme.json');
    
    const chatId = msg.from;
    const notificationMessage = `Data berhasil diperbarui dan disimpan dalam file JSON. 👍`;
    client.sendMessage(chatId, notificationMessage);
  }

 if (msg.body === '.meme') {
  const randomMemeUrl = getRandomMeme();
  if (randomMemeUrl) {
    try {
      const memeImageData = await fetchImageData(randomMemeUrl);
      const memeFileName = `meme_${Date.now()}.jpg`;

      // Simpan gambar ke folder lokal
      const memeFolderPath = '/root/botwa/goverment/memes'; 
      const memeFilePath = path.join(memeFolderPath, memeFileName);  // Menggunakan path.join
      fs.writeFileSync(memeFilePath, memeImageData);

      // Kirim gambar ke pengguna
      const media = MessageMedia.fromFilePath(memeFilePath);  // Menggunakan fromFilePath
      await client.sendMessage(msg.from, media);
      
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      await client.sendMessage(msg.from, 'Maaf, terjadi kesalahan saat mengirim meme.');
    }
  } else {
    await client.sendMessage(msg.from, 'Maaf, tidak ada meme tersedia saat ini.');
  }
}
  
if (msg.body === '.pekob') {
  // Baca data dari pekob.json
  const rawData = fs.readFileSync('/root/botwa/goverment/pekob.json');
  const pekobData = JSON.parse(rawData);

  // Pilih acak satu item dari pekobData
  const randomItem = pekobData[Math.floor(Math.random() * pekobData.length)];

  // Dapatkan URL gambar dan thumbnail
  const imageUrl = randomItem.thumbnail;
  const linkUrl = randomItem.href;

  // Download gambar dan simpan ke folder "pekob"
  const imageFileName = path.basename(imageUrl);
  const imagePath = path.join('/root/botwa/goverment/pekob', imageFileName);

  const response = await axios({
    method: 'get',
    url: imageUrl,
    responseType: 'stream',
  });

  response.data.pipe(fs.createWriteStream(imagePath));

  response.data.on('end', async () => {
    // Kirim gambar sebagai media
    const media = MessageMedia.fromFilePath(imagePath);
    await msg.reply(media);

    // Kemudian, kirim pesan teks dengan URL
    const linkMessage = `Link nya bor : \n${linkUrl}`;
    await msg.reply(linkMessage);
  });
}
});




// Fungsi untuk melakukan scraping
async function scrapeData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const url = 'https://www.memetren.my.id/meme';
  await page.goto(url);
  await page.setViewport({ width: 1200, height: 800 });

  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);

  // Lakukan scroll hingga tidak ada penambahan konten baru
  while (previousHeight !== currentHeight) {
    previousHeight = currentHeight;
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000); // Tunggu sebentar setelah scroll
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
  }

  const memeBackgroundImageUrls = await page.evaluate(() => {
    const memeElements = Array.from(document.querySelectorAll('.meme'));

    return memeElements.map(element => {
      const style = window.getComputedStyle(element).getPropertyValue('background-image');
      return style.match(/url\("(.+)"\)/)[1];
    });
  });

  await browser.close();

  return memeBackgroundImageUrls;
}

async function fetchImageData(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  });
  return response.data;
}


// Fungsi untuk menyimpan data ke file JSON
function saveToJson(data, fileName) {
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${fileName}`);
}

// Fungsi untuk mendapatkan URL meme acak dari file meme.json
function getRandomMeme() {
    const memeData = JSON.parse(fs.readFileSync('meme.json', 'utf-8'));
    const randomIndex = Math.floor(Math.random() * memeData.length);
    return memeData[randomIndex];
  }

client.initialize();
