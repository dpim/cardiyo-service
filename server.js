var express = require('express')
var passport = require('passport')
var azure = require('azure-storage');
var uuidV1 = require('uuid/v1');
var app = express()
var bodyParser = require('body-parser')
var tools = require('./db');
var FacebookTokenStrategy = require('passport-facebook-token');
var blobService = azure.createBlobService("cyobinstorage", "") //YOUR blob storage

var mg_api_key = "" //YOUR mailgun api key
var domain = "" //YOUR mailgun domain
var mailgun = require('mailgun-js')({ apiKey: mg_api_key, domain: domain });

app.use(passport.initialize());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var port = process.env.PORT || 1337;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new FacebookTokenStrategy({
    clientID: '', //YOUR client id
    clientSecret: '' //YOUR client secret
}, function (accessToken, refreshToken, profile, done) {
    var info = [profile.displayName, profile.id];
    return done(null, info)
}
));

//Auth
app.post('/v1/auth',
    passport.authenticate('facebook-token'),
    function (req, res) {
        //login and upsert a user
        var displayName = req.user[0];
        var userId = req.user[1];
        tools.upsertuser(displayName, userId, res)
    })

//Creation
app.post('/v1/records',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var body = req.body;
        var caption = body["caption"];
        var points_serialized = body["points"]
        var duration = body["duration"];
        var distance = body["distance"];
        var primary_image_encoded = body["p_image_encoded"]
        var map_image_encoded = body["m_image_encoded"]
        var ispublic = body["ispublic"];
        var parts = [caption, points_serialized, duration, distance, primary_image_encoded, map_image_encoded];
        if (!caption) {
            caption = "";
        }
        if (!body || !primary_image_encoded | !map_image_encoded) { // if request is missing parts
            res.sendStatus(400);
        } else { //blob upload
            var base_uuid = uuidV1();
            var primary_image = base_uuid + "1.jpg";
            var map_image = base_uuid + "2.jpg";
            var type = "image/jpeg"
            var buffer1 = new Buffer(primary_image_encoded, 'base64')
            var buffer2 = new Buffer(map_image_encoded, 'base64')
            blobService.createBlockBlobFromText('images', primary_image, buffer1, { contentType: type }, function (error, result, response) {
                if (error) {
                    console.log(error);
                } else {
                    blobService.createBlockBlobFromText('images', map_image, buffer2, { contentType: type }, function (error, result, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            tools.addrecord(user_id, caption, points_serialized, primary_image, map_image, duration, distance, ispublic, res);
                        }
                    });
                }
            });
        }
    })

app.post('/v1/records/:recordId/like',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        tools.addlike(user_id, record_id, res);
    })

app.post('/v1/records/:recordId/report',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        report(user_id, record_id, res);
    })

//Update
app.post('/v1/records/:recordId/makePublic',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        tools.makepublic(user_id, record_id, res);
    })

app.post('/v1/records/:recordId/makePrivate',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        tools.makeprivate(user_id, record_id, res);
    })


//Fetch
app.get('/v1/likersForRecord/:recordId',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var recordId = req.params["recordId"];
        tools.getlikesforrecord(recordId, res);
    })

app.get('/v1/personalRecords',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        tools.getpersonalrecords(user_id, res);
    })

app.get('/v1/records/:recordId',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var recordId = req.params["recordId"];
        var user_id = req.user[1];
        tools.getrecord(user_id, recordId, res);
    })

app.get('/v1/history',
    passport.authenticate('facebook-token'),
    function (req, res) {
        //get my personal history - all my activities
        var user_id = req.user[1];
        tools.getrecordsforuser(user_id, res);
    })

app.get('/v1/feed/:page',
    passport.authenticate('facebook-token'),
    function (req, res) {
        //get feed
        var user_id = req.user[1];
        var page = req.params["page"];
        tools.getrecentrecords(user_id, page, res)
    })

//Delete
app.delete('/v1/records/:recordId',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        tools.deleterecord(user_id, record_id, res);
    })

app.delete('/v1/records/:recordId/like', //unlike
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        var record_id = req.params["recordId"];
        tools.deletelike(user_id, record_id, res);
    })

app.delete('/v1/users/deleteSelf',
    passport.authenticate('facebook-token'),
    function (req, res) {
        var user_id = req.user[1];
        tools.deleteuser(user_id, res)
    })

//Utility
app.get('/v1/', function (req, res) {
    res.send("version working")
})

app.get('/', function (req, res) {
    res.send("working")
})

app.get('/v1/test',
    passport.authenticate('facebook-token'),
    function (req, res) {
        //get feed
        var user_id = req.user[1];
        res.send(user_id)
    })

app.listen(port, function () {
    console.log('Example app listening on port 3000!')
})

function report(user_id, record_id, res) {
    var data = {
        from: 'Excited User <me@samples.mailgun.org>',
        to: '', //YOUR email
        subject: 'Post',
        text: 'Reported post: ' + record_id + '\n user id: ' + user_id
    };
    mailgun.messages().send(data, function (error, body) {
        res.send(error + " " + body);
    });
}