const express = require('express');
const router = express.Router();
const Group = require('../models/Group.model');
const UserTokenVerify = require('../configs/UserTokenVerify.config');
const GroupValidator = require('../validators/group.validator');


router.get('/groups', UserTokenVerify, async (req, res) => {
    const user_id = req.user._id;
    try {
        const groups = await Group.find({ user: user_id });
        return res.status(200).json(groups);
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});

router.post('/create', UserTokenVerify, async (req, res) => {
    const { error } = GroupValidator.createGroupValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user_id = req.user._id;

    let group;
    try {
        group = await Group.findOne({ user: user_id, name: req.body.name });
    }catch(error){
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if(group) return res.status(400).json({ error: 'Group already exists' });

    const newGroup = new Group({
        user: user_id,
        name: req.body.name
    });

    try {
        await newGroup.save();
        return res.status(201).json({ message: 'Group created successfully' });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});


module.exports = router;