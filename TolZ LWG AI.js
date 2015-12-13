/* Heavily modified from http://www.reddit.com/r/Littlewargame/comments/2dhopi/lwg_ai/ */
if(!ai.distance){ 
  var MINEDIST = 8; //Used to keep buildings from blocking goldmines
  var ATTACKTIME = 120; //Earliest time the AI will attack

  //Returns the ai.distance between (x1, y1) and (x2, y2)
  ai.distance = function(x1, y1, x2, y2) {
          return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  //Takes in an object: object1 and an array of objects: arr1 and finds the closest object in arr1 to object1
  ai.findClosest = function(object1, arr1) {
    if(!arr1||arr1.length==0) 
        return false;
    var objectX = object1.getX();
    var objectY = object1.getY();
    var closestthing = arr1[0];
    var closestDist = ai.distance(objectX, objectY, closestthing.getX(), closestthing.getY());
    for (var i = 1; i < arr1.length; i++) {
            var currentDist = ai.distance(objectX, objectY, arr1[i].getX(), arr1[i].getY());
            if (closestDist >  currentDist) {
                    closestthing = arr1[i];
                    closestDist = currentDist;
            }
    }
    return closestthing;
  }

  //Sort an array based on the ai.distance from an object (arr1[0] is closest, arr1[arr1.length - 1] is furthest)
  ai.sortDistance = function(obj1, arr1) {
          arr1=arr1.slice();
          var objectX = obj1.getX();
          var objectY = obj1.getY();
          var swapsy;
          //Bubble sort
          for (var i = 0; i < arr1.length; i++) {
                  for (var j = 0; j < arr1.length - i - 1; j++) {
                          if (ai.distance(objectX, objectY, arr1[j].getX(), arr1[j].getY()) >  ai.distance(objectX, objectY, arr1[j + 1].getX(), arr1[j + 1].getY())) {
                                  swapsy = arr1[j];
                                  arr1[j] = arr1[j + 1];
                                  arr1[j + 1] = swapsy;
                          }
                  }
          }
          return arr1;
  }

  //Determines if a building can be built in the box with top-left corner (x1,y1) and bottom-right corner (x2,y2)
  ai.isBuildable = function(x1, y1, x2, y2) {
    for (var x = x1; x <= x2; x++) {
      for (var y = y1; y <= y2; y++) {
        try{
          if (
            x<=0||y<=0||
              x>=scope.getMapWidth()||y>=scope.getMapHeight()||
                game.fieldIsBlocked(x,y)
          ) {
            return false;
          }
        }catch(e){
          if(ai.DEBUG&&false){//TODO notified jbs
            ai.log(ai.format(
              'map {0} {1}',
                [scope.getMapWidth(),scope.getMapHeight(),]));
            ai.log(ai.format('fieldIsBlocked {0} {1}',[x,y,]));
            throw e;
          }else return false;
        }
      }
    }
    return true;
  }

  ai.measurebuilding=function(buildingname){
    if (
      buildingname == "House"|| 
      buildingname == "Barracks"|| 
      buildingname == "Mages Guild"|| 
      buildingname == "Dragons Lair"|| 
      buildingname == "Wolves Den"|| 
      buildingname == "Werewolves Den"
    ) {
      return [3,3];
    }
    if (
      buildingname == "Forge"||
      buildingname == "Castle"||
      buildingname == "Church"||
      buildingname == "Fortress"||
      buildingname == "Workshop"||
      buildingname == "Animal Testing Lab"||
      buildingname == "Advanced Workshop"
    ) {
      return [4,4];
    }
    if(buildingname=='Watchtower'){
      return [2,2];
    }
    throw 'unknown building size:'+buildingname;
  }

  ai.findspot=function(axisxp,axisyp,sizex,sizey,buildingname){
    var axisx=axisxp;
    var axisy=axisyp;
    dance:for(var i=0;i<10000;i++){//TODO maybe make bigger?
      var delta=ai.random(1)==0?-1:1;
      if(ai.random(1)==0){
        axisx+=delta;
      }else{
        axisy+=delta;
      }
      if(axisx<0||axisy<0||axisx>=scope.getMapWidth()||axisy>=scope.getMapHeight()){
        return ai.findspot(axisxp,axisyp,sizex,sizey,buildingname);
      }
      
      var emulator=ai.coordinatestoobject(axisx,axisy);
      if(ai.isBuildable(axisx,axisy,axisx+sizex+1,axisy+sizey+1)){
        var mines=scope.getBuildings({type:'Goldmine'})
        if(ai.DEBUG&&mines.length==0){
          throw 'No goldmines?';
        }
        var distancefromclosestmine=
          ai.measuredistance(emulator,ai.findClosest(emulator,
            mines));
        if(ai.DEBUG&&ai.mybases().length==0){
          throw 'No bases?';
        }
        if(
          distancefromclosestmine<=3||
          (
            ai.measuredistance(emulator,
              ai.findClosest(emulator,ai.mybases()))
            <=MINEDIST
            &&
            distancefromclosestmine<=MINEDIST
          )
        ) continue dance;//looks like it's in between mine and base
        if(ai.DEBUG&&scope.getBuildings({player:ai.me}).length==0){
          throw 'No bases?';
        }
        if(
          ai.measuredistance(emulator,ai.findClosest(emulator,
            scope.getBuildings({player:ai.me})))<=4
        ){
          continue dance;//give some space between buildings
        }
        return [axisx,axisy];
      }
    }
    ai.log('Could not place building!');
    return false;
  }  
  ai.findclosestworker=function(c,workers){
    var closestworker=
      ai.findClosest(ai.coordinatestoobject(c.x,c.y),workers);
    var out=[];
    out[0]=closestworker;
    return out;
  }
  ai.constructBuilding  = function(newBuilding) {
    var myPlayerNumber = ai.me;
    var myBuildings = scope.getBuildings({player: myPlayerNumber});
    var workers = scope.getUnits({type: "Worker", order: "Mine", player: myPlayerNumber});
    var mines = scope.getBuildings({type: "Goldmine"});
    
    var buildingX = null;
    var buildingY = null;
    var buildingLength = null;
    var buildingWidth = null;
    var newBuildingX = null;
    var newBuildingY = null;
    var newBuildingLength = null;
    var newBuildingWidth = null;
    var closestMine = null;
    var castleMineDiffX = null;
    var castleMineDiffY = null;
    var startX = null;
    var startY = null;
    var endValue = null;
    var buildOrder = null;
    
    var newsquare=ai.measurebuilding(newBuilding);
    var lastchoice=false;
    var currentchoice=false;
    
    var bestspot=false;
    var bases=ai.mybases();
    var buildingsperbase=ai.separatebases();
    var smallestbase=Number.MAX_VALUE;
    for(var i=0;i<bases.length;i++){
      var nbuildings=buildingsperbase[i].length;
      if(nbuildings<smallestbase){
        smallestbase=nbuildings;
      }
    }
    var targetbases=[];
    for(var i=0;i<bases.length;i++){
      var nbuildings=buildingsperbase[i].length;
      if(nbuildings==smallestbase){
        targetbases.push(bases[i]);
      }
    }
    var base=ai.pick(targetbases);
    var basex=base.getX();
    var basey=base.getY();
    for(var i=0;i<5;i++){
      var spot=ai.findspot(
          basex,
          basey,
          newsquare[0],
          newsquare[1],
          newBuilding);
      if(
        !bestspot||
        ai.distance(basex,basey,spot[0]+1,spot[1]+1)<=
        ai.distance(basex,basey,bestspot[0]+1,bestspot[y]+1)
        //+1 offset here to reach closer to center of building
      ){
        bestspot=spot;
      }
    }
    if(!bestspot){
      ai.log('Trying to pick a spot again!');
      ai.constructBuilding(newBuilding);
      return;
    }
    
    buildOrder = "Build " + newBuilding;
    var c={x:bestspot[0],y:bestspot[1],};
    if(ai.DEBUG&&workers.length==0){
      throw 'No workers?';
    }
    scope.order(buildOrder,ai.findclosestworker(c,workers),c);
  }

  //Finds a location and orders construction of a castle
  ai.constructCastle = function() {
    var myPlayerNumber = scope.getMyPlayerNumber();
    var myBuildings = scope.getBuildings({player: myPlayerNumber});
    var workers = scope.getUnits({type: "Worker", order: "Mine", player: myPlayerNumber});
    var mines = scope.getBuildings({type: "Goldmine"});
    var minesToBuilding = null;
    var allCastles = scope.getBuildings({type: "Castle"});
    var allForts = scope.getBuildings({type: "Fortress"});
    var allCastlesAndForts = allCastles.concat(allForts);
    var dist = null;
    var suitableMine = null;
    var theGoldmine = null;
    var theGoldmineX = null;
    var theGoldmineY = null;
    var newCastleX = null;
    var newCastleY = null;
    var expansions=[];
    for(var i=0;i<mines.length;i++){
        var m=mines[i];
        if(ai.measuredistance(m,ai.findClosest(m,allCastlesAndForts))>=10){
            expansions[expansions.length]=m;
        }
    }
    mines=expansions;//TODO refactor
    mines.sort(function(a, b){
        return ai.measuredistance(ai.startingcastle,a)-ai.measuredistance(ai.startingcastle,b);
    });
    if(ai.mybases().length>mines.length||mines.length==0)
        return
    theGoldmine=mines[ai.mybases().length];
    if (theGoldmine != null) {
      theGoldmineX = parseInt(theGoldmine.getX());
      theGoldmineY = parseInt(theGoldmine.getY());
      //Above
      if (ai.isBuildable(theGoldmineX - 1, theGoldmineY - 9, theGoldmineX + 2, theGoldmineY - 1)) {
              newCastleX = theGoldmineX - 1;
              newCastleY = theGoldmineY - 9;
      } else if (ai.isBuildable(theGoldmineX, theGoldmineY - 9, theGoldmineX + 3, theGoldmineY - 1)) {
              newCastleX = theGoldmineX;
              newCastleY = theGoldmineY - 9;
      }
      //Below
      else if (ai.isBuildable(theGoldmineX - 1, theGoldmineY + 3, theGoldmineX + 2, theGoldmineY + 11)) {
              newCastleX = theGoldmineX - 1;
              newCastleY = theGoldmineY + 8;
      } else if (ai.isBuildable(theGoldmineX, theGoldmineY + 3, theGoldmineX + 3, theGoldmineY + 11)) {
              newCastleX = theGoldmineX;
              newCastleY = theGoldmineY + 8;
      }
      //Left
      else if (ai.isBuildable(theGoldmineX - 9, theGoldmineY - 1, theGoldmineX - 1, theGoldmineY + 2)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY - 1;
      } else if (ai.isBuildable(theGoldmineX - 9, theGoldmineY, theGoldmineX - 1, theGoldmineY + 3)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY;
      }
      //Right
      else if (ai.isBuildable(theGoldmineX + 3, theGoldmineY - 1, theGoldmineX + 11, theGoldmineY + 2)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY - 1;
      } else if (ai.isBuildable(theGoldmineX + 3, theGoldmineY, theGoldmineX + 11, theGoldmineY + 3)) {
              newCastleX = theGoldmineX + 8;
              newCastleY = theGoldmineY;
      }
      
      if (newCastleX != null) {
        var c={x: newCastleX, y: newCastleY};
        scope.order(
          "Build Castle",ai.findclosestworker(c,workers),c);
      }else ai.log('Could not build castle');
    }
  }
}