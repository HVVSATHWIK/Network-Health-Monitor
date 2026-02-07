const https = require('https');

const apiKey = 'AIzaSyBOJPgpmOwb5Sjfj_aTYDOsEHaLMCkHUX4';
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

console.log('Fetching:', url);

https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
