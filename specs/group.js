module.exports = function(ma,es,as){
  
  ma.scoped('high-level group-eventstream api');
  
  var sp  = require('sparkflow').exports;
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

  var group = sp.Utils.massCombineUnOrder(function(streams,combine){
    return ready.ready();
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
  
  group.tell(function(n){
      console.log('group:',n);
  });

  
  b.emit('<article>');
  d.emit(1);
  d.emit(2);
  d.emit(3);
  d.emit(4);
  d.emit(4);
  b.emit('<article>');
  d.emit(5);
  b.emit('</article>');
  b.emit('<article>');
  d.emit(6);
  e.emit('</article>');
  b.emit('<article>');
  d.emit(7);
  e.emit('</article>');
  d.emit(4);
  d.emit(4);
  d.emit(4);
  e.emit('</article>');

  b.emit('<article>');
  d.emit('a');
  d.emit('b');
  d.emit('c');
  e.emit('</article>');

  d.emit('200');
};
