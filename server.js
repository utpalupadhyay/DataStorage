const express = require('express');
const cors = require('cors');
const path = require('path');
const policiesHandler = require('./api/policies');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Route API requests to serverless handler
app.all('/api/policies', (req, res) => {
    policiesHandler(req, res);
});

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` LIC Policy Server running on http://localhost:${PORT}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/policies`);
    console.log(`====================================================`);
});
