const QRCode = require('qrcode');

const url = '${API_URL}/bill/token/abc123'; // token buraya

QRCode.toFile('table1.png', url, (err) => {
  if (err) throw err;
  console.log('QR oluşturuldu!');
});