const express = require('express');
const router = express.Router();
const AuthValidator = require('../validators/auth.validator');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const User = require('../models/User.model');

router.post('/login', async (req, res) => {
    const { error } = AuthValidator.loginValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user;
    try {
        user = await User.findOne({ email: req.body.email });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    return res.status(200).json({ token: token, name: user.name, email: user.email });
});

router.post('/register', async (req, res) => {
    const { error } = AuthValidator.registerValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user;
    try {
        user = await User.findOne({ email: req.body.email });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if (user) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});

module.exports = router;