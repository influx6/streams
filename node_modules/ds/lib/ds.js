// ds - a data structure library

require('em')('ds',function(em){

  var as = em('appstack'), ds = {}, util = as.Utility;
  
  this.exports = ds;
  
  ds.DS = as.Class.create({
     isDS: function(){ return true; }
  });

  ds.Node = as.Class.create({
    init: function(data){ this.data = data; this._marker = false; },
    mark: function(){ this._marker = true; },
    unmark: function(){ this._marker = false },
    marked: function(){ return (this._marker === true); },
    reset: function(){ this.unmark(); this.data = null; }
  });

  ds.ListNode = ds.Node.extend({
    left:null,
    right: null,
    root: null,
    init: function(d){
      this.Super(d);
    },
    onMark: function(){
      this.mark();
      if(this.left) this.left.onMark();
      if(this.right) this.right.onMark();
    },
    offMark: function(){
      this.unmark();
      if(this.left) this.left.offMark();
      if(this.right) this.right.offMark();
    },
    reset: function(){
      this.Super();
      if(this.left) this.left.reset();
      if(this.right) this.right.reset();
      this.left = this.right = this.root = null;
    }
  });

  ds.TreeNode = ds.Node.extend({
    left:null,
    right: null,
    root: null,
    denseness: function(){ },
    height: function(){ }
  });
  
  ds.List  = ds.DS.extend({
    init: function(max){
      this.max = max;
      this.root = null;
      this.tail = null;
      this.counter = as.Counter();
      this.dit = this.iterator();
      this.Super();
      },
      size: function(){ return this.counter.count(); },
      isEmpty: function(){
         return ((this.root && this.tail) === null);
      },
      isFull: function(){
        return (this.counter.count() >= this.max && this.max !== null); 
      },
      iterator: function(){
        return ds.ListIterator.make(this);
      },
      clear: function(){
        this.root.reset();
      },
      add: function(data){
        if(this.isFull()) return;
        if(this.isEmpty()){
          this.root = this.tail = ds.ListNode.make(data);
          this.root.left = this.tail;
          this.tail.right = this.root;
          this.counter.up();
          return this.tail;
        }
        
        var cur = this.tail;
        var left = cur.left;
        var right = cur.right;

        this.tail = ds.ListNode.make(data);
        this.tail.right = this.root;
        this.tail.left = cur;

        cur.right = this.tail;
        
        this.root.left = this.tail;
        

        this.counter.up();

        return this.tail;
      },
      append: function(d){ return this.add(d); },
      prepend: function(data){
        if(this.isFull()) return;
        if(this.isEmpty()){
          this.root = this.tail = ds.ListNode.make(data);
          this.root.left = this.tail;
          this.tail.right = this.root;
          this.counter.up();
          return this.root;
        }

        var cur = this.root;
        var left = cur.left; 
        var  right = cur.right; 

        this.root = ds.ListNode.make(data);

        this.root.left = this.tail;
        this.root.right = cur;

        this.tail.right = this.root;
        
        cur.left = this.root;

        this.counter.up();

        return this.root;
      },
      removeHead: function(){
        if(this.isEmpty()) return;

        var root = this.root;
        left = root.left;
        right = root.right;
        
        if(root === this.tail){
          this.tail = this.root = null; 
          this.counter.blow();
        }
        else{
          this.root = right;
          this.root.left = left;
          left.right = right;
          root.left = root.right = null;
        }
        

        this.counter.down();
        return root;
      },
      removeTail: function(){
        if(this.isEmpty()) return;

        var tail = this.tail;
        left = tail.left;
        right = tail.right;
        
        if(tail === this.root){
          this.tail = this.root = null;
          this.counter.blow();
        } 
        else{
          this.tail = left;
          this.tail.right = right;
          right.left = this.tail;
          tail.left = tail.right = null;
        }


        this.counter.down();
        return tail;
      },
      cascadeBy: function(fn){
        return this.dit.cascadeBy(fn);
      }
      
    });

    ds.Iterator = as.Class.create({
      status:{ reset:0, ready: 1,moving:2, done: -1},
      init: function(d){
        if(!util.instanceOf(d,ds.DS)) throw "You must supply a correct structure object";
        this.ds = d;
        this.state = 0;
        this.track = null;
        this.events = as.Events();
        this.cache = as.HashHelpers({});

      },
      checkCache: function(key){
        return this.cache.get(key);
      },
      cacheIt: function(key,find){
        this.cache.add(key,find);
      },
      current: function(){
        if(this.track === null) return;
        return this.track.data;
      },
      currentNode: function(){
        return this.track;
      },
      move: function(pre,cur,post){
        if(this.state === -1) this.reset();
        if(this.ds === null || this.ds.root === null){
          this.events.emit('error',new Error('List is not initialized or has no nodes!'));
          return false;
        } 

        if(pre(this.ds,this)){ 
          this.state = 1;
          this.events.emit('begin',this.current(),this.currentNode()); 
          this.events.emit('node',this.current(),this.currentNode()); 
          return true; 
        }
        if(cur(this.ds,this)){ 
          this.state = 2;
          this.events.emit('node',this.current(),this.currentNode()); 
          return true; 
        }
        if(post(this.ds,this)){ 
          this.state = -1;
          return true; 
        }

        this.events.emit('end',this.current(),this.currentNode()); 
        this.reset();
        this.events.emit('done');
        return false;
      },
      moveNext: function(){},
      movePrevious: function(){},
      reset: function(){
          this.state = 0;
          this.track =  null;
          this.events.emit('reset');
          return false;
      },
      close: function(){
        this.reset();
        this.events.off('all');
        this.events = null;
      },
      prepend: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('prepend',item.data,item);
        return this.events.emit('prepend',item);
      },
      append: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('append',item.data,item);
        return this.events.emit('append',item);
      },
      remove: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('remove',item.data,item);
        return this.events.emit('remove',item);
      },
      removeAll: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('removeAll',item.data,item);
        return this.events.emit('removeAll',item);
      },
      find: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('find',item.data,item);
        return this.events.emit('find',item);
      },
      findAll: function(item){
        if(util.instanceOf(item,ds.Node)) 
          return  this.events.emit('findAll',item.data,item);
        return this.events.emit('findAll',item);
      },
    });

    ds.ListIterator = ds.Iterator.extend({
       init: function(d){
        this.Super(d);
     },
     moveNext:  function(){
        return this.move(function(ds,list){
            if(list.track === null){
              list.track = ds.root;
              return true;
            }
              return false;
          },
          function(ds,list){
            if(list.track.right !== ds.root){
              list.track = list.track.right;
              return true;
            }
            return false;
          },
          function(ds,list){
            if(list.track.right !== ds.root) return true;
            return false;
          });
    },
    movePrevious: function(){
      return this.move(function(ds,list){
          if(list.track === null){
              list.track = ds.tail;
              return true;
          }
          return false;
      },function(ds,list){
            if(list.track.left !== ds.tail){
                list.track = list.track.left;
                return true;
            }
            return false;
      },function(ds,list){
            if(list.track.left !== ds.tail) return true;
            return false;
      });

    },
    append:function(data){
      var node = ds.ListNode.make(data);
      if(this.state !== (-1 && 0)){
        
        var current = this.currentNode();
        
        var left = current.left;
        var right = current.right;


        current.right = node;
        node.right = right;
        node.left = current;
        right.left = node;

      }else this.ds.append(data);
      
      if(this.checkCache(data)) this.cache.remove(data);
      this.Super(node);
      this.ds.counter.up();
      return node;
    },
    prepend: function(data){
      var node = ds.ListNode.make(data);
      if(this.state !== (-1 && 0)){
        var current = this.currentNode(),
        left = current.left, right = current.right;

        current.left = node;
        node.right = current;
        node.left = left;
        left.right = node;
      }else this.ds.prepend(data);
      
      
      if(this.checkCache(data)) this.cache.remove(data);
      this.Super(node);
      this.ds.counter.up();
      return node;
    },
    remove: function(data){
      var node,it = this.ds.iterator();
      while(it.moveNext()){
        if(it.current() !== data) continue;
        node = it.currentNode();
        break;
      }
      
      if(!node) return false;
      var left = node.left, right = node.right;
      
      left.right = right;
      right.left = left;

      node.left = node.right = null;
      
      
      if(this.checkCache(data)) this.cache.remove(data);
      this.ds.counter.down();
      this.Super(node);
      return node;
    },
    removeAll: function(data){
      var node,left,right,res = [], it = this.ds.iterator();
      while(it.moveNext()){
        if(it.current() !== data) continue;
        node = it.currentNode();
        left = node.left; right = node.right;
        left.right = right;
        right.left = left;
        res.push(node);
        this.ds.counter.down();
      }
      
      util.each(res,function(e){ e.left = e.right = null; });
      
      if(this.checkCache(data)) this.cache.remove(data);
      this.Super(res);
      return res;
    },
    findAll: function(data,fn){
      if(this.checkCache(data)) return this.checkCache(data);
      
      if(fn == null) fn = function(i,d){
          return (i.current() === d ? i.currentNode() : null);
      };

      var node,res = [], it = this.ds.iterator();
      while(it.moveNext()){
        var node = fn(it,data);
        if(!node) continue;
        res.push(node);
      }
      
      if(res.length === 0) return;

      this.cacheIt(data,res);
      this.Super(res);
      return res;
    },
    find: function(data,fn){
      var cache = this.checkCache(data);
      if(!!cache){
        return util.isArray(cache) ? cache[0] : cache;
      }

      if(fn == null) fn = function(i,d){
          return (i.current() === d ? i.currentNode() : null);
      };

      var node,it = this.ds.iterator();
      while(it.moveNext()){
        var node = fn(it,data);
        if(!node) continue;
        break;
      }
      
      if(!node) return false;
      
      this.cacheIt(data,node);
      this.Super(node);
      return node;
    },
    cascadeBy:function(fn){
      var it = this.ds.iterator();
      while(it.moveNext()) fn(it.current(),it.currentNode());
      return it;
    }
  });

  ds.GraphArc = as.Class.create({
    node: null,
    weight: null,
    init: function(n,w){ 
      if(!util.instanceOf(n,ds.GraphNode)) 
        throw "first argument must be an instanceof ds.GraphNode";
      this.node = n; this.weight = w; 
    },
  });
  
  ds.GraphNode = ds.Node.extend({
    init: function(d){
      this.Super(d);
      this.arcs = ds.List.make();
      this.it = this.arcs.iterator();
    },
    bind: function(node,weight){
      if(!util.instanceOf(node,ds.GraphNode)) return;
      this.arcs.add(ds.GraphArc.make(node,weight || 1));
    },
    unbind: function(node){
      if(!util.instanceOf(node,ds.GraphNode)) return;
      return this.it.remove(node);
    },
    hasArc: function(node){
      if(!util.instanceOf(node,ds.GraphNode)) return;
      var res = null;
      while(this.it.moveNext()){
        if(this.it.current().node === node){
          res = this.it.current();
          break;
        };
      }
      return res;
    },
    find: function(data){
      var  res = [];
      while(this.it.moveNext()){
        if(this.it.current().node.data !== data) continue
          res.push(this.it.current());
      }
      return res;
    },
    compare: function(node){
      if(!util.instanceOf(node,ds.GraphNode)) return;
      return this.data === node.data;
    },
    compareData: function(data){
      return this.data === data;
    },
    reset: function(){
      this.Super();
      this.arcs.clear();
      this.it.close();
      this.arcs = null;
      this.it = null;
    }
  });
 
  ds.Graph = ds.DS.extend({
    init: function(){
      this.lists =  ds.List.make();
      this.it = this.lists.iterator();
      this.dataMatrix = function(itr,data){
          var dt = itr.current();
          return (dt.data  === data ? dt : null);
      };
      this.nodeMatrix = function(itr,data){
        var dt = itr.current();
        return (dt === data ? dt: null);
      };

    },
    close: function(){
      this.list.clear();
      this.it.close();
      this.dataMatrix = this.nodeMatrix = null;
    },
    node: function(d1){
      if(util.instanceOf(d1,ds.GraphNode) && !this.it.find(d1,this.nodeMatrix)) return this.lists.add(d1);
      return this.lists.add(ds.GraphNode.make(d1));
    },
    
    connectData: function(d1,d2,weight){
      var self = this;

      var dl1 = this.it.findAll(d1,this.dataMatrix);
      var dl2 = this.it.findAll(d2,this.dataMatrix);
      
      if(!dl1 || !dl2) return;
      
      util.each(dl1,function(e,i,o){
       util.each(dl2,function(k,v,z){
          self.connectNodes(e,k,weight,true);
        });
      });
    },

    connectNodes: function(n1,n2,weight,friz){
      var self = this;
      if(!friz){
        this.add(n1);
        this.add(n2);
      }
      n1.bind(n2,weight);
      //n2.bind(n1,weight);
      return true;
    },

    markersOn: function(){
      this.lists.cascadeBy(function(data,node){
         data.mark();
      });
    },

    markersOff: function(){
      this.lists.cascadeBy(function(data,node){
         data.unmark();
      });
    },

    firstNode: function(){
      return this.lists.root.data;
    },
    lastNode: function(){
      return this.lists.tail.data;
    },
  });

  ds.GraphTraversal = ds.GT = {};

  ds.GraphTraversalRoot = as.Class.create({
      init: function(processor){
        this.graph = null;
        this.processor = processor;
        this._kill = false;
      },
      use: function(g){
        this.graph = g;
        return this;
      },
      ready: function(){
        return (this.graph !== null && this._kill == false);
      },
      amplify: function(){},
      shutdown: function(){
        this._kill = true;
      },
      reset: function(){
        this._kill = false;
      }
  });

  ds.GraphTraversal.DepthFirst = ds.GraphTraversal.DF = ds.GraphTraversalRoot.extend({
    amplify: function(ac){
       if(!this.ready()) this.reset();
      return this._process(ac);
    },

     _process: function(arc,promise){
       if(!this.ready()) return promise.promise();
        
        var point = null, promise = promise || as.Promise.create();
        if(util.instanceOf(arc,ds.GraphArc)) point = arc;
        if(util.instanceOf(arc,ds.GraphNode)) point = ds.GraphArc.make(arc,0);
        if(!arc) point = ds.GraphArc.make(this.graph.firstNode(),0);
        
        this.processor(point.node,point,this);
        point.node.mark();
        var acl = point.node.arcs.iterator();

        while(acl.moveNext()){
          var node = acl.current();
          if(!node.node.marked()) this._process(node,promise);
        }
        
        promise.resolve(true);
        return promise.promise();
     },
  });

  ds.GraphTraversal.BF = ds.GraphTraversal.BreadthFirst = ds.GraphTraversalRoot.extend({
    amplify: function(arc){
       if(!this.ready()) return this.reset();
        
        var self = this, point = null, promise = as.Promise.create();
        if(util.instanceOf(arc,ds.GraphArc)) point = arc;
        if(util.instanceOf(arc,ds.GraphNode)) point = ds.GraphArc.make(arc,0);
        if(!arc) point = ds.GraphArc.make(this.graph.firstNode(),0);
      
        var queue = ds.List.make();
        queue.add(point);
        queue.root.data.node.mark();

        while(!queue.isEmpty()){
          if(!this.ready()){ 
            this.reset(); 
            break; 
          }
          var nd = queue.root.data, it = nd.node.arcs.iterator();
          this.processor(nd.node,nd,self);
          while(it.moveNext()){
            var cur = it.current();
            if(!cur.node.marked()){
              queue.add(cur);
              cur.node.mark();
            }
          }
          queue.removeHead();
        }

        promise.resolve(true);
        return promise.promise();
    }
  });
  
  ds.GraphTraversal.DLDF = ds.GraphTraversal.DepthLimitedDF = ds.GraphTraversal.DepthFirst.extend({
    init: function(processor,depth){
      this.Super(processor);
      this.depth  = this._dp = depth;
    },
    ready: function(){
      return (this.Super() && this.hasDepth());
    },
    _process: function(arc,promise){
      if(this.hasDepth()){
        this._dp -= 1;
        return this.Super(arc,promise);
      } 
      return promise.promise();
    },
    hasDepth: function(){
      return this._dp !== 0;
    },
    reset: function(){
      this._dp = this.depth;
      this.Super();
    },
  });

  ds.GraphTraversal.DLBF = ds.GraphTraversal.DepthLimitedBF = ds.GraphTraversal.BreadthFirst.extend({
    init: function(processor,depth){
      this.Super(processor);
      this.depth  = this._dp = depth;
    },
    ready: function(){
      return (this.Super() || this.hasDepth());
    },
    amplify: function(arc){
       if(!this.ready() || !this.hasDepth()) return this.reset();
        
        var self = this, point = null, promise = as.Promise.create();
        if(util.instanceOf(arc,ds.GraphArc)) point = arc;
        if(util.instanceOf(arc,ds.GraphNode)) point = ds.GraphArc.make(arc,0);
        if(!arc) point = ds.GraphArc.make(this.graph.firstNode(),0);
        

        var queue = ds.List.make();
        queue.add(point);
        queue.root.data.node.mark();

        while(!queue.isEmpty()){
          if(!this.ready() || !this.hasDepth()){ 
            this.reset(); 
            break; 
          }
          var nd = queue.root.data, it = nd.node.arcs.iterator();
          this.processor(nd.node,nd,self);
          while(it.moveNext()){
            var cur = it.current();
            if(!cur.node.marked()){
              queue.add(cur);
              cur.node.mark();
            }
          }
          if(this.hasDepth()) this._dp -= 1;
          queue.removeHead();
        }

        promise.resolve(true);
        return promise.promise();
    },
    hasDepth: function(){
      return this._dp !== 0;
    },
    reset: function(){
      this._dp = this.depth;
      this.Super();
    }
  });

  ds.GraphFilterCore = as.Class.create({
      init: function(processor){
        this.graph = null;
        this.key = null;
        this.transversal = null;
        this.processor = processor;
        this.state = null;
        this._filterOneProcessor = util.proxy(function(node,arc,ob){
          var res = this.processor(this.key,node,arc,ob);
          if(res){
            this.state.resolve(res);
            this.transversal.shutdown();
          }
        },this);
      },
      use: function(g){
       if(!util.instanceOf(g,ds.Graph)) return this;
       this.graph = g;
       return this;
      },
      filter: function(n){
        var self = this;
        this.key = n;
        this.state = as.Promise.create();
        //if('markersOff' in this.graph && util.isFunction(this.graph.markersOff)) this.graph.markersOff();
        this.transversal.use(this.graph).amplify().done(function(n){ self.state.reject(n); });
        return this.state.promise();
      },
      filterAll: function(n){
        var find = this.graph.it.findAll(n,this.graph.dataMatrix);
        var state =  as.Promise.create();
        if(util.isArray(find)){
          (find.length <= 0 ? state.reject(false) : state.resolve(find));
        }else state.reject(find);
        
        return state.promise();
      },
  });

  ds.GraphFilter = ds.GF = {};
  
  ds.GraphFilter.DepthFirst = ds.GraphFilterCore.extend({
    init: function(fn,depth){
      if(util.isFunction(depth)){
          var fnv = fn;
          fn = depth;
          depth = fnv;
      }
      this.Super(fn);
      this.transversal = (util.isNumber(depth) ? ds.GT.DepthLimitedDF.make(this._filterOneProcessor) 
                          : ds.GT.DF.make(this._filterOneProcessor));
    }
  });

  ds.GraphFilter.BreadthFirst = ds.GraphFilterCore.extend({
    init: function(fn,depth){
      if(util.isFunction(depth)){
          var fnv = fn;
          fn = depth;
          depth = fnv;
      }
      this.Super(fn);
      this.transversal = (util.isNumber(depth) ? ds.GT.DepthLimitedBF.make(this._filterOneProcessor) 
                          : ds.GT.BreadthFirst.make(this._filterOneProcessor));
    }
  
  });

},this);
