var path = require('path');
var fs = require('fs');
var http = require('http');
var childProcess = require('child_process');

console.log('starting server...');

var s = http.createServer(function(req, res) {
	console.log(req.method, req.url);

	var u = path.join('/data', req.url);

	if (req.method === 'GET') {
		var match;

		if (req.url === '/env') {
			res.end(JSON.stringify(process.env, null, 2));
		} else if (match = req.url.match(/^\/files(\/[\s\S]*)$/)) {
			var u = path.join('/data', match[1]);

			console.log('downloading data ' + JSON.stringify(u) + '...');

			var rs = fs.createReadStream(u);
			
			rs.pipe(res);

			rs.on('close', function() {
				console.log('downloaded data' + JSON.stringify(u));
			});
			
			rs.on('error', function(err) {
				if (err.code === 'ENOENT') {
					res.statusCode = 404;
					res.end();
				} else {
					console.log(err);

					res.statusCode = 500;
					res.end();
				}
			});
		} else {
			res.statusCode = 404;
			res.end();
		}
	} else if (req.method === 'POST') {
		var match;

		if (match = req.url.match(/^\/files(\/[\s\S]*)$/)) {
			var u = path.join('/data', match[1]);

			console.log('uploading data ' + JSON.stringify(u) + '...');

			req.pause();

			childProcess.spawn('mkdir', [ '-p', path.dirname(u) ]).on('exit', function() {
				var ws = fs.createWriteStream(u);

				req.pipe(ws);
				req.resume();

				ws.on('close', function() {
					console.log('uploaded data ' + JSON.stringify(u));

					res.end();
				});
			});
		} else {
			res.statusCode = 404;
			res.end();
		}
	} else {
		res.statusCode = 404;
		res.end();
	}
});

s.listen(80);

s.on('listening', function() {
	console.log('server listening');
});
