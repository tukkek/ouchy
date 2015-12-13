if(!ai.BUILDINGUPGRADEORDERPREFIX){
  ai.BUILDINGUPGRADEORDERPREFIX='Upgrade To ';
  ai.canpay=function(product){
    if(!scope.getTypeFieldValue(product.id||product.name.toLowerCase(),'cost')){ 
        throw 'Unknown cost for '+(product.id||product.name.toLowerCase());
    }
    return ai.gold>=scope.getTypeFieldValue(product.id||product.name.toLowerCase(),'cost');
  }
  ai.nextproduction=false;
  ai.orderproduction=function(produce,building){
    var order=produce.name;
    var prefix=false;
    if(produce.prefix){
      prefix=produce.prefix+' ';
    }else if(produce.buildingupgrade){
      prefix=ai.BUILDINGUPGRADEORDERPREFIX;
    }
    if(prefix) order=prefix+order;
    scope.order(order,[building]);
    //if(produce.onbuy)produce.onbuy();
  }
  ai.pickproduction=function(produce){
    var chances=[];
    var totalchance=0;
    var cheapest=9000;
    for(var i=0;i<produce.length;i++){// gold loop
      chances[i]=scope.getTypeFieldValue(produce[i].id||produce[i].name.toLowerCase(),'cost');
      if(chances[i]<cheapest)cheapest=chances[i];
    }
    for(var i=0;i<produce.length;i++){//chance loop
      chances[i]=cheapest/chances[i];//lower cost = higher chance
      totalchance+=chances[i];
    }
    totalchance=Math.random()*totalchance;
    for(var i=0;i<produce.length;i++){
      totalchance-=chances[i];
      if(totalchance<=0)return produce[i];
    }
    return produce[produce.length-1];
  }
  ai.produce=function(building){
    if(building.getUnitTypeNameInProductionQueAt(1))return false;
    var produce=ai.getbuildinginfo(building.getTypeName()).produce;
    if(!produce)return false;
    produce=produce.slice();
    var iterate=produce.slice();
    for(var i=0;i<iterate.length;i++){
      var possible=iterate[i];
      if(
          (scope.getTypeFieldValue(possible.id||possible.name.toLowerCase(),'supply'))>
              (scope.getMaxSupply()-scope.getCurrentSupply())||
          (possible.validate&&!possible.validate())
      ) produce.splice(produce.indexOf(possible),1);
    }
    if(produce.length==0)return false;
    var product=ai.pickproduction(produce);
    if(ai.canpay(product))ai.orderproduction(product,building);
    else ai.nextproduction=[product,building];
    return true;
  };
  ai.isbuilding=function(building){
    var buildingname=building.name;
//     ai.log('contains? '+buildingname);
    if(ai.queuedbuildings.contains(building)){
//       ai.log('contains '+buildingname);
      return true;
    }
    if(
      scope.getBuildings({type:buildingname,player:ai.me,}).length
      !=
      scope.getBuildings(
        {type:buildingname,player:ai.me,onlyFinshed:true,}).length
    ){
      return true;
    }
    if(
      scope.getUnits(
        {type:'Worker',player:ai.me,order:'Build '+buildingname,}).length
      >=
      1
    ){
      return true;
    }
    if(building.buildingupgrade){
      var allmybuildings=scope.getBuildings(
        {type:buildingname,player:ai.me,onlyFinshed:true,});
      for(var i=0;i<allmybuildings.length;i++){
        for(var j=1;j<=5;j++){
          var production=
            allmybuildings[i].getUnitTypeNameInProductionQueAt(i);
          if(!production){
            continue;
          }
          if(production==buildingname||
            production==ai.BUILDINGUPGRADEORDERPREFIX+production){
            return true;
          }          
        }
      }
    }
    return false;
  };
  ai.queueprioritybuilding=function(building){
    if(!ai.queuebuilding(building)){
      return false;
    }
    ai.queuedbuildings.pop();
    ai.queuedbuildings.unshift(building);
    var castle=ai.queuedbuildings.indexOf(ai.buildings.Castle);
    if(castle>=0){
      ai.queuedbuildings.splice(
        ai.queuedbuildings.indexOf(ai.buildings.Castle),1);
      ai.queuedbuildings.unshift(ai.buildings.Castle);
    }
  };
  ai.queuebuilding=function(building){
    ai.queuedbuildings[ai.queuedbuildings.length]=building;
    ai.log('Gonna build a '+building.name);
    return true;
  };
  ai.delaybuilding=function(building){
    for(var i=ai.currenttier+1;i<ai.techtree.length;i++){
        if(ai.techtree[i]==building){
            return true
        }
    }
    return false;
  };
}