require('em.js')('streams',function(e){
    
  var streams =  this.exports = {}, 
  ds = e('ds'),
  as = e('appstack'), 
  util = as.Utility;
  

  streams.methodLists = ['paused','resumed','closed','locked'];

  streams.EventSubscriber = function(source,fn){
    if(!(source instanceof streams.Streamable)) throw "Source must be a streamable object";
    var subscriber = {};

    subscriber.source = source;
    subscriber.stream = streams.Streamable.make();

    subscriber.whenClosed = function(fn){ this.stream.whenClosed(fn); }
    subscriber.paused = function(){ this.stream.paused(); }
    subscriber.pause = function(){ this.stream.pause(); }
    subscriber.resumed = function(){ this.stream.resumed(); }
    subscriber.resume = function(){ this.stream.resume(); }

    subscriber.fn = function(){
        var args = util.toArray(arguments);
        subscriber.stream.add.apply(subscriber.stream,args);
    };

    subscriber.off = subscriber.close = function(){
        this.source.director.remove(this.fn);
        this.stream.end();
    };

    subscriber.source.director.add(subscriber.fn);
    if(fn && util.isFunction(fn)) subscriber.stream.director.add(fn);
    
    subscriber.source.whenClosed(function(){
        subscriber.off();
    });

    return subscriber;
  };

  streams.Streamable = as.Class.create({
    init: function(fn){
      var self = this;
      this.transformer = as.Mutator(fn && util.isFunction(fn) ? fn :  function(n){ return n; });
      this.director = as.Distributors();
      this.closer = as.Distributors();
      this.drain = as.Distributors();
      this.lists = this._initStore();
      this._running = false;
      this.states = as.StateManager.Manager(this,streams.methodLists);
      this.states.addState('resume',{
        'resumed': function(){
          return true;
        },
        'paused': function(){
          return false;
        },
        'closed': function(){
          return false;
        },
        'locked':function(){
          return false;
        }
      });
      this.states.addState('pause',{
        'resumed': function(){
          return false;
        },
        'paused': function(){
          return true;
        },
        'closed': function(){
          return false;
        },
        'locked':function(){
          return false;
        }
      });

      this.states.addState('locked',{
        'resumed': function(){
          return true;
        },
        'paused': function(){
          return false;
        },
        'closed': function(){
          return false;
        },
        'locked':function(){
          return true;
        }
      });

      this.states.addState('closed',{
        'resumed': function(){
          return false;
        },
        'paused': function(){
          return false;
        },
        'closed': function(){
          return true;
        },
        'locked':function(){
          return false;
        }
      });
      
      this.states.setDefaultState('resume');
      this.transformer.done.add(function(n){
          self.lists.add(n);
          if(!self._running) self.push();
      });
    },
    add: function(n){
      if(this.closed() || this.locked()) return;
      this.transformer.fire(n);
    },
    emit: function(n){
      this.add(n);
    },
    resume: function(){
      this.states.switchState('resume');
      this.push();
    },
    pause: function(){
      this.states.switchState('pause');
    },
    lock: function(){
      this.states.switchState('locked');
    },
    unlock: function(){
      if(!this.locked()) return;
      this.states.switchState('resume');
    },
    closed: function(){
      return this.states.closed();
    },
    locked: function(){
      return this.states.locked();
    },
    paused: function(){
      return this.states.paused();
    },
    resumed: function(){
      return this.states.resumed();
    },
    subscribe: function(fn){ 
      if(this.closed()) return;
      var sub = streams.EventSubscriber(this,fn);
      if(!this.lists.isEmpty() && !this._running) this.push();
      return sub;
    },
    untell: function(fn){
      if(this.closed()) return;
      return this.director.remove(fn);
    },
    tell: function(fn){
      if(this.closed()) return;
      var fn = this.director.add(fn);
      if(!this.lists.isEmpty() && !this._running) this.push();
      return fn;
    },
    flush: function(){
      this.resume();
      this.push();
      this.lists.clear();
    },
    end: function(){
      if(this.closed()) return;
      this.flush();
      this.closer.distribute();
      this.director.close();
      this.states.switchState('closed');
      this.closer.close();
    },
    whenClosed: function(fn){
      this.closer.add(fn);
    },
    push: function(){
      if(this.closed() || this.paused() || this.director.isEmpty()) return;
      while(!this.lists.isEmpty()){
        this._running = true;
        this.director.distribute(this.lists.removeHead().data);
      }
      this.drain.distribute(true);
      this._running = false;
    },
    bind: function(streamable){
      if(!util.instanceOf(streamable,streams.Streamable)) return;
      var self = this,fn = util.proxy(streamable.add,streamable);
      streamable.whenClosed(function(){
        if(self) self.director.remove(fn);
      });
      
      this.director.add(fn);
    },
    _initStore: function(){
      return ds.List.make();
    },
  });

  streams.CappedStreamable = streams.Streamable.extend({
    init: function(max,transformer){
      this.maxSpace = max;
      this.Super(transformer);
    },
    _initStore: function(){
      return ds.List.make(this.maxSpace);
    }
  });
  

  streams.EventStreams = as.Class.create({
      static:{
          combineUnOrderBy: function(fn){
            return function(){
              var scope =  {},
              sets = util.toArray(arguments),
              combine = streams.Streamable.make(),
              combineInjector = as.ArrayInjector.make(function(set){
                  return fn.call(scope,sets,set);
              });

              scope.stream = combine;
              scope.injector = combineInjector;

              combineInjector.on(function(set){
                combine.emit(set);
              });
              
              util.each(sets,function(e,i,o){
                e.tell(function(){
                    var args = util.toArray(arguments);
                    combineInjector.push.apply(combineInjector,args);
                });
              });

              return combine;
            };
          },

          combineOrderBy: function(fn){
            return function(){
              var scope =  {},
              sets = util.toArray(arguments),
              combine = streams.Streamable.make(),
              combineInjector = as.PositionArrayInjector.make(function(set){
                  return fn.call(scope,sets,set);
              });

              scope.stream = combine;
              scope.injector = combineInjector;

              combineInjector.on(function(set){
                combine.emit(set);
              });
              
              util.each(sets,function(e,i,o){
                e.tell(function(){
                    var args = util.toArray(arguments);
                    combineInjector.push.apply(combineInjector,[i].concat(args));
                });
              });

              return combine;
            };
          },

          combineOrder: function(){
            return streams.EventStreams.combineOrderBy(function(streams,recieved){
                if(recieved.length >= streams.length) return true;
                return false;
            }).apply(this,arguments);
          },

          combine: function(){
            var sets = util.toArray(arguments),
            combine = streams.Streamable.make();
            
            util.each(sets,function(e,i,o){
              e.tell(function(){
                  var args = util.toArray(arguments);
                  combine.emit.apply(combine,args);
              });
            });

            return combine;
          },

          reduceOne: function(stream,transform,conditioner){
            var reduced = streams.Streamable.make(transform),
            reducedInjector = as.ArrayInjector.make(function(set){
                if(conditioner(stream,set,reduced)) return true;
                return false;
            });

            reducedInjector.on(function(set){
              reduced.emit(set);
            });
            
            stream.tell(function(){
                var args = util.toArray(arguments);
                reducedInjector.push.apply(reducedInjector,args);
            });

            return reduced;
          },

          reduceOrder: function(){
            return streams.EventStreams.reduceOrderBy(function(streams,recieved){
                if(recieved.length >= streams.length) return true;
                return false;
            }).apply(this,arguments);
          },

          reduceOrderBy: function(fn){
            return function(){
              var sets = util.toArray(arguments),
              scope = {},
              transformer = util.rshift(sets),
              reduced = streams.Streamable.make(transformer),
              reducedInjector = as.PositionArrayInjector.make(function(set){
                  return fn.call(scope,sets,set);
              });
            
              scope.stream = reduced;
              scope.injector = reducedInjector;

              reducedInjector.on(function(set){
                reduced.emit(set);
              });
              
              util.each(sets,function(e,i,o){
                e.tell(function(){
                    var args = util.toArray(arguments);
                    reducedInjector.push.apply(reducedInjector,[i].concat(args));
                });
              },this);

              return reduced;
            };
          }
      },
      instance:{
        init: function(id){
          this.id = id || "EventStream";
          this.map = as.HashHelpers({});
          this.subsMap = as.HashHelpers({});
        },
        stream: function(id,len){
          var st;
          if(st = this.map.get(id)) return st;

          var id = id, rargs = util.toArray(this.arguments,1);
          this.subsMap.add(id,[]);

          ((len && util.isNumber(len)) ? this.map.add(id,streams.CappedStreamable(len)) : 
          this.map.add(id,streams.Streamable.make()));

          return this.map.get(id);
        },
        has: function(id){
          return this.map.exists(id);
        },
        haltAll: function(){
          this.map.cascade(function(e){
              e.pause();
          });
        },
        halt: function(id){
          this.get(id).pause();
        },
        resume: function(id){
          this.get(id).resume();
        },
        resumeAll: function(){
          this.map.cascade(function(e){
              e.resume();
          });
        },
        onStream: function(id,fn){
          var self = this,sub = this.stream(id).subscribe(fn), sid = this.subsMap.get(id);
          sub.whenClosed(function(){
            var ind = sid.indexOf(sub);
            if(ind === -1) return;
            delete sid[ind];
            util.normalizeArray(sid);
          });
          this.subsMap.get(id).push(sub);
          return sub;
        },
        offStream: function(id){
          var stream = this.map.get(id), subs = this.subsMap.get(id);
          if(!stream) return;
          stream.end();
          this.map.remove(id);
          util.explode(subs);
        },
        emit: function(id,item){
          this.stream(id).emit(item);
        },
        close: function(){
          this.map.cascade(function(e,i,o){ e.end(); delete o[i]; });
        }
      }
  });

  
  streams.newStream = function(fn){
    return streams.Streamable.make(fn);
  };

  streams.newMaxStream = function(max,fn){
    return streams.CappedStreamable.make(max,fn);
  };
  
  streams.newEventStream = function(id){
    return streams.EventStreams.make(id);
  };

  streams.combineUnOrderByStreams = function(fn){
    return streams.EventStreams.combineUnOrderBy(fn);
  };

  streams.combineOrderByStreams = function(fn){
    return streams.EventStreams.combineOrderBy(fn);
  };

  streams.combineOrderStreams = function(){
    return streams.EventStreams.combineOrder.apply(null,arguments);
  };

  streams.combineStreams = function(){
    return streams.EventStreams.combine.apply(null,arguments);
  };
  
  streams.reduceOrderByStreams = function(fn){
    return streams.EventStreams.reduceOrderBy(fn);
  };

  streams.reduceOrderStreams = function(){
    return streams.EventStreams.reduceOrder.apply(null,arguments);
  };

  streams.reduceOneStream = function(){
    return streams.EventStreams.reduceOne.apply(null,arguments);
  };

  streams.tellStream = function(stream,fn){
    if(stream instanceof streams.Streamable) return stream.tell(fn);
    return null;
  };

  streams.bindStream = function(source,stream){
    if((stream && source) instanceof streams.Streamable) return source.bind(stream);
    return null;
  };

  streams.untellStream = function(stream,fn){
    if(stream instanceof streams.Streamable) return stream.untell(fn);
    return null;
  };
  
},this);
