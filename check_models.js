const https = require('https');

const apiKey = 'AIzaSyChCqpAicohrpoyQkxpBX572h_luSR9HAE';
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
