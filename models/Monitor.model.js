const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ENUM_CONFIG = require('../configs/enums.config');

const MonitorSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    description: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: true,
        enum: ENUM_CONFIG.MONITOR_TYPES_ENUM.ALL
    },
    target: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: ENUM_CONFIG.MONITOR_STATUSES_ENUM.UP,
        enum: ENUM_CONFIG.MONITOR_STATUSES_ENUM.ALL,
    },
    intervalSeconds: {
        type: Number,
        required: true,
        min: 30
    },
    timeoutMs: {
        type: Number,
        required: true,
        max: 30000
    },
    active: {
        type: Boolean,
        default: true
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    httpOptions: {},
    sslOptions: {},
    consecutiveFailuresToAlert: {
        type: Number,
        default: 3,
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    publicSlug: {
        type: String,
        unique: true,
        sparse: true
    },
    publicDisplayName: {
        type: String,
        required: false
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'group',
        required: false
    },
    last_checked_at: {
        type: Date,
        default: null
    },
    last_up_at: {
        type: Date,
        default: null
    },
    last_down_at: {
        type: Date,
        default: null
    },
    last_alert_at: {
        type: Date,
        default: null
    },
    total_checks: {
        type: Number,
        default: 0
    },
    total_downtimes: {
        type: Number,
        default: 0
    },
    total_alerts: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
});

const MonitorModel = mongoose.model('monitor', MonitorSchema);
module.exports = MonitorModel;