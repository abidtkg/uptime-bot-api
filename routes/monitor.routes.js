const express = require('express');
const router = express.Router();
const UserTokenVerify = require('../configs/UserTokenVerify.config');
const Monitor = require('../models/Monitor.model');
const MonitorValidator = require('../validators/monitor.validator');
const ENUM_CONFIG = require('../configs/enums.config');

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

router.post('/create', UserTokenVerify, async (req, res) => {
    const { error } = MonitorValidator.createMonitorValidator(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let monitor_payload = {};

    const userId = req.user.id;
    // check which type monitor to create
    if (ENUM_CONFIG.MONITOR_TYPES_ENUM.HTTP != req.body.type) return res.status(400).json({ error: 'Invalid monitor type' });

    // HTTP monitor creation logic
    if (ENUM_CONFIG.MONITOR_TYPES_ENUM.HTTP === req.body.type) {
        monitor_payload.type = ENUM_CONFIG.MONITOR_TYPES_ENUM.HTTP;
        monitor_payload.http_options = {
            http_method
        }
    }

});

module.exports = router;