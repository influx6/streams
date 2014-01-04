module.exports = function(ma,ss){
  
  ma.scoped('low-level stream api');
  
  var master = ss.newMaxStream(4);
  var stream = ss.newStream();
  var transf = ss.newStream(function(n){
      return "<article>"+n+"<article>";
  });
  
  ss.bindStream(master,stream);
  ss.bindStream(master,transf);

  ss.tellStream(stream,function(n){
    ma.scoped('simple in-out stream').obj(n).isNumber();
  });
  ss.tellStream(transf,function(n){
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
