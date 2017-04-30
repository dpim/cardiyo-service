module.exports = {
    testQuery: 'SELECT 1 + 1 AS solution',
    upsertUser: 'INSERT INTO cyo_db.users (name, id, datetime_created, datetime_lastused) VALUES (?, ?, ?, ?) \
                        ON DUPLICATE KEY UPDATE name=?, datetime_lastused=?',
    addRecord: 'INSERT INTO cyo_db.records (user_id, caption, points_serialized, primary_image, map_image, duration, distance, datetime_created, ispublic) \
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    addLike: 'INSERT INTO cyo_db.likes (didlike, user_id, record_id, datetime_created) \
                            SELECT ?, ?, ?, ? FROM dual \
                            WHERE NOT EXISTS (SELECT 1 FROM likes WHERE didlike = 1 AND user_id=? AND record_id=?)',
    getRecord: 'SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = ?) as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id \
                            WHERE r.record_id = ?',
    getLikesForRecord: 'SELECT u.name, l.* FROM likes l INNER JOIN users u on l.user_id = u.id WHERE l.record_id=?',
    getPersonalRecords: 'SELECT (SELECT COUNT(*) FROM records WHERE user_id = ? AND datetime_created > NOW() - INTERVAL 1 WEEK ) as week, \
                        (SELECT COUNT(*) FROM records WHERE user_id = ? AND datetime_created > NOW() - INTERVAL 1 MONTH) as month,  \
                        (SELECT COUNT(*) FROM records WHERE user_id = ? AND datetime_created < NOW()) as alltime, \
                        (SELECT MAX(distance/(.01+duration)) FROM records WHERE duration>60 AND distance>20 AND user_id = ?) as fastest, \
                        (SELECT MAX(distance) FROM records WHERE user_id = ?) as longest, \
                        (SELECT SUM(distance) FROM records WHERE user_id = ? AND datetime_created > NOW() - INTERVAL 1 WEEK) as week_mileage, \
                        (SELECT SUM(distance) FROM records WHERE user_id = ? AND datetime_created > NOW() - INTERVAL 1 MONTH) as month_mileage, \
                        (SELECT SUM(distance) FROM records WHERE user_id = ? AND datetime_created < NOW()) as alltime_mileage',
    getRecordsForUser: 'SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = ?) as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id \
                            WHERE r.user_id=? ORDER BY r.datetime_created DESC',
    getRecentRecords: 'SELECT u.name, r.*, (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id AND l.user_id = ?) as didLike, \
                            (SELECT COUNT(*) from likes l WHERE l.record_id = r.record_id) as countLikes \
                            FROM records r INNER JOIN users u ON r.user_id = u.id WHERE r.ispublic = 1 \
                            ORDER BY r.datetime_created DESC LIMIT ?,?',
    deleteRecord: 'DELETE FROM cyo_db.records WHERE record_id=? AND user_id=?',
    deleteUser: 'DELETE FROM cyo_db.users WHERE id=?',
    deleteLike: 'DELETE FROM cyo_db.likes WHERE record_id=? AND user_id=?',
    makePublic: 'UPDATE cyo_db.records SET ispublic=1 WHERE record_id=? AND user_id=?',
    makePrivate: 'UPDATE cyo_db.records SET ispublic=0 WHERE record_id=? AND user_id=?'
}