const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'public', 'payments');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const logos = [
  { name: 'mercadopago.png', url: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadopago/logo__small@2x.png' },
  { name: 'yape.png', url: 'https://raw.githubusercontent.com/alvaromaciel/logos-marcas/master/Yape.png' },
  { name: 'plin.png', url: 'https://raw.githubusercontent.com/alvaromaciel/logos-marcas/master/Plin.png' },
  { name: 'visa.png', url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png' },
  { name: 'mastercard.png', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg' }
];

logos.forEach(logo => {
  const filePath = path.join(dir, logo.name);
  https.get(logo.url, (req) => {
      // Si el URL falla en node o redirecciona, usaremos un truco:
  }).on('error', () => {});
});
