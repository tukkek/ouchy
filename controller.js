/* See section labeled ouchy.js */
var ai=this;

ai.DEBUG=true;
ai.DEBUGONEPLAYER=false;
ai.DEBUGEARLYCASTLES=false;
ai.ALLOWAGGRESSIVE=false;

ai.me=scope.getMyPlayerNumber();
ai.clock=Math.round(scope.getCurrentGameTimeInSec());
ai.gold=scope.getGold();
ai.enemies=[];
ai.allies=[];
if(ai.DEBUGONEPLAYER&&scope.getArrayOfPlayerNumbers()[0]!=ai.me){
  return;
}
var playernumbers=scope.getArrayOfPlayerNumbers();
for(var i=0;i<playernumbers.length;i++){
    var team=scope.getMyTeamNumber()==scope.getTeamNumber(playernumbers[i])?ai.allies:ai.enemies;
    team[team.length]=playernumbers[i];
}

if(!ai.log){
  ai.log=function(message){
    if(ai.DEBUG){
      console.log(message);
    }
  }
  ai.lastaccountancy=0;
  ai.queuedbuildings=[];
  ai.format = function(text,replacements) {
    for(var i=0;i<replacements.length;i++) {
      text=text.replace("{" + i + "}",replacements[i]);
    }
    return text;
  };
  ai.measuredistance=function(ob1,ob2){
    return ai.distance(
      ob1.getX(),ob1.getY(),ob2.getX(),ob2.getY());
  }
  ai.joinarrays=function(a1,a2){
    var a3=[];
    for(var i=0;i<a1.length;i++){
      a3[a3.length]=a1[i];
    }
    for(var i=0;i<a2.length;i++){
      a3[a3.length]=a2[i];
    }
    return a3;
  }
  ai.sameobject=function(o1,o2){//TODO can now use equals()
    return o1.getX()==o2.getX()&&o1.getY()==o2.getY();
  }
  ai.random=function(max){
    var r=scope.getRandomNumber(0,1)*max;
    //ai.log(r+' #random');
    r=Math.round(r);
    //ai.log(r+' #floor');
    return r;
  }
  if(ai.me==1){
      var result='';
      for(var i=0;i<1000;i++){
          result+=ai.random(1)==0?0:1;
      }
      ai.log(result);
      throw 'stop';
  }
  ai.pick=function(pickarray){
    return pickarray[ai.random(pickarray.length-1)];
  }
  ai.getbuildinginfo=function(name){
//     ai.log('Info about: '+name);
    return ai.buildings[name];
  }
  ai.coordinatestoobject=function(x,y){
    return {
      getX:function(){return x;},
      getY:function(){return y;},
    };
  };
  ai.separatebases=function(){
    var bases=ai.mybases();
    var buildingsperbase=[];
    for(var i=0;i<bases.length;i++){
      buildingsperbase[i]=[bases[i]];
    }
    var mybuildings= 
      scope.getBuildings({player:ai.me,});
    for(var i=0;i<mybuildings.length;i++){
      var mybuilding=mybuildings[i];
        if(ai.DEBUG&&bases.length==0){
          throw 'No bases?2';
        }
      var closestbase=ai.findClosest(mybuilding,bases);
      buildingsperbase[bases.indexOf(closestbase)].push(
        mybuilding); 
    }
    return buildingsperbase;
  }
  ai.shuffle=function(array){
    for(var i = array.length - 1; i > 0; i--) {
        var j = ai.random(i);
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
  }
}
