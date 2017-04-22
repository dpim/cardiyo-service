//mysql helper functions
var mysql = require('mysql')
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
    //DB TEST
    attemptq: function () {
        connection.pool('SELECT 1 + 1 AS solution', function (err, rows, fields) {
            if (err) throw err
            console.log('The solution is: ', rows[0].solution)
        })
    },

    //ADDITION
    upsertuser: function (name, fb_id, res) {
        var time_now = getDateTimeNow();
        var query_str = "INSERT INTO cyo_db.users (name, id, datetime_created, datetime_lastused) VALUES ('" + name + "', '" + fb_id + "', '" + time_now + "','" + time_now + "') \
                        ON DUPLICATE KEY UPDATE name='"+ name + "', datetime_lastused='" + time_now + "'";

        var query = pool.query(query_str, function (err, result) {
            if (err) {
                throw err;
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    addrecord: function (user_id, caption, points_serialized, primary_image, map_image, duration, distance, ispublic, res) {
        var time_now = getDateTimeNow();
        var like = 1
        var query_str = "INSERT INTO cyo_db.records (user_id, caption, points_serialized, primary_image, map_image, duration, distance, datetime_created, ispublic) \
                            VALUES ("+ user_id + ", '" + caption + "','" + points_serialized + "','" + primary_image + "','" + map_image + "'," + duration + "," + distance + ", '" + time_now + "',"+ispublic+")"
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {

                console.log(result);
                res.send(result);
            }
        });
    },

    addlike: function (user_id, record_id, res) {
        var like = 1;
        var time_now = getDateTimeNow();
        var query_str = "INSERT INTO cyo_db.likes (didlike, user_id, record_id, datetime_created) \
                            SELECT "+ like + "," + user_id + "," + record_id + ",'" + time_now + "' FROM dual \
                            WHERE NOT EXISTS (SELECT 1 FROM likes WHERE didlike = 1 AND user_id='"+user_id+"' AND record_id="+record_id+")"
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                throw err;
                res.status(400);
            } else {
                console.log(result);
                res.send(result);
            }
        });

    },

    // FETCHING
    getrecord: function (user_id, record_id, res) {
        var query_str = "SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = " + user_id + ") as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id \
                            WHERE r.record_id="+ record_id;
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    getlikesforrecord: function (record_id, res) {
        var query_str = "SELECT u.name, l.* FROM likes l INNER JOIN users u on l.user_id = u.id WHERE l.record_id=" + record_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    getpersonalrecords: function (user_id, res) {
        var query_str = "SELECT (SELECT COUNT(*) FROM records WHERE user_id = " + user_id + " AND datetime_created > NOW() - INTERVAL 1 WEEK ) as week, \
                        (SELECT COUNT(*) FROM records WHERE user_id = "+ user_id + " AND datetime_created > NOW() - INTERVAL 1 MONTH) as month,  \
                        (SELECT COUNT(*) FROM records WHERE user_id = "+ user_id + " AND datetime_created < NOW()) as alltime, \
                        (SELECT MAX(distance/(.01+duration)) FROM records WHERE duration>60 AND distance>20 AND user_id = "+ user_id + ") as fastest, \
                        (SELECT MAX(distance) FROM records WHERE user_id = "+ user_id + ") as longest, \
                        (SELECT SUM(distance) FROM records WHERE user_id = "+ user_id + " AND datetime_created > NOW() - INTERVAL 1 WEEK) as week_mileage, \
                        (SELECT SUM(distance) FROM records WHERE user_id = "+ user_id + " AND datetime_created > NOW() - INTERVAL 1 MONTH) as month_mileage, \
                        (SELECT SUM(distance) FROM records WHERE user_id = "+ user_id + " AND datetime_created < NOW()) as alltime_mileage"
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    getrecordsforuser: function (user_id, res) {
        var query_str = "SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = " + user_id + ") as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id \
                            WHERE r.user_id="+ user_id + " ORDER BY r.datetime_created DESC"
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                throw err
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    getrecentrecords: function (user_id, page, res) {
        var pagesize = 50; //constant
        var offset = page * 50;
        var query_str = "SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = " + user_id + ") as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id WHERE r.ispublic = 1 \
                            ORDER BY r.datetime_created DESC LIMIT "+ offset + " ," + pagesize
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                throw err
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    // DELETION

    deleterecord: function (user_id, record_id, res) {
        var query_str = "DELETE FROM cyo_db.records WHERE record_id=" + record_id + " AND user_id=" + user_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    deleteuser: function (user_id, res) {
        var query_str = "DELETE FROM cyo_db.users WHERE id=" + user_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    deletelike: function (user_id, record_id, res) {
        var query_str = "DELETE FROM cyo_db.likes WHERE record_id=" + record_id + " AND user_id=" + user_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    }, 

    makepublic: function (user_id, record_id, res) {
        var query_str = "UPDATE cyo_db.records SET ispublic=1 WHERE record_id=" + record_id + " AND user_id=" + user_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    },

    makeprivate: function (user_id, record_id, res) {
        var query_str = "UPDATE cyo_db.records SET ispublic=0 WHERE record_id=" + record_id + " AND user_id=" + user_id
        var query = pool.query(query_str, function (err, result) {
            if (err) {
                res.status(400);
            } else {
                res.send(result);
            }
        });
    }
}

function getDateTimeNow() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}