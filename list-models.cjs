const https = require('https');

const apiKey = 'AIzaSyDLZbvwEHTR5gvZqSm15xjQZcHd9U3p5gE';

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Models:", JSON.parse(data));
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
