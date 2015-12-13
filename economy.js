if(!ai.MAXMINERSPERBASE){
  ai.MAXMINERSPERBASE=10;
  ai.MAXMININGDISTANCE=11;
  ai.MAXWORKERS=35;
  ai.PERIODECONOMY=10;
  ai.isexpanding=function(){
    if(ai.neverexpand){
      return false;
    }
    if(ai.isbuilding(ai.buildings.Castle)){
      return true;
    }
    var totalworkers=scope.getUnits({type:'Worker',player:ai.me,}).length;
    if(totalworkers>=ai.MAXWORKERS){
      return false;
    }
    var bases=ai.mybases(); 
    for(var i=0;i<bases.length;i++){
      if(bases[i].getUnitTypeNameInProductionQueAt(1)=='Worker'){
        totalworkers+=1;  
      }
    }
    return totalworkers>=ai.mymines().length*ai.MAXMINERSPERBASE;
  }
  ai.mymines=function(){
    var bases=ai.joinarrays(
      scope.getBuildings(
        {type:'Castle',player:ai.me,onlyFinshed:true}),
      scope.getBuildings(
        {type:'Fortress',player:ai.me,onlyFinshed:true}));
    var mines=scope.getBuildings({type:'Goldmine'});
    var invalidmines=[];
    for(var i=0;i<mines.length;i++){
      var mine=mines[i];//TODO ignore depleted mines
      if(ai.DEBUG&&bases.length==0)throw 'No bases?1';
      var closestbase=ai.findClosest(mine,bases);
      if( 
        (!closestbase.getX||!mine.getX)||
        ai.measuredistance(closestbase,mine)
            >ai.MAXMININGDISTANCE||
        mines[i].getValue('gold')==0
      ){
        invalidmines.push(mine);
      }
    }
    for(var i=0;i<invalidmines.length;i++){
      mines.splice(mines.indexOf(invalidmines[i]),1);
    }
    return mines;
  }
  ai.mybases=function(){
    var bases=ai.joinarrays(
      scope.getBuildings({type:'Castle',player:ai.me,}),
      scope.getBuildings({type:'Fortress',player:ai.me,})
    );
    var mines=scope.getBuildings({type:'Goldmine',});
    var remove=[];
    basecheck:for(var i=0;i<bases.length;i++){
        for(var j=0;j<mines.length;j++){
            if(ai.measuredistance(bases[i],mines[j])<=ai.MAXMININGDISTANCE&&
                mines[j].getValue('gold')!=0)continue basecheck;
        }
        remove.push(bases[i]);
    }
    for(var i=0;i<remove.length&&remove.length>1;i++){
        bases.splice(bases.indexOf(remove[i]),1);
    }
    return bases;
  }
  ai.debugeconomy=function(label,accountability){//TODO
  };
  ai.lastrepair=0;
  ai.organizeeconomy=function(){
    ai.lastaccountancy=ai.clock;
    var mines=ai.mymines();
    /*for(var i=0;i<mines.length;i++){
        ai.DEBUG=true;
        ai.log(i+': '+mines[i].getValue('gold')+'/'+mines[i].getValue('startGold'));
    }*/
    var bases=ai.mybases();
    if(scope.getUnits({type:'Worker',player:ai.me,}).length==0)return;
    var miners=ai.joinarrays(         
      scope.getUnits({type:'Worker',player:ai.me,order:'Mine',}),
      scope.getUnits({type:'Worker',player:ai.me,order:'Stop',}));
    var civilianfighters=scope.getUnits({type:'Worker',player:ai.me,order:'AMove',});
    var enemies=ai.groupenemyunits();
    for(var i=0;i<civilianfighters.length;i++){
        var civilian=civilianfighters[i];
        if(enemies.length==0||
            ai.measuredistance(civilian,ai.findClosest(civilian,enemies))>
                ai.CIVILDEFENSERADIUS) miners.push(civilian);
    }
    /* REPAIRS */
    if(ai.clock-ai.lastrepair>30){
        var repairing=scope.getUnits({type:'Worker',player:ai.me,order:'Repair',});
        var buildings=scope.getBuildings({player:ai.me});
        for(var i=0;i<buildings.length;i++){
            var b=buildings[i];
            if(repairing.length>0&&ai.measuredistance(b,ai.findClosest(b,repairing))<2)
                continue;
            //ai.log(b.getFieldValue('hp')+'\\'+b.getCurrentHP())
            if(b.getFieldValue('hp')!=b.getCurrentHP()){
                var m=ai.findClosest(b,miners);
                scope.order('Repair',[m],{unit:b,});
                miners.splice(miners.indexOf(m),1);
            }
        }
        ai.lastrepair=ai.clock;
    }
    /* SETUP */
    var accountability={};
    for(var i=0;i<mines.length;i++){//initialize data structure
      accountability[i]={workers:[]};
    }
    for(var i=0;i<miners.length;i++){//all workers mine on closest base
      var miner=miners[i];
      var closestmine=ai.sortDistance(miner,mines)[0];
      scope.order('Mine',[miner],{unit:closestmine,});
      closestmine=accountability[mines.indexOf(closestmine)].workers;
      closestmine[closestmine.length]=miner;
    }
    var remainingminers=[];
    for(var i=0;i<mines.length;i++){//check each mine
      var mine=mines[i];
      var miners=accountability[i].workers;
      var extraminers=miners.length-ai.MAXMINERSPERBASE;
      if(extraminers<=0){
        continue;//cancel if mine is operating on decent capacity
      }
      miners=ai.sortDistance(mine,miners);//TODO
      relocatesurplusminer:for(var j=1;j<=extraminers;j++){//relocate surplus miners
        var miner=miners[miners.length-j];
        if(!miner)continue;
        var closestmines=ai.sortDistance(miner,mines);
        for(var k=0;k<closestmines.length;k++){
          var destinationmine=closestmines[k];
          if(destinationmine==mine){
            continue;//can't relocate to here
          }
          var destination=
            accountability[mines.indexOf(destinationmine)].workers;
          if(destination.length>=ai.MAXMINERSPERBASE){
            continue;//relocate only to underloaded mine
          }
          miners.splice(miners.indexOf(miner),1);
          destination[destination.length]=miner;
          scope.order('Mine',[miner],{unit:destinationmine,});
          continue relocatesurplusminer;
        }
        remainingminers[remainingminers.length]=miner;
      }
    }
    if(scope.getUnits({type:'Worker',player:ai.me,}).length<mines.length*10){//don't expand yet
        return;
    }
    ai.debugeconomy('--',accountability);//TODO
    var nremainingminers=remainingminers.length;
    if(nremainingminers!=0){
      ai.log(ai.format('Wtf do I do with these {0} extra miners?!',[nremainingminers]));
    }
    if(!ai.neverexpand&&
       !ai.isbuilding(ai.buildings.Castle)&&
       ai.isexpanding()&&
       !ai.delaybuilding(ai.buildings.Castle)){//starts an expansion
         ai.log('Gotta expand!');
         ai.queuebuilding(ai.buildings.Castle);
    }
  }
  ai.neverexpand=ai.mymines().length>=3;//# of starting mines
  ai.startingcastle=ai.mybases()[0];
}