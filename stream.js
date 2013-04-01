var	ts = require('tsk').ToolStack,
	sm = module.exports = {};

sm.Stream = require('./lib/stream')(ts);
sm.opStream = require('./lib/opstream')(sm.Stream,ts);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
