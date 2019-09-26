$("body").css("background-color", "rgb(100,100,100)");
$("<canvas>").attr("width","500px").attr("height","200px").attr("id","outputCanvas").appendTo("body");

var canvas = document.getElementById("outputCanvas");
var c =canvas;var ctx = canvas.getContext("2d");

function whiteout() {
	ctx.fillStyle = "rgba(255, 255, 255, 1)";
	ctx.fillRect(0,0,c.width,c.height);
}whiteout();

function cSize(wid,len) {
	c.width=wid;
	c.height=len;
	whiteout();
}

function drawline([x1,y1],[x2,y2],rgb="rgb(0,0,0)",lnWid=1) {
	ctx.beginPath();
	ctx.moveTo(x1,y1);ctx.lineTo(x2, y2);
	ctx.lineWidth=lnWid;ctx.strokeStyle=rgb;
	ctx.stroke(); 
}

function drawArr(arr=[0,100],rgb="rgb(0,0,0)",scale=10,aScale=false){
	if(arr.length<2){
		return "too small"
	}
	for(i=0;i<arr.length-1;i++){
		drawline([i*scale,-arr[i]+c.height],[(i+1)*scale,-arr[i+1]+c.height],rgb);
	}
}

//============================================
function rollDice(dice=[20]){
	sum=0;
	for(i=0;i<dice.length;i++){
		sum+=Math.ceil(Math.random()*dice[i]);
		//if(dice[i]==10||dice[i]==100){sum--;}
	}
	return sum;
}

function weapon(dice=[6,6],dmg=0,toHit=0){
	this.dice=dice;
	this.toHit=toHit;
	this.dmg=dmg;
	this.attack=function(adv=0){
		bonusDice=0;canHit=1;
		attRoll=rollDice();
		if(adv!==0){
			attRollAdv=rollDice();
			if(attRollAdv>attRoll && adv>0){attRoll=attRollAdv;
			}else if(attRollAdv<attRoll && adv<0){attRoll=attRollAdv;
			}
		}
		if(attRoll===20){//crit hit
			bonusDice=rollDice(this.dice);canHit=2;
		}else if(attRoll===1){return [0,0];}//crit miss
		return [bonusDice+rollDice(this.dice)+dmg,(toHit+attRoll)*canHit];
	}
}
var sword = new weapon([6]);

//AC,advProb,multi
function dummy(Weapon=sword,AC=11,advProb=0,multi=0,MaxHP=100,Role=0,Speed=30,Size=5,x=0){
	this.ac=AC;
	this.mhp=MaxHP;
	this.hp=MaxHP;
	this.rhp=function(){
		this.hp=this.mhp;
	}
	this.fhp=function(mod=0){
		this.hp+=mod;
		return this.hp;
	}
	this.Speed=Speed;
	this.x=x;
	this.weapon=Weapon;
	this.advProb=advProb;
	this.multi=multi+1;
	this.wStats=[0,0,0,0];
	this.bStats=[0,0,0];//attacks,pDmg,hits
	this.updateStats=function(){
		for(i=0;i<this.wStats.length-1;i++){this.wStats[i]+=this.bStats[i];}
		this.wStats[3]=this.wStats[2]*this.multi;//console.log(this.multi,this.wStats[1],this.wStats[3]);
		this.bStats=[0,0,0];		
	}
	this.rndAdv=function(prob=0) {
		return Math.floor(Math.random()+prob);
	}
	this.attack=function(target){
		dmgSum=0;attackRoll=[];
		for(im=0;im<this.multi;im++){
			attackRoll=this.weapon.attack(this.rndAdv(this.advProb));
			if(target.ac-1<attackRoll[1]){
				this.bStats[1]++;
				dmgSum+=attackRoll[0];
			}
		}
		this.bStats[0]+=this.multi;
		this.bStats[2]+=dmgSum;
		return dmgSum;
	}
}testDum=new dummy();

function battle1v1(teamA=redDummy,teamB=bluDummy){//console.log(teamB);
	tracker=[[],[]];teamA.rhp();teamB.rhp();
	for(ii=0;teamA.hp>0&&teamB.hp>0;ii++){
		if(ii>1000){return ii;}
		teamB.fhp(-teamA.attack(teamB));
		teamA.fhp(-teamB.attack(teamA));
		tracker[0][ii]=teamB.mhp-teamB.fhp();
		tracker[1][ii]=teamA.mhp-teamA.fhp();
	}//[x1,y1],[x2,y2],rgb="rgb(0,0,0)",lnWid=1
	//drawline([0,teamA.mhp],[c.width,teamA.mhp],"rgba(200,10,0,0.5)",2);
	//drawline([0,teamB.mhp],[c.width,teamB.mhp],"rgba(0,10,200,0.5)",2);
	drawArr(tracker[0],"rgba(100,0,0,0.5)");//red health
	drawArr(tracker[1],"rgba(0,0,100,0.5)");//blue health
	return [teamA.bStats,teamB.bStats];
}
	//dice,+dmg,+hit;AC,+adv,multi
	//calStat([[10],3,6],[15,0,0],[[6],0,0],[15,0,0])
function calStat(rWeapon=[[6],0,0],red=[11,0,0],bWeapon=[[6],0,0],blu=[11,0,0]){
	whiteout();
	teamA=new dummy(new weapon(...rWeapon),...red);teamB=new dummy(new weapon(...bWeapon),...blu);
	//hitChance,hitDmg,roundHits,roundDmg
	//A
	hitChanceA=Math.floor((teamA.weapon.toHit+(teamA.advProb*10)+11-teamB.ac)*5+50)/100; //+hit,ACB,+adv//5<=100/20
	if(hitChanceA<0.05){hitChanceA=0.05;}else if(hitChanceA>0.95){hitChanceA=0.95;}
	roundHitsA=hitChanceA*teamA.multi; //+hit,ACB,+adv//5<=100/20
	dTypeSum=teamA.weapon.dice.reduce((a, b) => a + b)/2+0.5;
	hitDmgA=dTypeSum+teamA.weapon.dmg+Math.floor(teamA.advProb*dTypeSum/20); //dice,+dmg,+adv
	roundDmgA=hitDmgA*teamA.multi;
	probRoundDmgA=hitChanceA*roundDmgA;
	console.log("1-0 to hit:",hitChanceA,";avg hit dmg:",hitDmgA,"; avg hits per round:",roundHitsA,";max dmg round:",roundDmgA,";avg dmg round:",probRoundDmgA);
	//B
}


//AC,advProb,multi
//iterBattle(20,[[10],3,6],[15,0,0],[[6],0,0],[15,0,0])
function iterBattle(iter=20,rWeapon=[[6],0,0],red=[11,0,0],bWeapon=[[6],0,0],blu=[11,0,0]){
	whiteout();
	teamA=new dummy(new weapon(...rWeapon),...red);teamB=new dummy(new weapon(...bWeapon),...blu);//console.log(teamB);
	for(ix=0;ix<iter;ix++){
		teamStats=battle1v1(teamA,teamB);
		teamA.updateStats();teamB.updateStats();
	}
	teamA=teamA.wStats;
	teamB=teamB.wStats;
	if(teamA[1]!==0){
		hitRateA=Math.floor(teamA[1]*100/teamA[0])/100;
		dmgPHitA=Math.floor(teamA[2]*100/teamA[1])/100;
		dmgPRA=Math.floor(teamA[3]*100*hitRateA/teamA[1])/100;
	}else{hitRateA=dmgPHitA=dmgPRA=0;}
	console.log("rHitRate:",hitRateA,"rDmgPHit:",dmgPHitA,"rDmgPRound:",dmgPRA);
	if(teamB[1]!==0){
		hitRateB=Math.floor(teamB[1]*100/teamB[0])/100;
		dmgPHitB=Math.floor(teamB[2]*100/teamB[1])/100;
		dmgPRB=Math.floor(teamB[3]*100*hitRateB/teamB[1])/100;
	}else{hitRateB=dmgPHitB=dmgPRB=0;}
	console.log("bHitRate:",hitRateB,"bDmgPHit:",dmgPHitB,"bDmgPRound:",dmgPRB);
	return [teamA,teamB];//attacks,hits,dmgDelt,dmg*multi
}
//iterBattle(20,new dummy(11,new weapon([12],0,0)),new dummy(11,new weapon([12],0,0)))