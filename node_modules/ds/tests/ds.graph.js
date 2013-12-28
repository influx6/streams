 module.exports  = function(ma,ds){
    
    var graph = ds.Graph.make();

    graph.node(1);
    graph.node(2);
    graph.node(4);
    graph.node(3);
    graph.node(3);

    graph.connectData(1,3,10);
    graph.connectData(4,2,10);
    graph.connectData(2,1,10);
    graph.connectData(2,4,10);
    graph.connectData(3,2,10);
    graph.connectData(4,1,10);

    var df = ds.GraphTraversal.DepthFirst.make(function(node,arc,_){
      ma.scoped('DepthFirst Tranversal').obj(node).isInstanceOf(ds.GraphNode)
      .obj(node.data).isNumber();
    });

    var bf = ds.GraphTraversal.BreadthFirst.make(function(node,arc,_){
      ma.scoped('BreadthFirst Tranversal').obj(node).isInstanceOf(ds.GraphNode)
      .obj(node.data).isNumber();
    });
    
    var dfdf = ds.GT.DepthLimitedDF.make(function(node,arc,_){
      ma.scoped('Depth Limited DepthFirst Tranversal').obj(node).isInstanceOf(ds.GraphNode)
      .obj(node.data).isNumber();
    },3);

    var dfbf = ds.GT.DepthLimitedBF.make(function(node,arc,_){
      ma.scoped('Depth Limited BreadthFirst Tranversal').obj(node).isInstanceOf(ds.GraphNode)
      .obj(node.data).isNumber();
    },4);

    bf.use(graph).amplify().done(function(f){
       ma.scoped('end of breathfirst first').obj(f).is(true);
    });

    graph.markersOff();

    df.use(graph).amplify().done(function(f){
       ma.scoped('end of depth first').obj(f).is(true);
    });
    
    graph.markersOff();

    dfdf.use(graph).amplify().done(function(f){
       ma.scoped('end of depth limited depth first').obj(f).is(true);
    });

    graph.markersOff();

    dfbf.use(graph).amplify().done(function(f){
       ma.scoped('end of depth limited breadth first').obj(f).is(true);
    });

    var dff = ds.GraphFilter.DepthFirst.make(function(key,node,arc,graph){
        if(key === node.data) return arc;
        return false;
    });
    
    ma.scoped('depthfirst graph filter');
    ma.obj(dff.processor).isFunction();
    graph.markersOff();

    dff.use(graph);
    
    dff.filter(3).done(function(n){
      ma.obj(n.node.data).is(3);
      ma.obj('filtering 3 from graph').indicate(true);
    }).fail(function(n){
      ma.obj('filtering 3 from graph').indicate(false);
    });
    
    dff.filterAll(3).done(function(n){
      ma.obj(n).length(2);
    }).fail(function(n){
      ma.obj('filtering all 3 from graph').indicate(false);
    });

    var bff = ds.GraphFilter.BreadthFirst.make(function(key,node,arc,graph){
        if(key === node.data) return arc;
        return false;
    });
    
    ma.scoped('breadth first graph filter');
    ma.obj(bff.processor).isFunction();
    graph.markersOff();

    bff.use(graph);
    
    bff.filter(1).done(function(n){
      ma.obj(n.node.data).is(1);
      ma.obj('filtering 1 from graph').indicate(true);
    }).fail(function(n){
      ma.obj('filtering 1 from graph').indicate(false);
    });
    
    bff.filterAll(1).done(function(n){
      ma.obj(n).length(1);
    }).fail(function(n){
      ma.obj('filtering all 1 from graph').indicate(false);
    });
 };
