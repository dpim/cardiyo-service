module.export = {
    sqlQuery: function(pool, query, params, res){
        var query = pool.query(query_str, params, function (err, result) {
            if (err) {
                throw err;
                res.status(400);
            } else {
                res.send(result);
            }
        });
    }
}