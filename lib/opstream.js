module.exports = function(stream,ts){
	var util = ts.Utility;
	return stream.extend('opsQueue',{

		init: function(ms,auto){
			this.Super.call(ms || 1000,auto || false);
			this.augmentor = fn;
			this.source = data;
		},
		use: function(fn){
			this.augmentor = fn;
		},
	});
};