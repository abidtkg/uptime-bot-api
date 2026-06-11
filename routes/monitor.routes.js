const express = require('express');
const router = express.Router();
const UserTokenVerify = require('../configs/UserTokenVerify.config');
const Monitor = require('../models/Monitor.model');
const MonitorValidator = require('../validators/monitor.validator');
const ENUM_CONFIG = require('../configs/enums.config');
const mongoose = require('mongoose');

/**
* @swagger
*   /monitor/monitors:
*   get:
*       description: Get list of monitors
*       summary: 
*       tags:
*           - Monitors
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: List of monitors retrieved successfully.
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
*       parameters:
*         - in: query
*           name: skip
*           schema:
*             type: integer
*           required: true
*           default: 0
*         - in: query
*           name: limit
*           schema:
*             type: integer
*           required: true
*           default: 10
*/
router.get('/monitors', UserTokenVerify, async (req, res) => {
    const userId = req.user.id;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const monitors = await Monitor.find({user: userId}).skip(skip).limit(limit);
        const totalMonitors = await Monitor.countDocuments({ user: userId });
        return res.status(200).json({ data: monitors, total: totalMonitors });
    }catch(error){
        return res.status(500).json({error: '500 Internal Server Error!'});
    }
});



/**
* @swagger
*   /monitor/create:
*   post:
*       description: Create a new monitor
*       summary: 
*       tags:
*           - Monitors
*       security:
*           - APIKeyHeader: []
*       responses:
*           '201':
*               description: Monitor has created successfully.
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
*       parameters:
*         - in: body
*           name: group
*           description: Create monitor payload
*           schema:
*              type: object
*              properties:
*                  name:
*                      type: string
*                  description:
*                      type: string
*                  type:
*                      type: string
*                  intervalSeconds:
*                      type: number
*                  endpoint:
*                      type: string
*/
router.post('/create', UserTokenVerify, async (req, res) => {
    const { error } = MonitorValidator.createMonitorValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let monitor_payload = {};

    const userId = req.user.id;
    // check which type monitor to create
    if (ENUM_CONFIG.MONITOR_TYPES_ENUM.HTTPS != req.body.type) return res.status(400).json({ error: 'Invalid monitor type' });
    monitor_payload = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        user: userId,
        endpoint: req.body.endpoint,
        api_endpoint: req.body.endpoint,
        intervalSeconds: req.body.intervalSeconds
    }

    try {
        const monitor = new Monitor(monitor_payload);
        await monitor.save();
        return res.status(201).json({ data: monitor, message: 'Monitor has created!' });
    }catch(error){
        return res.status(500).json({error: '500 Internal Server Error!'});
    }
});


/**
* @swagger
*   /monitor/delete/{id}:
*   delete:
*       description: Delete a monitor
*       summary: 
*       tags:
*           - Monitors
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: Monitor deleted successfully.
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
*       parameters:
*         - in: path
*           name: id
*           schema:
*             type: string
*           required: true
*/
router.delete('/delete/:id', UserTokenVerify, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid monitor id!' });
    const userId = req.user.id;

    let monitor;
    try {
        monitor = await Monitor.findOne({ _id: req.params.id, user: userId });
    }catch(error){
        return res.status(500).json({error: '500 Internal Server Error!'});
    }

    if(!monitor) return res.status(404).json({ error: 'Monitor not found!' });

    try {
        await Monitor.deleteOne({ _id: monitor._id });
        return res.status(200).json({ message: 'Monitor has deleted!' });
    }catch(error){
        return res.status(500).json({error: '500 Internal Server Error!'});
    }
});

module.exports = router;