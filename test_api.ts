
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/audit/logs/821dfdf3-f4f5-4d30-8ceb-468aa61f92a0/SUPER_ADMIN',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('API RESPONSE STATUS:', res.statusCode);
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json) && json.length > 0) {
                console.log('LATEST LOG:', JSON.stringify(json[0], null, 2));
            } else {
                console.log('FULL BODY:', data);
            }
        } catch (e) {
            console.log('RAW BODY:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
