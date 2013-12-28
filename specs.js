var em = require('em');
var as = em('appstack');
var ds = em('ds');
var streams = em('./lib/stream.js');

em('./specs/stream.js')(as.Matchers,streams);
em('./specs/eventstream.js')(as.Matchers,streams);

