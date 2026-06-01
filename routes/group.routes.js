const express = require('express');
const router = express.Router();
const Group = require('../models/Group.model');
const UserTokenVerify = require('../configs/UserTokenVerify.config');
const GroupValidator = require('../validators/group.validator');


/**
* @swagger
*   /group/groups:
*   get:
*       description: Get list of groups
*       summary: 
*       tags:
*           - Groups
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: List of groups retrieved successfully.
*               schema:
*                 type: object
*                 properties:
*                   _id:
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
*/
router.get('/groups', UserTokenVerify, async (req, res) => {
    const user_id = req.user.id;
    try {
        const groups = await Group.find({ user: user_id });
        return res.status(200).json(groups);
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});


/**
* @swagger
*   /group/create:
*   post:
*       description: Create a new group
*       summary: 
*       tags:
*           - Groups
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: Group created successfully.
*               schema:
*                 type: object
*                 properties:
*                   message:
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
*           name: group
*           description: Group details
*           schema:
*              type: object
*              properties:
*                  name:
*                      type: string
*/
router.post('/create', UserTokenVerify, async (req, res) => {
    const { error } = GroupValidator.createGroupValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user_id = req.user.id;

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


/**
* @swagger
*   /group/update/:id:
*   patch:
*       description: Update an existing group
*       summary: 
*       tags:
*           - Groups
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: Group created successfully.
*               schema:
*                 type: object
*                 properties:
*                   message:
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
*           name: group
*           description: Group details
*           schema:
*              type: object
*              properties:
*                  name:
*                      type: string
*/
router.patch('/update/:id', UserTokenVerify, async (req, res) => {
    const { error } = GroupValidator.createGroupValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user_id = req.user.id;
    const group_id = req.params.id;

    let group;
    try {
        group = await Group.findOne({ _id: group_id, user: user_id });
    }catch(error){
        return res.status(500).json({ error: '500 Internal Server Error' });
    }

    if(!group) return res.status(404).json({ error: 'Group not found' });

    group.name = req.body.name;

    try {
        await group.save();
        return res.status(200).json({ message: 'Group updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error' });
    }
});


module.exports = router;