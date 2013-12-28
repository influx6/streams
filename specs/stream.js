module.exports = function(ma,ss){
  
  ma.scoped('low-level stream api');
  
  var master = ss.CappedStreamble.make(3);
  var stream = ss.Streamable.make();
  var transf = ss.Streamable.make(function(n){
      return "<article>"+n+"<article>";
  });
  
  master.bind(stream);
  master.bind(transf);
  
  stream.tell(function(n){
    ma.scoped('simple in-out stream').obj(n).isNumber();
  });

  transf.tell(function(n){
    ma.scoped('transformative out stream').obj(n).isString();
  });
  
  i = 10;
  while(--i){ 
    if(i == 5) master.pause();
    master.add(i);
  }

  transf.pause();
  master.resume();
  transf.resume();
  


}
