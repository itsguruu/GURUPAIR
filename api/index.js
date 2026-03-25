const express = require('express');
const app = require('./index');

module.exports = (req, res) => {
    // Wrap the Express app for Vercel serverless deployment
    return app(req, res);
};