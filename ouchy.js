/*
File: Ouchy! Artificial intelligence script for Littlewargame with easily customizable builds
Author: omegletrollz

For LWG Version: v3.62
AI Version: 3.0
Project Start Date: Feb 3, 2015
Version Release Date: Dec 4, 2015

More info at https://github.com/tukkek/ouchy
You can find Littlewargame at http://littlewargame.com/
*/
if(!ai.beastmode){
  var humanpool=[
    ai.buildings.Barrack,ai.buildings.Forge,
    ai.buildings.Guild,ai.buildings.Church,
    ai.buildings.Workshop,ai.buildings.AdvancedWorkshop,
    ai.buildings.Tower,ai.buildings.Tower,
  ];
  var beastpool=[
    ai.buildings.Den,ai.buildings.Den,
    ai.buildings.Fortress,ai.buildings.Fortress,//details at Fortress#validate
    ai.buildings.Lair,ai.buildings.Lair,
    ai.buildings.Laboratory,ai.buildings.Laboratory,
    ai.buildings.Tower,ai.buildings.Tower,
  ];
  ai.raxor=[//double rax
    ai.buildings.House,
    ai.buildings.Barrack,ai.buildings.Barrack,
    humanpool,
  ];
  ai.warlock=[ //rax into mages
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Guild,
    [
        ai.buildings.Barrack,ai.buildings.Barrack,
        ai.buildings.Forge,
        ai.buildings.Guild,
        ai.buildings.Tower,
    ]];
  ai.paladin=[ //rax into priests
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Church,
    [
        ai.buildings.Barrack,ai.buildings.Barrack,
        ai.buildings.Forge,
        ai.buildings.Church,
        ai.buildings.Tower,
    ]];
  ai.beastmode=[//den into dragon
    ai.buildings.House,
    ai.buildings.Den,ai.buildings.Den,
    ai.buildings.Castle,//delays autoexpansion
    ai.buildings.Fortress,
    ai.buildings.Lair,
    [
      ai.buildings.Den,ai.buildings.Laboratory,
      ai.buildings.Lair,ai.buildings.Lair,
    ],
  ];
  ai.catastrophe=[//den and cata
    ai.buildings.Den,
    ai.buildings.Workshop,
    ai.buildings.Castle,
    ai.pick([ai.buildings.Den,ai.buildings.Workshop,]),
    [
      ai.buildings.Den,ai.buildings.Den,
      ai.buildings.Workshop,ai.buildings.Workshop,
      ai.buildings.AdvancedWorkshop,ai.buildings.AdvancedWorkshop,
      ai.buildings.Forge,ai.buildings.Laboratory,
    ],
  ];
  ai.raxexpand=[ //rax -> expand
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Castle,
    ai.buildings.Tower,
    humanpool,
  ];
  ai.tworaxexpand=[ //expand first -> 2 rax
    ai.buildings.Castle,
    ai.buildings.Tower,
    ai.buildings.House,
    ai.buildings.Barrack,ai.buildings.Barrack,
    humanpool,
  ];
  ai.denexpand=[ //den -> expand
    ai.buildings.House,
    ai.buildings.Den,
    ai.buildings.Castle,
    ai.buildings.Tower,
    beastpool,
  ];
  ai.twodenexpand=[ //expand -> 2 den
    ai.buildings.Castle,
    ai.buildings.Tower,
    ai.buildings.House,
    ai.buildings.Den,ai.buildings.Den,
    beastpool,
  ];
  var aggressive=ai.pick([
    ai.pick([ai.raxor,ai.pick([ai.warlock,ai.paladin,]),]), //50% chance human
    ai.pick([ai.beastmode,ai.beastmode,ai.catastrophe,]), //50% chance beast
  ]);
  var defensive=ai.pick([ai.raxexpand,ai.denexpand,ai.tworaxexpand,ai.twodenexpand,]);
  ai.techtree=ai.pick([aggressive,defensive,]);
  /*
   * jbs asked that for a first in-game version there be 50% of castle first
   * and 50% of defensive build. This line coincidentally ensures that.
   * 
   * TODO jbs has talked about letting letting the player select different AIs in the future.
   * this would enable this line to be modified for different version: passive/aggressive/early
   * expand/specific builds and so on
   * 
   * Remove this line to play with the full set of builds.
   */
  if(!ai.ALLOWAGGRESSIVE) ai.techtree=defensive;
}

try{
  ai.log('micro');
  if(ai.clock-ai.lastassignments>=ai.PERIODARMY){//micro
    ai.lastassignments=ai.clock;
    ai.assign();
  }
  var fighting=scope.getUnits({notOfType:'Worker',player:ai.me,});
  for(var i=0;i<fighting.length;i++){//activate powers
    var power=ai.buildings[fighting[i].getTypeName()];
    if(!power)
        continue;
    power=power.ability;
    if(power&&power(fighting[i])){
      //TODO cannot `return` yet because not sure if power is being actived or just spammed
    }
  }

  ai.log('economy');
  if(//organize economy
    ai.clock-ai.lastaccountancy>=ai.PERIODECONOMY||
    scope.getUnits(
      {type:'Worker',player:ai.me,order:'Stop',}).length!=0||
    ai.clock==0
  ){
    ai.organizeeconomy();
    return;
  }

  ai.log('build next');
  if(ai.nextproduction){
    if(ai.canpay(ai.nextproduction[0])){
      ai.orderproduction(ai.nextproduction[0],ai.nextproduction[1]);
      ai.nextproduction=false;
    }
    return;
  }
  var buildings=scope.getBuildings({player:ai.me,onlyFinshed:true,});
  for(var i=0;i<buildings.length;i++){//produce units
    if(ai.produce(buildings[i]))return;
  }
  
  if(scope.getUnits({type: "Worker", order: "Mine", player: ai.me,}).length==0)
      return;//no builders
      
  ai.log('queue house');
  if(//build house
    scope.getMaxSupply()<100
    &&scope.getMaxSupply()-scope.getCurrentSupply()<10
    &&!ai.isbuilding(ai.buildings.House)&&!ai.isbuilding(ai.buildings.Castle)
    &&ai.techtree[ai.currenttier]!=ai.buildings.House
    &&ai.techtree[ai.currenttier]!=ai.buildings.Castle//early expand
    &&!ai.delaybuilding(ai.buildings.House)
  ){
    ai.queuebuilding(ai.buildings.House);
    return;
  }
  
  if(ai.queuedbuildings.length!=0){//build queued building
    ai.log('build queue');
    var nextbuilding=ai.queuedbuildings[0];
    if(ai.neverexpand&&nextbuilding.name=='Castle'){
        ai.queuedbuildings.shift();
        return;
    }
    if(!ai.canpay(nextbuilding)){
      return;
    }
    ai.queuedbuildings.shift();
    if(nextbuilding.buildingupgrade){
        ai.log('Upgrading to '+nextbuilding.name);//TODO
      var buildings=scope.getBuildings({player:ai.me,});
      var found=false;
      for(var i=0;i<buildings.length;i++){
        var targetbuilding=
          ai.getbuildinginfo(buildings[i].getTypeName()).produce;
        if(
          targetbuilding&&
            targetbuilding.indexOf(nextbuilding)>=0
        ){
          scope.order(
            'Upgrade To '+nextbuilding.name,[buildings[i]]);
          found=true;
          break;
        }
      }
      if(!found)throw 'Could not upgrade to '+nextbuilding.name;
    } 
    else if (nextbuilding.name=='Castle') ai.constructCastle();
    else ai.constructBuilding(nextbuilding.name);
    return;
  }else{//let's think of a new building to make
    ai.log('determine next building');
    if(ai.currenttier>=ai.techtree.length){
      return;
    }
    var nextbuilding=ai.techtree[ai.currenttier];
    var finalstep=nextbuilding.constructor===Array;
    if(finalstep){//optional building step
      var verifyrole=nextbuilding;
      var buildings=scope.getBuildings({player:ai.me,});
      var activedelta=0;
      for(var i=0;i<buildings.length;i++){
        var role=
          ai.getbuildinginfo(buildings[i].getTypeName()).role;
        if(role=='active'){
          activedelta+=1;
        }else if(role=='passive'){
          activedelta-=1;
        }else if(role!='neutral')
          throw 'Unknown role: '+buildings[i].name;
      }
      ai.log('active delta: '+activedelta);
      if(-1<=activedelta&&activedelta<=+1){
        activedelta==ai.random(1)==1?-1:+1;
      }
      var activeoptions=[];
      var passiveoptions=[];
      for(var i=0;i<nextbuilding.length;i++){
        var optionalbuilding=nextbuilding[i];
        var role=optionalbuilding.role;
        if(role=='active'){
          activeoptions[activeoptions.length]=optionalbuilding;
        }else if(role=='passive'){
          passiveoptions[passiveoptions.length]=optionalbuilding;
        }else if(role!='neutral')
          throw 'Unknown role: '+optionalbuilding.name;
      }
      var choices=false;
      if(activedelta>0){
        choices=[passiveoptions,activeoptions,];
      }else{
        choices=[activeoptions,passiveoptions,];
      }
      nextbuilding=false;
      for(var i=0;i<choices.length;i++){
        if(choices[i].length>0){
          nextbuilding=ai.pick(choices[i]);
          break;
        }
      }
      if(!optionalbuilding)throw 'No building options?!';
    }
    if(nextbuilding.validate&&!nextbuilding.validate()){
      return;//wait until time is right
    }
    ai.queuebuilding(nextbuilding);
    if(!finalstep){
      /*var totalneeded=0;
      for(var i=0;i<=ai.currenttier;i++){
        if(ai.techtree[i]==nextbuilding){
          totalneeded+=1;
        }
      }
      if(1+scope.getBuildings({player:ai.me,type:nextbuilding.name}).length<totalneeded){
        //need to wait to make more as per build declaration
        ai.log('Still need more '+nextbuilding.name+
            ' '+scope.getBuildings({player:ai.me,type:nextbuilding.name}).length+'/'+totalneeded);
        return;
      }*/
      ai.currenttier+=1;
      ai.log('Advancing to tier '+ai.currenttier);
    }
    return;
  }
}catch(e){
  console.log(e.stack);
  if(ai.DEBUG){//if an exception is raised the game freezes
    throw e;
  }
}
