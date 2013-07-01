var restify = require('restify');
var async = require('async');
var socketio = require('socket.io');
var fs = require('fs');
var arDrone = require('ar-drone');
var client  = arDrone.createClient();
var server = restify.createServer();
var io = socketio.listen(server);


// Routes
server.get('/', function indexHTML(req, res, next) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});

server.get('/style.css', function style(req, res, next) {
    fs.readFile(__dirname + '/style.css', function (err, data) {
        if (err) {
            next(err);
            return;
        }

        res.setHeader('Content-Type', 'text/css');
        res.writeHead(200);
        res.end(data);
        next();
    });
});

// Sockets
io.sockets.on('connection', function (socket) {

    socket.on('fly', function(data) {
        var delta;
        var i = 0;

        // loop through each vector, create a command, and execute that command for a duration
        async.forEachSeries(data, function(a,b) {
            if (data[i+1] && data[i+1]) {
                var deltaX = data[i+1].x - data[i].x;
                var deltaY = data[i+1].y - data[i].y;

                var velX = deltaX / 1000;
                var velY = deltaY / 1000;

                console.log(velX, velY);

                callClient(velX, velY, function(){
                    b();
                    i++;
                });
            }
        });

        function callClient(velX, velY, callback) {

            // issue the drone commands
            client.right(velX);
            client.front(velY);

            // allow the command to run for 1 second
            // TODO: add scale slider on the client to scale the duration to relate to a given distance
            setTimeout(function(){
                client.stop();
                callback();
            },1000);
        }
    });

    socket.on('land', function() {
        console.log('land');
        client.land();
    });

    socket.on('takeoff', function() {
        console.log('takeoff');
        client.takeoff();
    });

});

server.listen(8080, function() {
    console.log("server listening on port ", 8080);
});