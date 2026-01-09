const https = require('https');

const data = JSON.stringify({
    imageUrl: 'https://images.unsplash.com/photo-1610375461490-6d615d985552',
    linkUrl: 'https://eeyagold.com'
});

const options = {
    hostname: 'eeya-gold-backend.onrender.com',
    port: 443,
    path: '/content/banners',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
