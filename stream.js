var	ts = require('tsk').ToolStack,
	util = ts.Utility,
	sm = module.exports = {};

sm.Stream = require('./lib/stream')(ts,util);
sm.opStream = require('./lib/opstream')(sm.Stream,ts,util);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
// sm.opstream = require('./lib/opstream')(sm.stream);
