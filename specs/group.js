module.exports = function(ma,es,as){
  
  ma.scoped('high-level group-eventstream api');
  
  var util = as.Utility;
  var stream = es.EventStreams.make('example');
  var b = stream.stream('b');
  var d = stream.stream('d');
  var e = stream.stream('e');

  var ready = as.StateManager.Manager({},['ready']);
  ready.addState('unlock',{
    "ready": function(){ return true; }
  });
  ready.addState('lock',{
    "ready": function(){ return false; }
  });
  
  ready.setDefaultState('unlock');

  ma.scoped('ready stateManager');
  ma.obj(ready).isValid();
  ma.obj(ready.ready()).isTrue();
  
  var group = es.combineUnOrderByStreams(function(streams,combine){
    return ready.ready();
  },function(r){
    this.stream._massAdd(r);
  })(stream.stream('b'),stream.stream('d'),stream.stream('e'));

  b.transformer.add(function(i){
    if(!ready.ready()){
      d.resume();
    }
    ready.switchState('lock');
    d.pause();
  });
  
  e.transformer.add(function(i){
    d.resume();
    ready.switchState('unlock');
  });
  
  ma.scoped('grouping streams');
  group.tell(function(n){
      ma.obj(n).isValid();
  });

  
  b.emit('<article>');
  d.emit(1);
  b.emit('<article>');
  d.emit(2);
  b.emit('</article>');
  b.emit('<article>');
  d.emit(3);
  d.emit(4);
  e.emit('</article>');
  b.emit(5);
  b.emit('</article>');


};
