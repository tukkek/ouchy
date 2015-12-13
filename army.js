if(!ai.PERIODARMY){
  ai.PERIODARMY=5;
  ai.INCURSIONRANGE=40;
  ai.SCOUTPRECISION=15;
  ai.CIVILDEFENSERADIUS=10;
  ai.lastassignments=0;
  ai.attacksquads=[];
  ai.defencesquads=[];
  ai.scouts=[];
  ai.squaddestination={};
  ai.spread=false;
  for(var i=0;i<ai.enemies.length;i++){
    ai.scouts.push(scope.getStartLocationForPlayerNumber(ai.enemies[i]));
  }
  ai.scouts=ai.shuffle(ai.scouts);
  ai.cleansquads=function(allsquads){
    for(var i=0;i<allsquads.length;i++){//empty squad?
      var deadsquad=allsquads[i];
      if(deadsquad.length>0){
        continue;
      }
      ai.log('lost squad '+i);
      var newarray=[];
      for(var j=0;j<allsquads.length;j++){//removes a squad
        if(j!=i){
          newarray.push(allsquads[j]);
        }
      }
      allsquads=newarray;
      var index=ai.attacksquads.indexOf(deadsquad);
      if(index>=0){
        ai.attacksquads.splice(i,1);
      }else{
        ai.defencesquads.splice(
          ai.defencesquads.indexOf(deadsquad),1);
      }
      //avoid concurrent modifications during array iteration:
      return ai.cleansquads(allsquads);
    }
    return allsquads;
  }
  ai.valueunits=function(us){
    var sum=0;
    for(var i=0;i<us.length;i++){
      sum+=us[i].getFieldValue('supply');
    }
    return sum;
  }
  ai.movesquad=function(movesquad,x,y){
    for(var i=0;i<movesquad.length;i++){
      scope.order('AMove',movesquad,{x:x,y:y,});
    }
  }
  ai.listexpandingbases=function(){
    var expansions=scope.getBuildings(
      {player:ai.me,type:'Castle',});
    var builtexpansions=scope.getBuildings(
      {player:ai.me,type:'Castle',onlyFinshed:true});
    for(var i=0;i<builtexpansions.length;i++){//unfinished exps.
      expansions.splice(
        expansions.indexOf(builtexpansions[i]),1);
    }
    return expansions;
  }
  ai.indexinsquad=function(member,squad){
    //==, indexOf... do not work
    for(var i=0;i<squad.length;i++){
      if(member.equals(squad[i])){
        return i;
      }
    }
    return -1;
  }
  ai.groupenemyunits=function(){
    var enemyunits=[];
    for(var i=0;i<ai.enemies.length;i++){
      var enemyfaction=scope.getUnits({player:ai.enemies[i],});
      for(var j=0;j<enemyfaction.length;j++){
        enemyunits.push(enemyfaction[j]);
      }
    }
    return enemyunits;
  }
  function randomspot(){
    var destination=false;
    while(
        !destination||
        !scope.positionIsPathable(destination.x,destination.y)//TODO: not enough to check if pathable, needs to see if unit can actually walk there
    )destination={x:ai.random(scope.getMapWidth()),y:ai.random(scope.getMapHeight()),};
    return destination;
  }
  ai.spreadout=function(){
      //ai.DEBUG=true;
      //ai.log('spreading! before '+ai.attacksquads.length);//TODO
      ai.spread=false;
      for(var i=0;i<ai.attacksquads.length;i++){
          var squad=ai.attacksquads[i];
          while(squad.length>1){
              ai.attacksquads.push([squad[1]]);
              squad.splice(1,1);
          }
      }
      //ai.log('spreading! after '+ai.attacksquads.length);//TODO
  }
  ai.assign=function(){
    /* WORKER DEFENSE */
    var workers=scope.getUnits({player: ai.me,type:'Worker',order:'Mine',});
    var enemies=ai.groupenemyunits();
    for(var i=0;i<workers.length;i++){
        var w=workers[i];
        var closest=ai.findClosest(w,enemies);
        if(closest&&ai.measuredistance(w,closest)<=ai.CIVILDEFENSERADIUS){
            scope.order('AMove',[w],{x:closest.getX(),y:closest.getY(),});
        }
    }
    /* PREPARATION */
    if(ai.spread)ai.spreadout();
    var units=scope.getUnits({player: ai.me,notOfType:'Worker',});
    var allsquads=ai.joinarrays(ai.attacksquads,ai.defencesquads);
    for(var i=0;i<allsquads.length;i++){//honor the dead
      var squadc=allsquads[i];
      var dead=[];
      for(var j=0;j<squadc.length;j++){
        var alive=false;
        var member=squadc[j];
        for(var k=0;k<units.length;k++){
          if(member.equals(units[k])){
            alive=true;
            squadc[j]=units[k];//update reference
            break;
          }
        }
        if(!alive){
          dead.push(member);
        }
      }
      for(var j=0;j<dead.length;j++){
        squadc.splice(squadc.indexOf(dead[j]),1);
      }
    }
    allsquads=ai.cleansquads(allsquads);//KOed squads
    var first=ai.defencesquads.length==0;
    var rookies=first?[]:ai.defencesquads[0];    
    rookie:for(var i=0;i<units.length;i++){//enlist rookies
        for(var j=0;j<allsquads.length;j++){
            if(ai.indexinsquad(units[i],allsquads[j])>=0){
                continue rookie;
            }
        }
        if(ai.valueunits(rookies)>9){
            ai.log('Creating new defence squad');
            rookies=[];
            ai.defencesquads.unshift(rookies);
        }
        rookies.push(units[i]);
    }
    if(first&&rookies.length>0){
      ai.defencesquads[0]=rookies;
    }
    var populationvalue=ai.valueunits(scope.getUnits(
      {player: ai.me}));
    var militaryvalue=0;
    for(var i=0;i<allsquads.length;i++){
      militaryvalue+=ai.valueunits(allsquads[i]);
    }
    if(militaryvalue==0){
      return;
    }
    if(
      (militaryvalue>=(populationvalue-militaryvalue)||
        (scope.getMaxSupply()-scope.getCurrentSupply())<10)
      &&ai.defencesquads.length>0
      &&ai.defencesquads[ai.defencesquads.length-1].length>2
    ){
      ai.log('Attack! ');
      var newsquad=[];
      for(var i=0;i<Math.ceil(ai.defencesquads.length/2);i++){
        var fromsquad=ai.defencesquads.pop();
        for(var j=0;j<fromsquad.length;j++){
          newsquad.push(fromsquad[j]);
        }
      }
      ai.attacksquads.push(newsquad);
    }
    
    /* PLANNING */
    var expansions=ai.listexpandingbases();
    var alliancebuildings=[];
    for(var i=0;i<ai.allies.length;i++){
        alliancebuildings=ai.joinarrays(alliancebuildings,scope.getBuildings({player:ai.allies[i],}));
    }
    var enemyunits=ai.groupenemyunits();
    var underattack=false;
    checkattack:for(var i=0;i<enemyunits.length;i++){
      var enemy=enemyunits[i];
      if(
        ai.measuredistance(
          ai.findClosest(enemy,alliancebuildings),enemy)
        <=ai.INCURSIONRANGE
      ){
        underattack=true;
        break checkattack;
      }
    }
    if(underattack){//defend
      ai.log('Under attack!');
      for(var i=0;i<ai.defencesquads.length;i++){
        var member=ai.pick(ai.defencesquads[i]);
        var closestenemy=ai.findClosest(member,enemyunits);
        scope.order('AMove',ai.defencesquads[i],
          {x:closestenemy.getX(),y:closestenemy.getY(),});
      }
    }else{
      for(var i=0;i<ai.defencesquads.length;i++){//patrol
        var squadd=ai.defencesquads[i];
        if(squadd.length==0){
          continue;
        }
        if(i<expansions.length){//defend expansions
          ai.movesquad(
            squadd,expansions[i].getX(),expansions[i].getY());
        }else{//defend nearest base to a random unit
          var buildingsperbase=ai.separatebases();
          var unit=ai.pick(squadd);
          var bases=ai.mybases();
          var closestbase=ai.findClosest(unit,bases);
          var building=
            buildingsperbase[bases.indexOf(closestbase)];
          building=ai.pick(building);
          ai.movesquad(squadd,building.getX(),building.getY());
        }
      }
    }
    var enemybuildings=[];
    for(var i=0;i<ai.enemies.length;i++){
      var enemystructures=
        scope.getBuildings({player:ai.enemies[i],});
      for(var j=0;j<enemystructures.length;j++){
        enemybuildings.push(enemystructures[j]);
      }
    }
    for(var i=0;i<ai.attacksquads.length;i++){//attack 
      var attacksquad=ai.attacksquads[i];
      if(attacksquad.length==0){
        throw 'Attack squad should not be empty!';
      }
      var member=ai.pick(attacksquad);
      if(enemybuildings.length==0){//scout
        ai.log('scout');
        var destination=ai.squaddestination[i];
        if(!destination){
          if(ai.scouts.length==0){
              ai.spread=true;
              destination=randomspot();
          } else destination=ai.scouts[0];
          ai.squaddestination[i]=destination;
        }
        scope.order('AMove',attacksquad,destination);
        if(//arrival
          ai.distance(
            member.getX(),member.getY(),
            destination.x,destination.y)<ai.SCOUTPRECISION
        ){
          var isplayerlocation=ai.scouts.indexOf(destination);
          if(isplayerlocation>=0)ai.scouts.splice(isplayerlocation,1);
          ai.squaddestination[i]=false;
        }
      }else{//attack
        ai.log('incursion');
        enemybuildings=ai.sortDistance(member,enemybuildings);
        var target=enemybuildings[0];
        for(var j=0;j<enemybuildings.length;j++){
          if(
            enemybuildings[j].getTypeName()!=
            ai.buildings.Tower.name
          ){
            target=enemybuildings[j];
            break;
          }
        }
        scope.order('AMove',attacksquad,
          {x:target.getX(),y:target.getY(),});
      }
    }
  }
  ai.getsquad=function(unit){
    var allsquads=ai.joinarrays(ai.attacksquads,ai.defencesquads);
    for(var i=0;i<allsquads.length;i++){
      var squad=allsquads[i];
      for(var j=0;j<squad.length;j++){
        if(unit.equals(squad[j])){
          return squad;
        }
      }
    }
    ai.log('Returning empty squad since none found');
    return [];
  }
}