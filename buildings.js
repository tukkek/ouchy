if(!ai.TOWERINCREMENT){
  ai.TOWERINCREMENT=25;
  ai.SMASHDISTANCE=3;
  ai.SLOWDISTANCE=7;
  ai.HEALDISTANCE=5;
  
  ai.buildings={};
  ai.buildings.Wolf={
    name:'Wolf',
    prefix:'Train',
  };
  ai.validatehumanupgrade=function(){
      return scope.getBuildings({player:ai.me,type:ai.buildings.Barracks.name}).length>=1;
  }
  ai.buildings.AttackUpgrade={
    name:'Attack Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgattack',
  };
  ai.buildings.ArmorUpgrade={
    name:'Armor Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgarmor',
  };
  ai.buildings.SpeedUpgrade={
    name:'Speed Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgspeed',
  };
  ai.buildings.RangeUpgrade={
    name:'Range Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgrange',
  };
  ai.validatemechupgrade=function(){
    return scope.
      getBuildings({player:ai.me,type:'Workshop'}).length>=1;
  }
  ai.buildings.MechAttackUpgrade={
    name:'Mech Attack Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechattack',
  };
  ai.buildings.MechArmorUpgrade={
    name:'Mech Armor Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechdefense',
  };
  ai.buildings.MechSpeedUpgrade={
    name:'Mech Speed Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechspeed',
  };
  ai.buildings.MechRangeUpgrade={
    name:'Mech Range Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechrange',
  };
  ai.buildings.BeastAttackUpgrade={
    name:'Beast Attack Upgrade',
    id:'upgbeastattack',
  };
  ai.buildings.BeastArmorUpgrade={
    name:'Beast Armor Upgrade',
    id:'upgbeastdefense',
  };
  ai.buildings.BeastSpeedUpgrade={
    name:'Beast Speed Upgrade',
    id:'upgbeastspeed',
  };
  ai.buildings.BeastRangeUpgrade={
    name:'Beast Range Upgrade',
    id:'upgbeastrange',
    validate:function(){return scope.getBuildings({player:ai.me,type:ai.buildings.Lair.name,}).length>0;},
  };
  ai.buildings.Worker={
    name:'Worker',
    validate:function(){
      if(ai.isexpanding())
          return false;
      if(scope.getUnits({type:'Worker',player:ai.me,}).length>=ai.MAXWORKERS)
          return false;
      if(ai.queuedbuildings.contains(ai.buildings.Fortress))
          return false;
      return true;
    },
    prefix:'Train',
  };
  ai.buildings.Fortress={
    name:'Fortress',
    role:'passive',
    buildingupgrade:true,
    produce:[ai.buildings.Worker,],
    validate:function(){
      if(ai.techtree[ai.currenttier]==ai.buildings.Fortress||
          scope.getUnits({type:'Worker',player:ai.me,}).length>=ai.MAXWORKERS)
          return true;
      return false;
    }
  };
  ai.buildings.Castle={
    name:'Castle',
    produce:[
      ai.buildings.Fortress,
      ai.buildings.Worker,
    ],
    role:'neutral',
  };
  ai.buildings.WerewolvesDen={
    name:'Werewolves Den',
    id:'werewolvesden',
    role:'active',
    buildingupgrade:true,
    produce:[ai.buildings.Wolf,{
      name:'Werewolf',
      prefix:'Train',
      ability:function(unit){
        var closest=ai.findClosest(unit,ai.groupenemyunits());
        if(closest&&ai.measuredistance(unit,closest)<=ai.SMASHDISTANCE){
          scope.order('Smash',[unit],{});
        }
      }
    },],
  };
  var needshouse=function(){
    return scope.getBuildings({player:ai.me,
      type:ai.buildings.House.name,
      onlyFinshed:true,
    }).length>=1;
  };
  var enemyhasdragons=function(){
      var enemies=ai.groupenemyunits();
      for(var i=0;i<enemies.length;i++){
          if(enemies[i].type==ai.buildings.Dragon.name){
              return true;
          }
      }
      return false;
  }
  ai.buildings.Barrack={
    name:'Barracks',
    role:'active',
    produce:[
      {name:'Archer',prefix:'Train',},
      {
        name:'Soldier',
        prefix:'Train',
        validate:function(){return !enemyhasdragons();},
      },
    ],
    validate:needshouse,
  };
  ai.buildings.Den={
    name:'Wolves Den',
    id:'wolvesden',
    role:'active',
    produce:[ai.buildings.WerewolvesDen,ai.buildings.Wolf],
    validate:needshouse,
  };
  function needmoreupgrades(){
      return scope.getBuildings({player:ai.me,type:ai.buildings.Forge.name,}).length+
             scope.getBuildings({player:ai.me,type:ai.buildings.Laboratory.name,}).length
                <2;
  }
  ai.buildings.Forge={
    name:'Forge',
    role:'passive',
    validate:needmoreupgrades,
    produce:[
      ai.buildings.AttackUpgrade,
      ai.buildings.ArmorUpgrade,
      ai.buildings.SpeedUpgrade,
      //ai.buildings.RangeUpgrade, //TODO range > vision is bad
      ai.buildings.MechAttackUpgrade,
      ai.buildings.MechArmorUpgrade,
      ai.buildings.MechSpeedUpgrade,
      //ai.buildings.MechRangeUpgrade, //TODO range > vision is bad
    ],
  };
  ai.buildings.Guild={
    name:'Mages Guild',
    id:'magesguild',
    role:'passive',
    produce:[{
        name:'Mage',
        prefix:'Train',
        ability:function(unit){
            var closest=ai.findClosest(unit,ai.groupenemyunits());
            if(closest){
                if(ai.measuredistance(unit,closest)<=ai.SLOWDISTANCE){
                    scope.order('Slow Field',[unit],{x:closest.getX(),y:closest.getY()});
                }
            }
        },
    },],
  };
  var healready=false;
  ai.buildings.Church={
    name:'Church',
    role:'passive',
    produce:[
        {
            name:'Research Summon Healing Ward',
            id:'upghealingward',
            validate:function(){return !healready;},
            onbuy:function(){healready=true;},
        }, 
        {
            name:'Priest',
            prefix:'Train',
            ability:function(unit){
                var allies=ai.getsquad(unit);
                for(var i=0;i<allies.length;i++){
                    var a=allies[i];
                    //ai.log(a.getCurrentHP()+'/'+a.getFieldValue('hp')+' d'+ai.measuredistance(unit,a));
                    if(a.getCurrentHP()!=a.getFieldValue('hp')&&
                        ai.measuredistance(unit,a)<=ai.HEALDISTANCE){
                        scope.order('Summon Healing Ward',[unit],{x:a.getX(),y:a.getY()});
                        return;
                    }
                }
            },
        },
    ],
  };
  ai.buildings.House={
    name:'House',
    role:'neutral',
    validate:function(){return !ai.delaybuilding(ai.buildings.House);},
  };
  ai.buildings.Laboratory={
    name:'Animal Testing Lab',
    id:'animaltestinglab',
    role:'passive',
    validate:needmoreupgrades,
    produce:[
      ai.buildings.BeastAttackUpgrade,
      ai.buildings.BeastArmorUpgrade,
      ai.buildings.BeastSpeedUpgrade,
      //ai.buildings.BeastRangeUpgrade, //TODO range > vision is bad
    ],
  };
  ai.buildings.Dragon={name:'Dragon',prefix:'Train',};
  ai.buildings.Lair={
    name:'Dragons Lair',
    id:'dragonslair',
    role:'active',
    produce:[ai.buildings.Dragon,],
    validate:function(){
      return scope.getBuildings({
          player:ai.me,
          type:ai.buildings.Fortress.name,
          onlyFinshed:true,
        }).length>0;
    },
  };
  ai.buildings.Tower={
    name:'Watchtower',
    role:'passive',
  };
  ai.buildings.Workshop={
    name:'Workshop',
    role:'active',
    produce:[{name:'Catapult',prefix:'Construct',},],
  };
  ai.buildings.AdvancedWorkshop={
    name:'Advanced Workshop',
    id:'advancedworkshop',
    role:'active',
    validate:enemyhasdragons,
    produce:[{name:'Ballista',prefix:'Construct',validate:enemyhasdragons,},],
  };
  ai.currenttier=0;
  for(var buildingkey in ai.buildings){
    var building=ai.buildings[buildingkey];
    if(!ai.buildings[building.name]){
      ai.buildings[building.name]=building;
    }
    if(building.produce){
      for(var i=0;i<building.produce.length;i++){
        var production=building.produce[i];
        ai.buildings[production.name]=production;
      }
    }
  }
}
