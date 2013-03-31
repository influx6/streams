module.exports = function(stream,ts,util){

	return stream.extend('opsQueue',{

		init: function(data,augmentor){
			this.Super.call(this,data);
			this.augmentor = augmentor;
		},
	});
};