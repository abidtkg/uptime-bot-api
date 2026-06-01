const express = require('express');
const router = express.Router();
const AuthValidator = require('../validators/auth.validator');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const AdminTokenVerify = require('../configs/AdminTokenVerify.config');

/**
* @swagger
*   /auth/login:
*   post:
*       description: Login to a user account
*       summary: 
*       tags:
*           - Authentication
*       responses:
*           '200':
*               description: User logged in successfully.
*               schema:
*                 type: object
*                 properties:
*                   name:
*                       type: string
*                   email:
*                       type: string
*                   token:
*                       type: string
*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                   type: object
*                   properties:
*                       error:
*                           type: string
*       parameters:
*         - in: body
*           name: user
*           description: User login details
*           schema:
*              type: object
*              properties:
*                  email:
*                      type: string
*                  password:
*                      type: string
*/
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

    const token = JWT.sign({ id: user._id }, process.env.USER_JWT_SECRET, { expiresIn: process.env.USER_JWT_EXPIRES_IN });
    return res.status(200).json({ token: token, name: user.name, email: user.email });
});


/**
* @swagger
*   /auth/register:
*   post:
*       description: Register a new user account
*       summary: 
*       tags:
*           - Authentication
*       responses:
*           '200':
*               description: User registered successfully.
*               schema:
*                 type: object
*                 properties:
*                   name:
*                       type: string
*                   email:
*                       type: string
*                   token:
*                       type: string

*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                   type: object
*                   properties:
*                       error:
*                           type: string
*       parameters:
*         - in: body
*           name: user
*           description: User login details
*           schema:
*              type: object
*              properties:
*                  name:
*                      type: string
*                  email:
*                      type: string
*                  password:
*                      type: string
*/
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


/**
* @swagger
*   /auth/admin/login:
*   post:
*       description: Login to an admin account
*       summary: 
*       tags:
*           - Authentication
*       responses:
*           '200':
*               description: Admin logged in successfully.
*               schema:
*                 type: object
*                 properties:
*                   name:
*                       type: string
*                   email:
*                       type: string
*                   token:
*                       type: string
*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                   type: object
*                   properties:
*                       error:
*                           type: string
*       parameters:
*         - in: body
*           name: user
*           description: User login details
*           schema:
*              type: object
*              properties:
*                  email:
*                      type: string
*                  password:
*                      type: string
*/
router.post('/admin/login', async (req, res) => {
    const { error } = AuthValidator.loginValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user;
    try {
        user = await Admin.findOne({ email: req.body.email });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = JWT.sign({ id: user._id }, process.env.ADMIN_JWT_SECRET, { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN });
    return res.status(200).json({ token: token, name: user.name, email: user.email });
});


/**
* @swagger
*   /auth/admin/register:
*   post:
*       description: Register a new admin account
*       summary: 
*       tags:
*           - Authentication
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: Admin registered successfully.
*               schema:
*                 type: object
*                 properties:
*                   name:
*                       type: string
*                   email:
*                       type: string
*                   token:
*                       type: string

*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                   type: object
*                   properties:
*                       error:
*                           type: string
*       parameters:
*         - in: body
*           name: user
*           description: Admin login details
*           schema:
*              type: object
*              properties:
*                  name:
*                      type: string
*                  email:
*                      type: string
*                  password:
*                      type: string
*/
router.post('/admin/register', AdminTokenVerify, async (req, res) => {
    const { error } = AuthValidator.registerValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user;
    try {
        user = await Admin.findOne({ email: req.body.email });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if (user) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new Admin({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        return res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});

module.exports = router;