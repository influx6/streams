module.exports = function(ma,es){
  
  ma.scoped('high-level eventstream api');
  
  var stream = es.EventStreams.make('example');
  ma.obj(stream).isValid();
  
  stream.stream('change');
  stream.stream('update');
  stream.stream('destroy');

  var one = stream.onStream('change',function(e){
      ma.scoped('one subscriber').obj(e).isNumber();
  });

  var two = stream.onStream('update',function(e){
      ma.scoped('two subscriber').obj(e).is('alex');
  });
  
  var three = stream.onStream('destroy',function(e){
      ma.scoped('three subscriber').obj(e).is(false);
  });

  var combined = es.EventStreams.combine(one.stream,two.stream,three.stream);

  var combinedOrder = es.EventStreams.combineOrder(one.stream,two.stream,three.stream);

  var reduce = es.EventStreams.reduceOrder(one.stream,two.stream,three.stream,function(n){
      return n.join('|');
  });
  
  combined.tell(function(k){
    console.log('combined:',k);
  });


  combinedOrder.tell(function(k){
    console.log('combinedOrder:',k);
  });

  reduce.tell(function(k){
    console.log('reduceOrder',k);
  });


  stream.emit('change',1);
  stream.emit('destroy',false);
  stream.emit('update','alex');
  
  var sum = [];
  var reduceOne = es.EventStreams.reduceOne(one.stream,function(n){
      val = eval(n.join('+'));
      sum.push(val);
      return val;
  },function(sm,st,sr){
      if(st.length >= 20) return true;
      return false;
  });
  

  var i = 21;
  while(i--) stream.emit('change',i);
  i = 21;
  while(i--) stream.emit('change',i);
  
  
  reduceOne.tell(function(m){
    console.log('receieved:',m,eval(sum.join('+')));
  });
  
  stream.close();       
};
