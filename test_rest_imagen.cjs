
const https = require('https');

const API_KEY = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';
const MODEL = 'imagen-3.0-generate-001';

const data = JSON.stringify({
    instances: [
        { prompt: "A photorealistic image of a futuristic banana" }
    ],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
    }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${MODEL}:predict?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Testing REST Call to:", options.path);

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log("BODY:", body.substring(0, 500)); // Print first 500 chars
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
