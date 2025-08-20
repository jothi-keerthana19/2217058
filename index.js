const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const shortUrls = {}; 

function generateShortcode() {
  return crypto.randomBytes(3).toString('base64url');
}

app.post('/shorturls', (req, res) => {
  const { url, validity = 30, shortcode } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }
  let code = shortcode || generateShortcode();

  while (shortUrls[code]) {
    code = generateShortcode();
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + validity * 60000);
  shortUrls[code] = {
    url,
    createdAt: now.toISOString(),
    expiry: expiry.toISOString(),
    clicks: [],
    totalClicks: 0,
  };
  res.status(201).json({
    shortlink: `https://${req.hostname}:${PORT}/${code}`,
    expiry: expiry.toISOString(),
  });
});

app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const data = shortUrls[shortcode];
  if (!data) {
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  res.json({
    originalUrl: data.url,
    createdAt: data.createdAt,
    expiry: data.expiry,
    totalClicks: data.totalClicks,
    clicks: data.clicks,
  });
});

app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const data = shortUrls[shortcode];
  if (!data) {
    return res.status(404).send('Short URL not found');
  }
  const now = new Date();
  if (now > new Date(data.expiry)) {
    return res.status(410).send('Short URL expired');
  }
 
  data.totalClicks += 1;
  data.clicks.push({
    timestamp: now.toISOString(),
    referrer: req.get('referer') || null,
    geo: req.ip, 
  });
  res.redirect(data.url);
});


app.get('/', (req, res) => {
  res.send('URL Shortener Service is running!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

