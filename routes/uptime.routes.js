const express = require('express');
const router = express.Router();
const UserTokenVerify = require('../configs/UserTokenVerify.config');
const Monitor = require('../models/Monitor.model');
const MonitorStatus = require('../models/MonitorStatus.model');
const ENUM_CONFIG = require('../configs/enums.config');
const mongoose = require('mongoose');

/**
* @swagger
*   /uptime/live-status/{id}:
*   get:
*       description: Get the latest status record for a monitor
*       summary:
*       tags:
*           - Uptime
*       security:
*           - APIKeyHeader: []
*       parameters:
*         - in: path
*           name: id
*           description: Monitor ID
*           required: true
*           schema:
*              type: string
*       responses:
*           '200':
*               description: Latest status retrieved successfully.
*               schema:
*                 type: object
*                 properties:
*                   status:
*                       type: string
*                   message:
*                       type: string
*                   metadata:
*                       type: object
*                   checked_at:
*                       type: string
*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '404':
*               description: Not Found
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*/
router.get('/live-status/:id', UserTokenVerify, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid monitor id!' });
    const userId = req.user.id;
    let monitor;
    try {
        monitor = await Monitor.findOne({ _id: req.params.id, user: userId });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error!' });
    }
    if (!monitor) return res.status(404).json({ error: 'Monitor not found!' });

    const latestStatus = await MonitorStatus.findOne({ monitor: monitor._id }).sort({ created_at: -1 });
    if (!latestStatus) return res.status(404).json({ error: 'No status found for this monitor!' });

    return res.json({
        status: latestStatus.status,
        message: latestStatus.message,
        metadata: latestStatus.metadata,
        checked_at: latestStatus.created_at,
    });
});


/**
* @swagger
*   /uptime/history/{id}:
*   get:
*       description: Get status history for a monitor, optionally filtered by date range (ISO 8601)
*       summary:
*       tags:
*           - Uptime
*       security:
*           - APIKeyHeader: []
*       parameters:
*         - in: path
*           name: id
*           description: Monitor ID
*           required: true
*           schema:
*              type: string
*         - in: query
*           name: start_date
*           description: Filter records on or after this date (ISO 8601)
*           required: false
*           schema:
*              type: string
*         - in: query
*           name: end_date
*           description: Filter records on or before this date (ISO 8601)
*           required: false
*           schema:
*              type: string
*       responses:
*           '200':
*               description: Status history retrieved successfully.
*               schema:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     _id:
*                       type: string
*                     status:
*                       type: string
*                     message:
*                       type: string
*                     metadata:
*                       type: object
*                     created_at:
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
*                 type: object
*                 properties:
*                   error:
*                       type: string
*/
router.get('/history/:id', UserTokenVerify, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid monitor id!' });

    const query = { monitor: req.params.id };

    if (req.query.start_date || req.query.end_date) {
        query.created_at = {};
        if (req.query.start_date) {
            const startDate = new Date(req.query.start_date);
            if (isNaN(startDate.getTime())) return res.status(400).json({ error: 'Invalid start_date format!' });
            query.created_at.$gte = startDate;
        }
        if (req.query.end_date) {
            const endDate = new Date(req.query.end_date);
            if (isNaN(endDate.getTime())) return res.status(400).json({ error: 'Invalid end_date format!' });
            query.created_at.$lte = endDate;
        }
    }

    try {
        const history = await MonitorStatus.find(query).sort({ created_at: -1 });
        return res.json(history);
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error!' });
    }
});


/**
* @swagger
*   /uptime/monitors/active:
*   get:
*       description: Get all active monitors with their latest status record
*       summary:
*       tags:
*           - Uptime
*       security:
*           - APIKeyHeader: []
*       responses:
*           '200':
*               description: Active monitors with last status retrieved successfully.
*               schema:
*                 type: object
*                 properties:
*                   total:
*                       type: number
*                   data:
*                       type: array
*           '500':
*               description: Internal Server Error
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*/
router.get('/monitors/active', UserTokenVerify, async (req, res) => {
    const userId = req.user.id;
    try {
        const monitors = await Monitor.find({ user: userId, active: true, isPaused: false });

        const result = await Promise.all(
            monitors.map(async (monitor) => {
                const lastStatus = await MonitorStatus.findOne({ monitor: monitor._id }).sort({ created_at: -1 });
                return { monitor, last_status: lastStatus };
            })
        );

        return res.status(200).json({ data: result, total: result.length });
    } catch (error) {
        return res.status(500).json({ error: '500 Internal Server Error!' });
    }
});


/**
* @swagger
*   /uptime/graph/{id}:
*   get:
*       description: Get a 90-day daily uptime/downtime graph for a monitor plus an overall summary. bar_color is a hex code that transitions smoothly from green (#0dc20d) at 0% downtime to red (#c20d0d) at 100% downtime.
*       summary:
*       tags:
*           - Uptime
*       security:
*           - APIKeyHeader: []
*       parameters:
*         - in: path
*           name: id
*           description: Monitor ID
*           required: true
*           schema:
*              type: string
*       responses:
*           '200':
*               description: Graph data and summary retrieved successfully.
*               schema:
*                 type: object
*                 properties:
*                   monitor:
*                       type: object
*                   summary:
*                       type: object
*                       properties:
*                           period_days:
*                               type: number
*                           total_checks:
*                               type: number
*                           uptime_pct:
*                               type: number
*                           downtime_pct:
*                               type: number
*                           total_uptime_hours:
*                               type: number
*                           total_downtime_hours:
*                               type: number
*                           total_monitored_hours:
*                               type: number
*                   days:
*                       type: array
*                       items:
*                           type: object
*                           properties:
*                               date:
*                                   type: string
*                               total_checks:
*                                   type: number
*                               up_checks:
*                                   type: number
*                               down_checks:
*                                   type: number
*                               uptime_pct:
*                                   type: number
*                               downtime_pct:
*                                   type: number
*                               uptime_hours:
*                                   type: number
*                               downtime_hours:
*                                   type: number
*                               bar_color:
*                                   type: string
*           '400':
*               description: Bad Request
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '404':
*               description: Monitor not found
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*           '500':
*               description: Internal Server Error
*               schema:
*                 type: object
*                 properties:
*                   error:
*                       type: string
*/
router.get('/graph/:id', UserTokenVerify, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: 'Invalid monitor id!' });

    const userId = req.user.id;

    let monitor;
    try {
        monitor = await Monitor.findOne({ _id: req.params.id, user: userId });
    } catch {
        return res.status(500).json({ error: '500 Internal Server Error!' });
    }
    if (!monitor) return res.status(404).json({ error: 'Monitor not found!' });

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const DOWN_STATUSES = [
        ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.DOWN,
        ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.TIMEOUT,
        ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.ERROR,
    ];

    let dailyData;
    try {
        dailyData = await MonitorStatus.aggregate([
            {
                $match: {
                    monitor: monitor._id,
                    created_at: { $gte: threeMonthsAgo },
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    total: { $sum: 1 },
                    up: {
                        $sum: { $cond: [{ $eq: ['$status', ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.UP] }, 1, 0] }
                    },
                    down: {
                        $sum: { $cond: [{ $in: ['$status', DOWN_STATUSES] }, 1, 0] }
                    },
                }
            },
            { $sort: { _id: 1 } },
        ]);
    } catch {
        return res.status(500).json({ error: '500 Internal Server Error!' });
    }

    const intervalSec = monitor.intervalSeconds;

    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
            return Math.round(color * 255).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    function barColor(downtimePct) {
        // hue: 120 = green (0% downtime) → 0 = red (100% downtime)
        const hue = Math.round(120 * (1 - downtimePct / 100));
        return hslToHex(hue, 90, 38);
    }

    const days = dailyData.map((day) => {
        const downtimePct = day.total > 0 ? (day.down / day.total) * 100 : 0;
        const uptimePct = 100 - downtimePct;
        return {
            date: day._id,
            total_checks: day.total,
            up_checks: day.up,
            down_checks: day.down,
            uptime_pct: parseFloat(uptimePct.toFixed(2)),
            downtime_pct: parseFloat(downtimePct.toFixed(2)),
            uptime_hours: parseFloat(((day.up * intervalSec) / 3600).toFixed(2)),
            downtime_hours: parseFloat(((day.down * intervalSec) / 3600).toFixed(2)),
            bar_color: barColor(downtimePct),
        };
    });

    const totalChecks = days.reduce((s, d) => s + d.total_checks, 0);
    const totalUp = days.reduce((s, d) => s + d.up_checks, 0);
    const totalDown = days.reduce((s, d) => s + d.down_checks, 0);

    const summary = {
        period_days: 90,
        total_checks: totalChecks,
        uptime_pct: totalChecks > 0 ? parseFloat(((totalUp / totalChecks) * 100).toFixed(2)) : 0,
        downtime_pct: totalChecks > 0 ? parseFloat(((totalDown / totalChecks) * 100).toFixed(2)) : 0,
        total_uptime_hours: parseFloat(((totalUp * intervalSec) / 3600).toFixed(2)),
        total_downtime_hours: parseFloat(((totalDown * intervalSec) / 3600).toFixed(2)),
        total_monitored_hours: parseFloat(((totalChecks * intervalSec) / 3600).toFixed(2)),
    };

    return res.status(200).json({
        monitor: { name: monitor.name, endpoint: monitor.endpoint, type: monitor.type },
        summary,
        days,
    });
});

module.exports = router;
