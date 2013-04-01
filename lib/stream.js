//provide a stream based queue system
module.exports = function(ts){

	var util = ts.Utility;

	return ts.Class.create('StreamQueue',{
		init: function(ms,automate){

			//backup
			this.backup = [];
			this.automate = util.isBoolean(automate) ? automate : false;

			//falsables
			this.flushed = false;
			this.ended = false;
			//truthables
			this.writable = true;
			this.enabled = true;

			//inner worker - handles to writes and operation of delivery
			this.queue = ts.MessageAPI(false,ms);

			this.e = ts.Events();
			this.e.set('data');
			this.e.set('end');
			this.e.set('error');
			this.e.set('pause');
			this.e.set('resume');
			this.e.set('close');

			var self = this;
			//alias events caller
			// this.on = util.bind(function(e,fn){
			// 	if(!util.isFunction(fn)) return;
			// 	if(self.writable) this.on(e,fn);
			// 	if(e === 'end')
			// },this.e);

			this.on = util.bind(this.e.on,this.e);
			this.off = util.bind(this.e.off,this.e);
			this.queue.addChannel('stream');
			this.queue.gtc('stream').add('write',function(chunk){ self.e.emit('data',chunk); });

			this.on('end',function(){ self.flushed = true;  self.ended = true; });
			this.on('close',function(){ self.writable = false; });
			this.on('data',function(d){ self.backup.push(d); });
			//setup ms link
			util.createProperty(self,'ms',{
				get: function(){ return self.queue.tick; },
				set: function(val){ if(util.isNumber(val) && !util.isInfinity(val)) self.queue.tick = val; }
			});

			if(this.automate) this.proxyEnd = util.proxy(self.end,self);
		},
		augmentor: function(o){ return o; },
		write: function(chunk){
			if(this.disabled()) return;
			if(!this.writable) return this.e.emit('error',new Error('stream is closed'));
			chunk = !util.isString(chunk) ? JSON.stringify(chunk) : chunk;
			this.queue.nty('stream','write',this.augmentor(chunk));
			this.ended = false;
			this.flush();
		},
		end: function(){
			if(this.disabled()) return;
			// if(this.ended) return;
			this.e.emit('end');
			// this.writable = false;
		},
		close: function(){
			if(this.disabled()) return;
			this.disabled();
			this.queue.disabled();
			this.e.emit('close');
		},
		flush: function(){
			if(this.disabled()) return;
			if(this.paused || this.disabled()) return;
			if(this.automate) this.queue.onEnd(this.proxyEnd);
			this.queue.deliver();
			// this.writable = false;
		},
		pause: function(){
			if(this.disabled()) return;
			this.queue.pause();
			// this.writable = true;
			this.e.emit('paused');
		},
		resume: function(){
			if(this.disabled()) return;
			this.queue.resume();
			// this.writable = false;
			this.e.emit('resume');
		},
		enable: function(){
			this.enabled = true;
		},
		disabled: function(){
			return !this.enabled;
		},
		disable: function(){
			this.enabled = false;
			return;
		},
		enable: function(){
			this.enabled = true;
		},
	});

};