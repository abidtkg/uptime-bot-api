const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    return res.json({ message: "Welcome to the Uptime Bot API!" });
});

module.exports = router;