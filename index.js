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


  const hariTarget = 6; // 0 adalah hari Minggu
  const jamTarget = 20; // 20 adalah jam 8 malam
  const menitTarget = 0; // 20 adalah menit ke-20

  setInterval(async () => {
    const sekarang = new Date();
    const hariSekarang = sekarang.getDay(); // Mengembalikan hari dalam bentuk 0 (Minggu) hingga 6 (Sabtu)
    const jamSekarang = sekarang.getHours(); // Mengembalikan jam dalam bentuk 0 hingga 23
    const menitSekarang = sekarang.getMinutes(); // Mengembalikan menit dalam bentuk 0 hingga 59

    if (hariSekarang === hariTarget && jamSekarang === jamTarget && menitSekarang === menitTarget) {
      // Waktu sesuai (Pada pukul 20:20), kirim pesan ke grup
      const grupId = '120363165617555333@g.us'; // Ganti dengan ID grup yang sesuai
      const pesanNotifikasi = 'Assalamualaikum Hari ini Sabtu malam minggu, diusahakan nanti jam 8 malam war, Bagi yang tidak ikut war akan saya tusbol. sekian terimakasih. ~ Bot Admin';

      // Kirim pesan ke grup
      await client.sendMessage(grupId, pesanNotifikasi);
      console.log('Pesan berhasil dikirim ke grup!');
    }
  }, 60000);

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

  if(msg.body.startsWith('.sticker') && msg.type === 'image'){
      const media = await msg.downloadMedia();
      client.sendMessage(msg.from,media,{
        sendMediaAsSticker:true,
      });
    }

  if (msg.body === '.update') {
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

  // Dapatkan URL gambar dari item yang dipilih
  const imageUrl = randomItem.thumbnail;

  // Download gambar
  const imageFileName = `pekob_${Date.now()}.jpg`;
  const imagePath = path.join('/root/botwa/goverment/pekob', imageFileName);

  try {
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
      const linkMessage = `Link nya bor : \n${randomItem.href}`;
      await msg.reply(linkMessage);
    });
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    await msg.reply('Maaf, terjadi kesalahan saat mengirim gambar.');
  }
}

if (msg.body === '.getgroupinfo') {
  // Dapatkan informasi grup
  const chat = await msg.getChat();
  const groupName = chat.name;
  const groupId = chat.id._serialized; // Ini adalah ID grup

  // Kirim informasi grup sebagai pesan
  const infoMessage = `Nama Grup: ${groupName}\nID Grup: ${groupId}`;
  await msg.reply(infoMessage);
}


if (msg.body === '.oppai') {
  try {
    // Ganti dengan URL API yang sesuai untuk mengambil gambar oppai secara dinamis
    const apiUrl = 'https://api.waifu.im/search?included_tags=oppai';
    const response = await axios.get(apiUrl);

    if (response.status === 200 && response.data.images.length > 0) {
      const imageUrl = response.data.images[0].url; // Mengambil URL gambar dari hasil API
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      if (imageResponse.status === 200) {
        // Mengonversi data gambar ke format pesan media WhatsApp
        const media = new MessageMedia('image/png', imageResponse.data.toString('base64'));
        const caption = 'Ini oppai nya para pengocok handal';

        // Mengirim pesan dengan media dan teks
        await client.sendMessage(msg.from, media, { caption });
      } else {
        await client.sendMessage(msg.from, 'Tidak dapat mengunduh gambar oppai saat ini.');
      }
    } else {
      await client.sendMessage(msg.from, 'Tidak ada gambar oppai yang ditemukan.');
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    await client.sendMessage(msg.from, 'Terjadi kesalahan saat mengunduh gambar oppai.');
  }
}

if (msg.body === '.menu') {
  const menuMessage = `
📋 *Menu Utama* 📋

*1. Stiker*
Kirim gambar dengan caption ".stiker" untuk mengubahnya menjadi stiker.

*2. Meme Acak*
Kirim ".meme" untuk mendapatkan meme acak.

*3. Pekob of the Day*
Kirim ".pekob" untuk melihat Pekob of the Day.

*4. Info Grup*
Kirim ".getgroupinfo" untuk mendapatkan informasi tentang grup ini.

*5. Oppai Seksi*
Kirim ".oppai" untuk melihat gambar oppai seksi. 😏

Selamat menikmati penggunaan bot ini! 🤖🎉
  `;

  // Mengirim pesan menu ke pengguna
  await client.sendMessage(msg.from, menuMessage);
}







});


// Menangani pesan yang diterima
client.on('message', async (message) => {
  const userMessage = message.body.toLowerCase(); // Mengubah pesan pengguna menjadi huruf kecil

  // Memeriksa apakah pesan pengguna mengandung perintah yang sesuai
  if (userMessage.startsWith('.kirim ')) {
    const command = userMessage.slice(7); // Menghilangkan perintah dari pesan pengguna

    // Memeriksa apakah pesan mengandung spasi
    const spaceIndex = command.indexOf(' ');

    // Memeriksa apakah pesan memiliki spasi dan panjang pesan cukup
    if (spaceIndex !== -1 && spaceIndex + 1 < command.length) {
      const targetNumber = command.slice(0, spaceIndex);
      const textToSend = command.slice(spaceIndex + 1);

      // Memastikan nomor target dan pesan tidak kosong
      if (targetNumber && textToSend) {
        // Kirim pesan ke nomor target
        await client.sendMessage(`${targetNumber}@c.us`, textToSend);
        message.reply(`Pesan berhasil dikirim ke ${targetNumber}`);
      } else {
        message.reply('Format perintah salah. Gunakan format ".kirim nomorpesan".');
      }
    } else {
      message.reply('Format perintah salah. Gunakan format ".kirim nomorpesan".');
    }
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
