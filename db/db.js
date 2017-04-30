//mysql helper functions
var mysql = require('mysql')
var query = require('./query')
var queries = require('./queries')
var config = require('./config')


var pool = mysql.createPool({
    connectionLimit: 200,
    host: '', //YOUR host
    user: '', //YOUR user
    password: '', //YOUR password
    database: 'cyo_db', //YOUR db
    waitForConnections: true,
    charset: 'utf8mb4'
})

module.exports = {
    attemptQuery: function () {
        query.sqlQuery(pool, queries.testQuery, [], res);
    },

    upsertUser: function (name, fbId, res) {
        var timeNow = getDateTimeNow();
        query.sqlQuery(pool, queries.upsertUser, [name, fbId, timeNow, timeNow, name, timeNow], res);
    },

    addRecord: function (userId, caption, pointSerialized, primaryImage, mapImage, duration, distance, isPublic, res) {
        var time_now = getDateTimeNow();
        query.sqlQuery(pool, queries.addRecord, [userId, caption, pointSerialized, primaryImage, mapImage, duration, distance, timeNow, isPublic], res);
    },

    addLike: function (userId, recordId, res) {
        var timeNow = getDateTimeNow();
        query.sqlQuery(pool, queries.addLike, [like, userId, recordId, timeNow, userId, recordId], res);
    },

    // FETCHING
    getRecord: function (userId, recordId, res) {
        query.sqlQuery(pool, queries.getRecord, [userId, recordId], res);
    },

    getLikesForRecord: function (recordId, res) {
        query.sqlQuery(pool, queries.getLikesForRecord, [recordId], res);
    },

    getPersonalRecords: function (userIdd, res) {
        query.sqlQuery(pool, queries.getPersonalRecords, [userId, userId, userId, userId, userId, userId, userId, userId], res);
    },

    getRecordsForUser: function (userId, res) {
        query.sqlQuery(pool, queries.getRecordsForUser, [userId, userId], res);
    },

    getRecentRecords: function (userId, page, res) {
        var pageSize = 50; //constant
        var offset = page * 50;
        query.sqlQuery(pool, queries.getRecentRecords, [userId, offset, pageSize], res);
    },

    // DELETION

    deleteRecord: function (userId, recordId, res) {
        query.sqlQuery(pool, queries.deleteRecord, [recordId, userId], res);
    },

    deleteUser: function (userId, res) {
        query.sqlQuery(pool, queries.deleteUser, [userId], res);
    },

    deleteLike: function (userId, recordId, res) {
        query.sqlQuery(pool, queries.deleteLike, [recordId, userId], res);
    }, 

    makePublic: function (userId, recordId, res) {
        query.sqlQuery(pool, queries.makePublic, [recordId, userId], res);
    },

    makePrivate: function (userId, recordId, res) {
        query.sqlQuery(pool, queries.makePrivate, [recordId, userId], res);
    }
}

function getDateTimeNow() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}