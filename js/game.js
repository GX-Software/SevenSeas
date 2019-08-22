
var size = 11;
var curLevel = 0, allLevels = 0, levelList;
var levelCode = "";
var codeLevel = -1, codeHard = -1;

var curMap = [];
var undoMap = [];
var undoScore = new scoreManage;
var canUndo = true;

var userDead = false;
var atomWidth = 0, atomHeight = 0;

var xmlMain = null;

var curBoatPos = new point(0, 0);
var curBoatDir = 1;

var testString = "";

var crossPos = [];
crossPos.push(new point(0, 0));
crossPos.push(new point(0, 0));

function map(item, dir, distX, distY, boom)
{
	this.item = item; // 地图内容
	this.dir = dir; // 当前炮艇的移动方向，12点方向为1，1-8
	this.distX = distX; // 剩余移动距离，或旋转计数
	this.distY = distY; // 剩余移动距离
	this.boom = boom; // 该位置是否有爆炸
}
var boomHappens = false;

function pirateInfo(x, y, item, dir)
{
	this.x = x;
	this.y = y;
	this.item = item;
	this.dir = dir;
	this.distX = 0;
	this.distY = 0;
	this.moved = false;
	this.crossPos = [new point(-1, -1), new point(-1, -1)];
}
var piratePos = []; // 由于海盗船移动后可能发生碰撞导致多个海盗船共用同一个位置，所以按不同海盗船进行记录

var whirlPos = new point(-1, -1);
var whirlStep = 0;

// ------------------------------------------------------------------------
// 被其它js引用的函数
function startGame()
{
	// 开始等待动画结束
	startStep.next = waitForStartGame;
	startStep.start(0);
}
// 被其它js引用的函数结束
// ------------------------------------------------------------------------

function loadXML(strURL)
{
	if (!strURL) {
		return null;
	}
	
	var xmlhttp;
	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	}
	else { // code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}

	if (!xmlhttp) {
		alert("解析模块不可使用!")
		return null;
	}

	xmlhttp.open("GET", strURL, false);
	xmlhttp.send();

	return xmlhttp.responseXML;
}

function waitForStartGame()
{
	initGame();
	showScreen = 1;
	
	return 0;
}

function initGame()
{
	if (gameStyle == 0) {
		var tag = ["easy", "normal", "hard"];
		levelList = xmlMain.getElementsByTagName(tag[difficulty])[0].getElementsByTagName("level");
		
		if (testVar) {
			allLevels = 1;
		}
		else {
			allLevels = levelList.length;
			
			// 如果难度对应，则从代码对应的关数开始
			if (difficulty == codeHard) {
				curLevel = codeLevel;
			}
		}
	}
	else {
		allLevels = 0;
	}
	
	if (testVar) {
		document.getElementById("mapData").innerHTML = "";
	}
	
	userDead = false;
	atomWidth = gridWidth / size;
	atomHeight = gridHeight / size;
	
	score.allScore = 0;
	
	initMap();
	initLevel();
}

function waitForEndGame()
{
	curLevel = 0;
	showScreen = 0;
	
	return 0;
}

function initMap()
{
	if (curMap.length) {
		for (var j = 0; j < size; j++) {
			for (var i = 0; i < size; i++) {
				curMap[j][i].boom = 0;
				curMap[j][i].distX = 0;
				curMap[j][i].distY = 0;
				
				undoMap[j][i].item = -1;
				undoMap[j][i].dir = 0;
			}
		}
	}
	else {
		var list;
		for (var j = 0; j < size; j++) {
			list = new Array();
			for (var i = 0; i < size; i++) {
				list[i] = new map(0, 0, 0, 0, 0);
			}
			
			curMap[j] = list;
		}
		
		for (var j = 0; j < size; j++) {
			list = new Array();
			for (var i = 0; i < size; i++) {
				list[i] = new map(-1, 0, 0, 0, 0);
			}
			
			undoMap[j] = list;
		}
	}
}

function initLevel()
{
	resetScore();
	resetUndoMap();
	
	switch(gameStyle)
	{
	case 0:
		setMap();
		break;
		
	case 1:
		randomLevel();
		break;
	}
	
	curBoatDir = 3;
	curBoatPos.x = Math.floor(size / 2);
	curBoatPos.y = Math.floor(size / 2);
	curMap[curBoatPos.y][curBoatPos.x].item = 1;
	curMap[curBoatPos.y][curBoatPos.x].dir = 3;
	
	piratePos.splice(0, piratePos.length);
	checkPirates(curBoatPos.x, curBoatPos.y, 6, false, size - 1, true);
	checkPirates(curBoatPos.x, curBoatPos.y, 7, false, size - 1, true);
	checkPirates(curBoatPos.x, curBoatPos.y, 8, false, size - 1, true);
	
	checkBoatCross();
	checkPiratesCross();
}

function setMap()
{
	if (testVar && levelCode.length >= 11 * 11) {
		var index = 0, item = 0;
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				item = parseInt(levelCode.slice(index, index + 1));
				index++;
				if (item !== item) {
					j--;
					continue;
				}
				curMap[i][j].item = item;
				curMap[i][j].dir = 0;
				curMap[i][j].distX = 0;
				curMap[i][j].distY = 0;
			}
		}
	}
	else {
		var mapStr = levelList[curLevel].getElementsByTagName("map")[0].childNodes[0].nodeValue;
		var index = 0;
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				curMap[i][j].item = parseInt(mapStr.slice(index, index + 1));
				index++;
				curMap[i][j].dir = 0;
				curMap[i][j].distX = 0;
				curMap[i][j].distY = 0;
			}
		}
	}
}

function randomLevel()
{
	var x, y;
	var list = [4, 6, 7, 8];
	var count = [0, 0, 0, 0];
	var avoid = [0, 2, 3, 4];
	var rand = 0;
	
	switch(difficulty)
	{
	case 0:
		// 简单模式：小岛2-4个，初级海盗船2-4艘
		count[0] = Math.round(Math.random() * 2) + 2;
		count[1] = Math.round(Math.random() * 2) + 2;
		break;
		
	case 1:
		// 适中模式：小岛2-4个，中级海盗船0-2艘（每艘顶初级海盗船2艘），初级海盗船4-6艘
		// 50%可能性不出现任何中级海盗船
		count[0] = Math.round(Math.random() * 2) + 2;
		if (Math.random() > 0.5) {
			count[2] = 0;
		}
		else {
			count[2] = Math.round(Math.random() * 2);
		}
		count[1] = Math.round(Math.random() * 2) + 4;
		if (count[1] - count[2] * 2 <= 0) {
			count[1] = Math.round(Math.random() * 1) + 1;
		}
		else {
			count[1] -= (count[2] * 2);
		}
		break;
		
	case 2:
		// 困难模式：小岛3-6个，高级海盗船0-2艘（每艘顶初级海盗船3艘），中级海盗船0-2艘（每艘顶初级海盗船2艘），初级海盗船6-10艘
		// 75%可能性不出现任何高级海盗船，50%可能性不出现任何中级海盗船。
		count[0] = Math.round(Math.random() * 3) + 3;
		rand = Math.random();
		if (rand < 0.75) {
			count[3] = 0;
		}
		else if (rand < 0.95) {
			count[3] = 1;
		}
		else {
			count[3] = 2;
		}
		if (Math.random() > 0.5) {
			count[2] = 0;
		}
		else if (count[3] < 2) {
			count[2] = Math.round(Math.random() * 2);
		}
		else {
			// 当有两艘高级海盗船时，最多一艘中级海盗船
			count[2] = Math.round(Math.random());
		}
		count[1] = Math.round(Math.random() * 4) + 6;
		if (count[1] - count[2] * 2 - count[3] * 3 <= 0) {
			count[1] = Math.round(Math.random() * 1) + 1;
		}
		else {
			count[1] -= (count[2] * 2 + count[3] * 3);
		}
		break;
	}
	
	for (var i = 0; i < size; i++) {
		for (var j = 0; j < size; j++) {
			curMap[i][j].item = 0;
			curMap[i][j].dir = 0;
			curMap[i][j].distX = 0;
			curMap[i][j].distY = 0;
			curMap[i][j].boom = 0;
		}
	}
	
	curMap[0][0].item = 2;
	curMap[0][size-1].item = 2;
	curMap[size-1][0].item = 2;
	curMap[size-1][size-1].item = 2;
	curMap[Math.floor(size/2)][Math.floor(size/2)].item = 1;
	
	for (var i = 0; i < list.length; i++) {
		while(count[i]) {
			x = Math.round(Math.random() * (size-1));
			y = Math.round(Math.random() * (size-1));
			
			if ((x >= Math.floor(size / 2) - avoid[i] && x <= Math.floor(size / 2) + avoid[i] && y >= Math.floor(size / 2) - avoid[i] && y <= Math.floor(size / 2) + avoid[i]) ||
					curMap[y][x].item) {
				continue;
			}
			else {
				curMap[y][x].item = list[i];
				count[i]--;
			}
		}
	}
	
	if (testVar) {
		testString = "";
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				testString += curMap[i][j].item;
			}
			testString += " ";
		}
	}
}

function nextLevel()
{
	if (curLevel == allLevels - 1) {
		gameOver(false);
		return false;
	}
	else {
		curLevel++;
		// 当达到100关后，难度上升
		if (!(curLevel % 100) && difficulty < 2) {
			difficulty++;
		}
	}
	
	initLevel();
	return true;
}

function levelUp()
{
	actionStep.clear();
	checkBoatCross();
	showScreen = 3;
	
	if (testVar) {
		var oldString = document.getElementById("mapData").innerHTML;
		if (oldString.length) {
			oldString += "<br />";
		}
		
		try {
			document.getElementById("mapData").innerHTML = oldString + testString;
		}
		catch(e) {}
	}
}

function gameOver(dead)
{
	if (dead) {
		showScreen = 4;
		userDead = true;
		actionStep.clear();
	}
	else {
		if (score.allScore > score.hiScore) {
			var name = prompt("恭喜您获得了新高分，请输入您的名字（取消放弃保存）", "无名");
			if (name) {
				score.hiScore = score.allScore;
				
				window.localStorage.removeItem("hiScore");
				window.localStorage.setItem("hiScore", score.hiScore);
				
				if (!name.length) {
					name = "无名";
				}
				
				var len = getHiNameLen(name);
				score.hiName = name.slice(0, len)
				
				window.localStorage.removeItem("hiName");
				window.localStorage.setItem("hiName", score.hiName);
			}
		}
		
		if (gameStyle == 0 && !testVar) {
			if (userDead) {
				levelCode = levelList[curLevel].getElementsByTagName("pswd")[0].childNodes[0].nodeValue;
			}
			else {
				if (codeHard == difficulty) {
					levelCode = "";
				}
			}
			checkCode();
		}
		
		// 开始等待动画结束
		startStep.next = waitForEndGame;
		startStep.start(2);
	}
}

function checkGameClick(p)
{
	switch(showScreen)
	{
	case 1:
		showScreen = 2;
		break;
		
	case 2:
		if (moveStyle == 0) {
			handleMove(0, 0);
		}
		else {
			var x = 0, y = 0;
			
			if (p.x < (curBoatPos.x - 0.1) * atomWidth) {
				x = -1;
			}
			else if (p.x > (curBoatPos.x + 1.1) * atomWidth) {
				x = 1;
			}
			else {
				x = 0;
			}
			
			if (p.y < (curBoatPos.y - 0.1) * atomHeight + headHeight) {
				y = -1;
			}
			else if (p.y > (curBoatPos.y + 1.1) * atomHeight + headHeight) {
				y = 1;
			}
			else {
				y = 0;
			}
			
			handleMove(x, y);
		}
		break;
		
	case 3:
		if (nextLevel()) {
			showScreen = 2;
		}
		break;
		
	case 4:
		gameOver(false);
		break;
	}
}

function checkGameMove(p)
{
	var x = 0, y = 0;
	
	if (Math.sqrt((p.y - preClick.y) * (p.y - preClick.y) + (p.x - preClick.x) * (p.x - preClick.x)) < atomWidth) {
		return;
	}
	
	a = Math.atan2(p.y - preClick.y, p.x - preClick.x) * 180 / Math.PI;
	
	if (a <= 90 / 4 * 3 && a >= -90 / 4 * 3) {
		x = 1;
		if (a <= 90 / 4 && a >= -90 / 4) {
			y = 0;
		}
		else if (a > 90 / 4) {
			y = 1;
		}
		else {
			y = -1;
		}
	}
	else if (a >= 90 / 4 + 90 || a <= -90 / 4 - 90) {
		x = -1;
		if (a >= 90 / 4 * 3 + 90 || a <= -90 / 4 * 3 - 90) {
			y = 0;
		}
		else if (a > 0 && a < 90 / 4 * 3 + 90) {
			y = 1;
		}
		else {
			y = -1;
		}
	}
	else {
		x = 0;
		if (a > 0) {
			y = 1;
		}
		else {
			y = -1;
		}
	}
	
	handleMove(x, y);
}

function checkGameKey(x, y)
{
	handleMove(x, y);
}

function handleMove(x, y)
{
	saveUndoInfo();
	
	moveBoat(x, y);
}

function moveBoat(x, y)
{
	// 到了战场边缘，不能移动
	if (curBoatPos.y + y >= size || curBoatPos.y + y < 0 || curBoatPos.x + x >= size || curBoatPos.x + x < 0) {
		return;
	}
	
	actionStep.next = waitForBoatMove;
	actionStep.start(0);
	
	score.step++;
	
	var rand = false;
	var x1, y1;
	
	// 到达漩涡，随机传送
	// 传送要求我方船只周围3格内无敌方船只
	if (curMap[curBoatPos.y + y][curBoatPos.x + x].item == 2) {
		score.whirl++;
		
		rand = true;
		
		for(x1 = curBoatPos.x, y1 = curBoatPos.y; ; ) {
			x1 = Math.floor(Math.random() * (size-1));
			y1 = Math.floor(Math.random() * (size-1));
			
			if (curMap[y1][x1].item == 0 &&
					!checkPirates(x1, y1, 6, false, 3, false) &&
					!checkPirates(x1, y1, 7, false, 3, false) &&
					!checkPirates(x1, y1, 8, false, 3, false)) {
				// 不可传送至四个角
				if (x1 == 0 && y1 != 0 && y1 != size-1) {
					break;
				}
				else if (x1 == size-1 && y1 != 0 && y1 != size-1) {
					break;
				}
				else {
					break;
				}
			}
		}
		
		if (showAnimation) {
			// 保存漩涡位置
			whirlPos.x = curBoatPos.x + x;
			whirlPos.y = curBoatPos.y + y;
		}
		else {
			whirlPos.x = -1;
			whirlPos.y = -1;
			
			curMap[curBoatPos.y][curBoatPos.x].item = 0;
			curMap[y1][x1].item = 1;
			curBoatPos.x = x1;
			curBoatPos.y = y1;
			curBoatDir = Math.round(Math.random() * 7) + 1; // 方向也是随机的
			curMap[y1][x1].dir = curBoatDir;
			
			return;
		}
	}
	else {
		whirlPos.x = -1;
		whirlPos.y = -1;
	}
	
	// 移动本方炮艇一格
	// 新位置在移动之后设定
	// 死亡判定在移动结束后进行
	curMap[curBoatPos.y][curBoatPos.x].item = 0;
		
	var preX = curBoatPos.x, preY = curBoatPos.y, preDir = curBoatDir;
	// 移动后的方向
	switch(x)
	{
	case -1:
		switch(y)
		{
		case -1: curBoatDir = 8; break;
		case 0: curBoatDir = 7; break;
		case 1: curBoatDir = 6; break;
		}
		break;
		
	case 0:
		switch(y)
		{
		case -1: curBoatDir = 1; break;
		case 0: break;
		case 1: curBoatDir = 5; break;
		}
		break;
		
	case 1:
		switch(y)
		{
		case -1: curBoatDir = 2; break;
		case 0: curBoatDir = 3; break;
		case 1: curBoatDir = 4; break;
		}
		break;
	}
	
	// 更改炮艇位置
	if (rand) {
		// 漩涡处保存旋转前的方向
		curMap[whirlPos.y][whirlPos.x].dir = curBoatDir;
		
		curBoatPos.y = y1;
		curBoatPos.x = x1;
		// 新位置的方向是随机的
		curBoatDir = Math.round(Math.random() * 7) + 1;
	}
	else {
		curBoatPos.y = curBoatPos.y + y;
		curBoatPos.x = curBoatPos.x + x;
	}
	// 保存新位置的方向
	curMap[curBoatPos.y][curBoatPos.x].dir = curBoatDir;
		
	// 开炮操作
	if (x == 0 && y == 0) {
		score.boom++;
		
		if (showAnimation) {
			var b = false;
			if (crossPos[0].x >= 0) {
				curMap[crossPos[0].y][crossPos[0].x].boom = 15;
				b = true;
			}
			if (crossPos[1].x >= 0) {
				curMap[crossPos[1].y][crossPos[1].x].boom = 15;
				b = true;
			}
			movie = 0;
			boomHappens = b;
		}
		else {
			if (crossPos[0].x >= 0 && crossPos[0].y >= 0) {
				if (curMap[crossPos[0].y][crossPos[0].x].item >= 6) {
					findPirate(crossPos[0].x, crossPos[0].y, 0, false, true);
					curMap[crossPos[0].y][crossPos[0].x].item = 5;
				}
				else if (curMap[crossPos[0].y][crossPos[0].x].item == 4) {
					curMap[crossPos[0].y][crossPos[0].x].item = 3;
				}
			}
			if (crossPos[1].x >= 0 && crossPos[1].y >= 0) {
				if (curMap[crossPos[1].y][crossPos[1].x].item >= 6) {
					findPirate(crossPos[1].x, crossPos[1].y, 0, false, true);
					curMap[crossPos[1].y][crossPos[1].x].item = 5;
				}
				else if (curMap[crossPos[1].y][crossPos[1].x].item == 4) {
					curMap[crossPos[1].y][crossPos[1].x].item = 3;
				}
			}
			
			if (!piratePos.length) {
				levelUp();
			}
		}
	}
	// 如果确实发生了移动
	else if (showAnimation) {
		var curDir = rand ? curMap[whirlPos.y][whirlPos.x].dir : curBoatDir;
		
		// 在原位置distX保存旋转方向，正数为顺时针旋转的次数，负数为逆时针旋转的次数
		var dev = ((curDir > preDir) ? curDir : (curDir + 8)) - preDir;
		// 转过一个方向需要两次
		if (dev <= 4) {
			curMap[preY][preX].distX = dev * 2;
		}
		else {
			curMap[preY][preX].distX = (dev - 8) * 2;
		}
			
		if (rand) {
			// 保存漩涡处旋转两圈（旋转为逆时针）
			whirlStep = 33;
			
			// 在漩涡处保存剩余距离（按像素）
			switch(curMap[whirlPos.y][whirlPos.x].dir)
			{
			case 1: curMap[whirlPos.y][whirlPos.x].distX = 0; curMap[whirlPos.y][whirlPos.x].distY = atomHeight; break;
			case 2: curMap[whirlPos.y][whirlPos.x].distX = -atomWidth; curMap[whirlPos.y][whirlPos.x].distY = atomHeight; break;
			case 3: curMap[whirlPos.y][whirlPos.x].distX = -atomWidth; curMap[whirlPos.y][whirlPos.x].distY = 0; break;
			case 4: curMap[whirlPos.y][whirlPos.x].distX = -atomWidth; curMap[whirlPos.y][whirlPos.x].distY = -atomHeight; break;
			case 5: curMap[whirlPos.y][whirlPos.x].distX = 0; curMap[whirlPos.y][whirlPos.x].distY = -atomHeight; break;
			case 6: curMap[whirlPos.y][whirlPos.x].distX = atomWidth; curMap[whirlPos.y][whirlPos.x].distY = -atomHeight; break;
			case 7: curMap[whirlPos.y][whirlPos.x].distX = atomWidth; curMap[whirlPos.y][whirlPos.x].distY = 0; break;
			case 8: curMap[whirlPos.y][whirlPos.x].distX = atomWidth; curMap[whirlPos.y][whirlPos.x].distY = atomHeight; break;
			}
			
			// 在新位置保存旋转两圈（旋转为顺时针）
			curMap[curBoatPos.y][curBoatPos.x].distX = 33;
		}
		else {
			whirlStep = 0;
			
			// 在新位置保存剩余距离（按像素）
			switch(curBoatDir)
			{
			case 1: curMap[curBoatPos.y][curBoatPos.x].distX = 0; curMap[curBoatPos.y][curBoatPos.x].distY = atomHeight; break;
			case 2: curMap[curBoatPos.y][curBoatPos.x].distX = -atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = atomHeight; break;
			case 3: curMap[curBoatPos.y][curBoatPos.x].distX = -atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = 0; break;
			case 4: curMap[curBoatPos.y][curBoatPos.x].distX = -atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = -atomHeight; break;
			case 5: curMap[curBoatPos.y][curBoatPos.x].distX = 0; curMap[curBoatPos.y][curBoatPos.x].distY = -atomHeight; break;
			case 6: curMap[curBoatPos.y][curBoatPos.x].distX = atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = -atomHeight; break;
			case 7: curMap[curBoatPos.y][curBoatPos.x].distX = atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = 0; break;
			case 8: curMap[curBoatPos.y][curBoatPos.x].distX = atomWidth; curMap[curBoatPos.y][curBoatPos.x].distY = atomHeight; break;
			}
		}
	}
}

function waitForBoatMove()
{
	if (crossPos[0].x >= 0) {
		curMap[crossPos[0].y][crossPos[0].x].boom = 0;
	}
	if (crossPos[1].x >= 0) {
		curMap[crossPos[1].y][crossPos[1].x].boom = 0;
	}
	
	settleBoat();
	
	if (curMap[curBoatPos.y][curBoatPos.x].item != 1) {
		gameOver(true);
		return true;
	}
	
	if (movePirates()) {
		actionStep.next = waitForPiratesMove;
		return true;
	}
	else {
		actionStep.next = waitForPiratesCannon;
		return false;
	}
}

function checkBoatCross()
{
	crossPos[0].x = -1;
	crossPos[0].y = -1;
	crossPos[1].x = -1;
	crossPos[1].y = -1;
	
	var reach = 3;
	var item = 0;
	
	switch(curBoatDir)
	{
	case 1:
	case 5:
		if (curBoatPos.x != 0) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y][curBoatPos.x - i].item;
				if (curBoatPos.x - i <= 0 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[0].x = curBoatPos.x - i;
			crossPos[0].y = curBoatPos.y;
		}
		
		if (curBoatPos.x != size - 1) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y][curBoatPos.x + i].item;
				if (curBoatPos.x + i >= size - 1 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[1].x = curBoatPos.x + i;
			crossPos[1].y = curBoatPos.y;
		}
		break;
		
	case 3:
	case 7:
		if (curBoatPos.y != 0) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y - i][curBoatPos.x].item;
				if (curBoatPos.y - i <= 0 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[0].x = curBoatPos.x;
			crossPos[0].y = curBoatPos.y - i;
		}
		
		if (curBoatPos.y != size - 1) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y + i][curBoatPos.x].item;
				if (curBoatPos.y + i >= size - 1 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[1].x = curBoatPos.x;
			crossPos[1].y = curBoatPos.y + i;
		}
		break;
		
	case 2:
	case 6:
		if (curBoatPos.x != 0 && curBoatPos.y != 0) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y - i][curBoatPos.x - i].item;
				if (curBoatPos.x - i <= 0 || curBoatPos.y - i <= 0 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[0].x = curBoatPos.x - i;
			crossPos[0].y = curBoatPos.y - i;
		}
		
		if (curBoatPos.x != size - 1 && curBoatPos.y != size - 1) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y + i][curBoatPos.x + i].item;
				if (curBoatPos.x + i >= size - 1 || curBoatPos.y + i >= size - 1 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[1].x = curBoatPos.x + i;
			crossPos[1].y = curBoatPos.y + i;
		}
		break;
		
	case 4:
	case 8:
		if (curBoatPos.x != size - 1 && curBoatPos.y != 0) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y - i][curBoatPos.x + i].item;
				if (curBoatPos.x + i >= size - 1 || curBoatPos.y - i <= 0 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			crossPos[0].x = curBoatPos.x + i;
			crossPos[0].y = curBoatPos.y - i;
		}
		
		if (curBoatPos.x != 0 && curBoatPos.y != size - 1) {
			for (var i = 1; i <= reach; i++) {
				item = curMap[curBoatPos.y + i][curBoatPos.x - i].item;
				if (curBoatPos.x - i <= 0 || curBoatPos.y + i >= size - 1 || item >= 6 || item == 3 || item == 4) {
					break;
				}
			}
			if (i > reach) {
				i--;
			}
			
			crossPos[1].x = curBoatPos.x - i;
			crossPos[1].y = curBoatPos.y + i;
		}
		break;
	}
}

function settleBoat()
{
	curMap[curBoatPos.y][curBoatPos.x].boom = 0;
	
	switch(curMap[curBoatPos.y][curBoatPos.x].item)
	{
	case 0:
		curMap[curBoatPos.y][curBoatPos.x].item = 1;
		break;
		
	case 6:
	case 7:
	case 8:
		curMap[curBoatPos.y][curBoatPos.x].item = 5;
		break;
		
	case 4:
		curMap[curBoatPos.y][curBoatPos.x].item = 3;
		break;
	}
}

function movePirates()
{
	checkPiratesCross();
	
	if (!checkPiratesCannon()) {
		// 从低级到高级移动海盗船
		checkPirates(curBoatPos.x, curBoatPos.y, 6, true, size-1, false);
		checkPirates(curBoatPos.x, curBoatPos.y, 7, true, size-1, false);
		checkPirates(curBoatPos.x, curBoatPos.y, 8, true, size-1, false);
		
		checkPiratesCross();
		
		for (var i = 0; i < piratePos.length; i++) {
			piratePos[i].moved = false;
		}
		
		return true;
	}
	else {
		return false;
	}
}

function checkPiratesCannon()
{
	for (var i = 0; i < piratePos.length; i++) {
		if (piratePos[i].item < 8) {
			continue;
		}
		
		if (piratePos[i].crossPos[0].x >= 0 && piratePos[i].crossPos[0].x == curBoatPos.x && piratePos[i].crossPos[0].y == curBoatPos.y) {
			curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].boom = 16;
			if (piratePos[i].crossPos[1].x >= 0) {
				curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].boom = 16;
			}
			break;
		}
		if (piratePos[i].crossPos[1].x >= 0 && piratePos[i].crossPos[1].x == curBoatPos.x && piratePos[i].crossPos[1].y == curBoatPos.y) {
			curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].boom = 16;
			if (piratePos[i].crossPos[0].x >= 0) {
				curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].boom = 16;
			}
			break;
		}
	}
	
	boomHappens = (i < piratePos.length);
	return boomHappens;
}

// 如果move为false，则只检测海盗船的方向
function checkPirates(myX, myY, type, move, maxOffset, init)
{
	// 由于敌方海盗船的目标都是炮艇，所以应该从本方炮艇开始向外检测海盗船
	var x, y;
	var offset = 1;
	var ret = false;
	for (var offset = 1; offset <= maxOffset; offset++) {
		// 检测上方一行
		y = myY - offset;
		for(x = myX - offset; x < myX + offset; x++) {
			if (y < 0 || y >= size || x < 0 || x >= size) {
				continue;
			}
			if (curMap[y][x].item == type) {
				ret = true;
				movePirate(x, y, type, move, init);
			}
		}
		
		// 检测右方一列
		x = myX + offset;
		for(y = myY - offset; y < myY + offset; y++) {
			if (y < 0 || y >= size || x < 0 || x >= size) {
				continue;
			}
			if (curMap[y][x].item == type) {
				ret = true;
				movePirate(x, y, type, move, init);
			}
		}
		
		// 检测下方一行
		y = myY + offset;
		for(x = myX + offset; x > myX - offset; x--) {
			if (y < 0 || y >= size || x < 0 || x >= size) {
				continue;
			}
			if (curMap[y][x].item == type) {
				ret = true;
				movePirate(x, y, type, move, init);
			}
		}
		
		// 检测右方一列
		x = myX - offset;
		for(y = myY + offset; y > myY - offset; y--) {
			if (y < 0 || y >= size || x < 0 || x >= size) {
				continue;
			}
			if (curMap[y][x].item == type) {
				ret = true;
				movePirate(x, y, type, move, init);
			}
		}
	}
	
	return ret;
}

function waitForPiratesMove()
{
	settlePirates();
	
	// 过关检测
	if (curMap[curBoatPos.y][curBoatPos.x].item != 1) {
		gameOver(true);
		return 0;
	}
	if (!piratePos.length) {
		levelUp();
		return 0;
	}
	
	actionStep.next = waitForPiratesCannon;
	piratesCannon();
	
	return 0;
}

function movePirate(x, y, type, move, init)
{
	if (move) {
		var index = makePiratesMove(x, y, type);
		if (index < 0) {
			return;
		}
		
		curMap[y][x].item = 0;
		
		if (showAnimation) {
			// 在原位置保存旋转方向，正数为顺时针旋转的次数，负数为逆时针旋转的次数
			var dev = ((piratePos[index].dir > curMap[y][x].dir) ? piratePos[index].dir : (piratePos[index].dir + 8)) - curMap[y][x].dir;
			// 转过一个方向需要两次
			if (dev <= 4) {
				curMap[y][x].distX = dev * 2;
			}
			else {
				curMap[y][x].distX = (dev - 8) * 2;
			}
			
			switch(piratePos[index].dir)
			{
			case 1: piratePos[index].distX = 0; piratePos[index].distY = atomHeight; break;
			case 2: piratePos[index].distX = -atomWidth; piratePos[index].distY = atomHeight; break;
			case 3: piratePos[index].distX = -atomWidth; piratePos[index].distY = 0; break;
			case 4: piratePos[index].distX = -atomWidth; piratePos[index].distY = -atomHeight; break;
			case 5: piratePos[index].distX = 0; piratePos[index].distY = -atomHeight; break;
			case 6: piratePos[index].distX = atomWidth; piratePos[index].distY = -atomHeight; break;
			case 7: piratePos[index].distX = atomWidth; piratePos[index].distY = 0; break;
			case 8: piratePos[index].distX = atomWidth; piratePos[index].distY = atomHeight; break;
			}
		}
		else {
			curMap[piratePos[index].y][piratePos[index].x].dir = piratePos[index].dir;
		}
	}
	else if(init) {
		if (!curMap[y][x].dir) {
			// 确定海盗船的方向
			if (x > curBoatPos.x) {
				if (y > curBoatPos.y) {
					curMap[y][x].dir = 8;
				}
				else if (y < curBoatPos.y) {
					curMap[y][x].dir = 6;
				}
				else {
					curMap[y][x].dir = 7;
				}
			}
			if (x < curBoatPos.x) {
				if (y > curBoatPos.y) {
					curMap[y][x].dir = 2;
				}
				else if (y < curBoatPos.y) {
					curMap[y][x].dir = 4;
				}
				else {
					curMap[y][x].dir = 3;
				}
			}
			if (x == curBoatPos.x) {
				if (y > curBoatPos.y) {
					curMap[y][x].dir = 1;
				}
				else {
					curMap[y][x].dir = 5;
				}
			}
		}
		
		// 初始化海盗船信息
		var i = new pirateInfo(x, y, curMap[y][x].item, curMap[y][x].dir);
		piratePos.push(i);
	}
}

function makePiratesMove(x, y, type)
{
	var index = findPirate(x, y, type, true, false);
	if (index < 0) {
		return index;
	}
	
	var ptc = new point(0, 0);
	if (x > curBoatPos.x) {
		ptc.x = -1;
	}
	else if (x < curBoatPos.x) {
		ptc.x = 1;
	}
	
	if (y > curBoatPos.y) {
		ptc.y = -1;
	}
	else if (y < curBoatPos.y) {
		ptc.y = 1;
	}
	
	var x1, y1;
	switch(type)
	{
	case 6:
		// 距离炮艇最近的位置
		x1 = x + ptc.x;
		y1 = y + ptc.y;
		break;
		
	case 7:
		// 距离炮艇且不碰撞的最近的位置
		ptc = moveSPirate(index, ptc);
		x1 = ptc.x;
		y1 = ptc.y;
		break;
		
	case 8:
		// 判断和炮艇的方位
		ptc = moveXPirate(index, ptc);
		x1 = ptc.x;
		y1 = ptc.y;
		break;
	}
	piratePos[index].moved = true;
	
	// 确定海盗船的方向，x、y保存之前位置，x1、y1保存现在位置
	var dir = 0;
	if (x1 > x) {
		if (y1 > y) {
			dir = 4;
		}
		else if (y1 < y) {
			dir = 2;
		}
		else {
			dir = 3;
		}
	}
	if (x1 < x) {
		if (y1 > y) {
			dir = 6;
		}
		else if (y1 < y) {
			dir = 8;
		}
		else {
			dir = 7;
		}
	}
	if (x1 == x) {
		if (y1 > y) {
			dir = 5;
		}
		else {
			dir = 1;
		}
	}
	
	piratePos[index].x = x1;
	piratePos[index].y = y1;
	piratePos[index].dir = dir;
	
	return index;
}

function moveSPirate(index, ptc)
{
	var xmin = -2, ymin = -2, minDis = 999, dis = 0;
	var pt = new point(piratePos[index].x + ptc.x, piratePos[index].y + ptc.y); // 顺时针检测
	
	for (var count = 8; count > 0; count--) {
		if (pt.x >= 0 && pt.y >= 0 && pt.x < size && pt.y < size) {
			for (var i = 0; i < piratePos.length; i++) {
				// 不检测高级别的海盗船
				if (piratePos[i].item > piratePos[index].item || i == index) {
					continue;
				}
				
				if (pt.x == piratePos[i].x && pt.y == piratePos[i].y && piratePos[i].moved) {
					break;
				}
			}
			
			// 未与低级别海盗船发生碰撞，且移动后的位置为空位（可能会移动到漩涡处）
			if (i >= piratePos.length &&
					(curMap[pt.y][pt.x].item <= 2 || curMap[pt.y][pt.x].item >= piratePos[index].item) &&
					!checkPiratesPath(index, pt.x, pt.y)) {
				dis = Math.sqrt((pt.x - curBoatPos.x) * (pt.x - curBoatPos.x) + (pt.y - curBoatPos.y) * (pt.y - curBoatPos.y));
				if (dis < minDis) {
					xmin = pt.x;
					ymin = pt.y;
					minDis = dis;
				}
			}
		}
		
		// 旋转检测
		turn(ptc);
		pt.x = piratePos[index].x + ptc.x;
		pt.y = piratePos[index].y + ptc.y;
	}
	
	// 不碰撞的情况下最近的位置
	if (xmin < -1) {
		// 实在没路去，就撞
		return (new point(piratePos[index].x + ptc.x, piratePos[index].y + ptc.y));
	}
	else {
		return (new point(xmin, ymin));
	}
}

function moveXPirate(index, ptc)
{
	var x = piratePos[index].x, y = piratePos[index].y;
	
	// 如果不位于炮艇周围±2位置，或位于5*5的四个角，则移动目标为炮艇（可以相撞）
	if ((Math.abs(x - curBoatPos.x) != 2 && Math.abs(y - curBoatPos.y) != 2) ||
			(Math.abs(x - curBoatPos.x) == 2 && Math.abs(y - curBoatPos.y) == 2)) {
		return moveSPirate(index, ptc);
	}
	
	// 如果位于炮艇周围±2位置，则移动至可以开炮的位置
	var x1, y1;
	if (x == curBoatPos.x) {
		x1 = x - 1;
		y1 = y + (curBoatPos.y - y) / 2;
		if (x1 >= 0 && y1 >= 0 && x1 <= size - 1 && y1 <= size - 1 &&
				findPirate(x1, y1, 0, false, false) < 0 &&
				!curMap[y1][x1].item &&
				!checkPiratesPath(index, x1, y1)) {
			return (new point(x1, y1));
		}
		x1 = x + 1;
		if (x1 >= 0 && y1 >= 0 && x1 <= size - 1 && y1 <= size - 1 &&
				findPirate(x1, y1, 0, false, false) < 0 &&
				!curMap[y1][x1].item &&
				!checkPiratesPath(index, x1, y1)) {
			return (new point(x1, y1));
		}
	}
	else if (y == curBoatPos.y) {
		x1 = x + (curBoatPos.x - x) / 2;
		y1 = y - 1;
		if (x1 >= 0 && y1 >= 0 && x1 <= size - 1 && y1 <= size - 1 &&
				findPirate(x1, y1, 0, false, false) < 0 &&
				!curMap[y1][x1].item &&
				!checkPiratesPath(index, x1, y1)) {
			return (new point(x1, y1));
		}
		y1 = y + 1;
		if (x1 >= 0 && y1 >= 0 && x1 <= size - 1 && y1 <= size - 1 &&
				findPirate(x1, y1, 0, false, false) < 0 &&
				!curMap[y1][x1].item &&
				!checkPiratesPath(index, x1, y1)) {
			return (new point(x1, y1));
		}
	}
	else {
		if (Math.abs(x - curBoatPos.x) < 2) {
			if (findPirate(curBoatPos.x, y, 0, false, false) < 0 &&
					!curMap[y][curBoatPos.x].item &&
					!checkPiratesPath(index, curBoatPos.x, y)) {
				return (new point(curBoatPos.x, y));
			}
		}
		else if (Math.abs(y - curBoatPos.y) < 2) {
			if (findPirate(x, curBoatPos.y, 0, false, false) < 0 &&
					!curMap[curBoatPos.y][x].item &&
					!checkPiratesPath(index, x, curBoatPos.y)) {
				return (new point(x, curBoatPos.y));
			}
		}
	}
	
	return moveSPirate(index, ptc); 
}

function checkPiratesPath(index, newX, newY)
{
	var pre;
	
	for (var i = 0; i < piratePos.length; i++) {
		if (i == index) {
			continue;
		}
		
		pre = findPrePiratePos(piratePos[i].x, piratePos[i].y, piratePos[i].dir);
		if (piratePos[index].x == pre.x && newX == piratePos[i].x) {
			if ((newY > piratePos[i].y && piratePos[index].y < pre.y) ||
					(newY < piratePos[i].y && piratePos[index].y > pre.y)) {
				return true;
			}
		}
		else if (piratePos[index].y == pre.y && newY == piratePos[i].y) {
			if ((newX > piratePos[i].x && piratePos[index].x < pre.x) ||
					(newX < piratePos[i].x && piratePos[index].x > pre.x)) {
				return true;
			}
		}
		else if (piratePos[index].y == piratePos[i].y && newY == pre.y &&
						piratePos[index].x == piratePos[i].x && newX == pre.x) {
			return true;
		}
	}
	
	return false;
}

function findPrePiratePos(ptx, pty, dir)
{
	var preX, preY;
	switch(dir)
	{
	case 1: preX = ptx; preY = pty + 1; break;
	case 2: preX = ptx - 1; preY = pty + 1; break;
	case 3: preX = ptx - 1; preY = pty; break;
	case 4: preX = ptx - 1; preY = pty - 1; break;
	case 5: preX = ptx; preY = pty - 1; break;
	case 6: preX = ptx + 1; preY = pty - 1; break;
	case 7: preX = ptx + 1; preY = pty; break;
	case 8: preX = ptx + 1; preY = pty + 1; break;
	}
	
	return {x : Math.max(0, preX), y : Math.max(0, preY) };
}

function turn(pt) // 顺时针转动
{
	switch(pt.x + pt.y)
	{
	case -2:
		pt.x++;
		break;
		
	case 2:
		pt.x--;
		break;
		
	case -1:
		if (pt.y > pt.x) { pt.y--; }
		else { pt.x++; }
		break;
		
	case 1:
		if (pt.y > pt.x) { pt.x--; }
		else { pt.y++; }
		break;
		
	case 0:
		if (pt.y > pt.x) { pt.y--; }
		else { pt.y++; }
		break;
	}
}

function checkPiratesCross()
{
	var reach = 2;
	var check = 0;
	var saveX, saveY;
	var item = 0;
	
	for (var j = 0; j < piratePos.length; j++) {
		if (piratePos[j].item < 8) {
			continue;
		}
		
		piratePos[j].crossPos[0].x = -1;
		piratePos[j].crossPos[0].y = -1;
		piratePos[j].crossPos[1].x = -1;
		piratePos[j].crossPos[1].y = -1;
		
		switch(piratePos[j].dir)
		{
		case 1:
		case 5:
			if (piratePos[j].x != 0) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y][piratePos[j].x - i].item;
					if (piratePos[j].x - i <= 0 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y;
						}
						
						if (piratePos[j].x - i <= 0) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[0].x = (saveX >= 0) ? saveX : (piratePos[j].x - i);
				piratePos[j].crossPos[0].y = (saveX >= 0) ? saveY : piratePos[j].y;
			}
			
			if (piratePos[j].x != size - 1) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y][piratePos[j].x + i].item;
					if (piratePos[j].x + i >= size - 1 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y;
						}
						
						if (piratePos[j].x + i >= size - 1) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[1].x = (saveX >= 0) ? saveX : (piratePos[j].x + i);
				piratePos[j].crossPos[1].y = (saveX >= 0) ? saveY : piratePos[j].y;
			}
			break;
			
		case 3:
		case 7:
			if (piratePos[j].y != 0) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y - i][piratePos[j].x].item;
					if (piratePos[j].y - i <= 0 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x;
							saveY = piratePos[j].y - i;
						}
						
						if (piratePos[j].y - i <= 0) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x;
							saveY = piratePos[j].y - i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[0].x = (saveX >= 0) ? saveX : piratePos[j].x;
				piratePos[j].crossPos[0].y = (saveX >= 0) ? saveY : (piratePos[j].y - i);
			}
			
			if (piratePos[j].y != size - 1) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y + i][piratePos[j].x].item;
					if (piratePos[j].y + i >= size - 1 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x;
							saveY = piratePos[j].y + i;
						}
						
						if (piratePos[j].y + i >= size - 1) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x;
							saveY = piratePos[j].y + i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[1].x = (saveX >= 0) ? saveX : piratePos[j].x;
				piratePos[j].crossPos[1].y = (saveX >= 0) ? saveY : (piratePos[j].y + i);
			}
			break;
			
		case 2:
		case 6:
			if (piratePos[j].x != 0 && piratePos[j].y != 0) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y - i][piratePos[j].x - i].item;
					if (piratePos[j].x - i <= 0 || piratePos[j].y - i <= 0 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y - i;
						}
						
						if (piratePos[j].x - i <= 0 || piratePos[j].y - i <= 0) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y - i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[0].x = (saveX >= 0) ? saveX : (piratePos[j].x - i);
				piratePos[j].crossPos[0].y = (saveX >= 0) ? saveY : (piratePos[j].y - i);
			}
			
			if (piratePos[j].x != size - 1 && piratePos[j].y != size - 1) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y + i][piratePos[j].x + i].item;
					if (piratePos[j].x + i >= size - 1 || piratePos[j].y + i >= size - 1 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y + i;
						}
						
						if (piratePos[j].x + i >= size - 1 || piratePos[j].y + i >= size - 1) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y + i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[1].x = (saveX >= 0) ? saveX : (piratePos[j].x + i);
				piratePos[j].crossPos[1].y = (saveX >= 0) ? saveY : (piratePos[j].y + i);
			}
			break;
			
		case 4:
		case 8:
			if (piratePos[j].x != size - 1 && piratePos[j].y != 0) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y - i][piratePos[j].x + i].item;
					if (piratePos[j].x + i >= size - 1 || piratePos[j].y - i <= 0 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y - i;
						}
						
						if (piratePos[j].x + i >= size - 1 || piratePos[j].y - i <= 0) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x + i;
							saveY = piratePos[j].y - i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[0].x = (saveX >= 0) ? saveX : (piratePos[j].x + i);
				piratePos[j].crossPos[0].y = (saveX >= 0) ? saveY : (piratePos[j].y - i);
			}
			
			if (piratePos[j].x != 0 && piratePos[j].y != size - 1) {
				saveX = -1;
				saveY = -1;
				for (var i = 1; i <= reach; i++) {
					item = curMap[piratePos[j].y + i][piratePos[j].x - i].item;
					if (piratePos[j].x - i <= 0 || piratePos[j].y + i >= size - 1 || item) {
						if (saveX < 0) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y + i;
						}
						
						if (piratePos[j].x - i <= 0 || piratePos[j].y + i >= size - 1) {
							break;
						}
						else if (item == 1 || item == 3 || item == 4) {
							saveX = piratePos[j].x - i;
							saveY = piratePos[j].y + i;
							break;
						}
					}
				}
				
				i--;
				piratePos[j].crossPos[1].x = (saveX >= 0) ? saveX : (piratePos[j].x - i);
				piratePos[j].crossPos[1].y = (saveX >= 0) ? saveY : (piratePos[j].y + i);
			}
			break;
		}
	}
}

function waitForPiratesCannon()
{
	checkBoatCross();
	
	// 清理全部爆炸信息
	for (var i = 0; i < piratePos.length; i++) {
		if (piratePos[i].item < 8) {
			continue;
		}
		
		if (piratePos[i].crossPos[0].x >= 0) {
			curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].boom = 0;
		}
		if (piratePos[i].crossPos[1].x >= 0) {
			curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].boom = 0;
		}
	}
	
	if (curMap[curBoatPos.y][curBoatPos.x].item != 1) {
		gameOver(true);
	}
	
	return 0;
}

function piratesCannon()
{
	for (var i = 0; i < piratePos.length; i++) {
		if (piratePos[i].item < 8 || !canPiratesCannon(piratePos[i])) {
			continue;
		}
		
		if (showAnimation) {
			var b = false;
			if (piratePos[i].crossPos[0].x >= 0) {
				curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].boom = 16;
				b = true;
			}
			if (piratePos[i].crossPos[1].x >= 0) {
				curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].boom = 16;
				b = true;
			}
			boomHappens = b;
		}
		else {
			if (piratePos[i].crossPos[0].x >= 0) {
				switch (curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].item)
				{
				case 1:
					curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].boom = 16;
					boomHappens = true;
					break;
					
				case 4:
					curMap[piratePos[i].crossPos[0].y][piratePos[i].crossPos[0].x].item = 3;
					break;
				}
			}
			if (piratePos[i].crossPos[1].x >= 0) {
				switch (curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].item)
				{
				case 1:
					curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].boom = 16;
					boomHappens = true;
					break;
					
				case 4:
					curMap[piratePos[i].crossPos[1].y][piratePos[i].crossPos[1].x].item = 3;
					break;
				}
			}
			
			if (!userDead && !piratePos.length) {
				levelUp();
			}
		}
	}
}

function canPiratesCannon(piratePos)
{
	var b1 = false, b2 = false;
	
	if (piratePos.crossPos[0].x < 0 || (piratePos.crossPos[0].x >= 0 && curMap[piratePos.crossPos[0].y][piratePos.crossPos[0].x].item < 6)) {
		b1 = true;
	}
	
	if (piratePos.crossPos[1].x < 0 || (piratePos.crossPos[1].x >= 0 && curMap[piratePos.crossPos[1].y][piratePos.crossPos[1].x].item < 6)) {
		b2 = true;
	}
	
	return (b1 && b2);
}

function checkKnocked()
{
	var ret = false;
	
	for (var i = 0; i < piratePos.length; i++) {
		// 如果该位置已经是海盗船了，说明移动已经完成，直接跳出
		if (curMap[piratePos[i].y][piratePos[i].x].item >= 6) {
			break;
		}
		// 当撞到漩涡上时，海盗船也爆炸
		else if (curMap[piratePos[i].y][piratePos[i].x].item != 0 && !curMap[piratePos[i].y][piratePos[i].x].boom) {
			// 不论是否开启动画，本方炮艇爆炸均显示
			if (showAnimation || (!showAnimation && curMap[piratePos[i].y][piratePos[i].x].item == 1)) {
				ret = true;
				curMap[piratePos[i].y][piratePos[i].x].boom = 16;
			}
		}
		else {
			for (var j = i + 1; j < piratePos.length; j++) {
				// 发现有相撞
				if (piratePos[i].x == piratePos[j].x && piratePos[i].y == piratePos[j].y) {
					// 每次移动海盗船只设定一次
					if (showAnimation && !curMap[piratePos[i].y][piratePos[i].x].boom) {
						ret = true;
						curMap[piratePos[i].y][piratePos[i].x].boom = 16;
					}
					else {
						break;
					}
				}
			}
		}
	}
	
	return ret;
}

function findPirate(x, y, type, checkMove, remove)
{
	for (var i = 0; i < piratePos.length; i++) {
		if (piratePos[i].x == x && piratePos[i].y == y && (type < 6 || piratePos[i].item == type)) {
			if (!checkMove || (checkMove && !piratePos[i].moved)) {
				break;
			}
		}
	}
	
	if (i == piratePos.length) {
		return -1;
	}
	
	if (remove) {
		switch(piratePos[i].item)
		{
		case 6:
			score.kill++;
			break;
			
		case 7:
			score.kills++;
			break;
			
		case 8:
			score.killx++;
			break;
		}
		piratePos.splice(i, 1);
		
		return -1;
	}
	else {
		return i;
	}
}

function settlePirates()
{
	for (var i = 0; i < piratePos.length; i++) {
		curMap[piratePos[i].y][piratePos[i].x].boom = 0;
		
		switch(curMap[piratePos[i].y][piratePos[i].x].item)
		{
		case 0:
			curMap[piratePos[i].y][piratePos[i].x].item = piratePos[i].item;
			curMap[piratePos[i].y][piratePos[i].x].dir = piratePos[i].dir;
			break;
			
		case 1:
			curMap[piratePos[i].y][piratePos[i].x].item = 5;
			break;
			
		case 4:
			curMap[piratePos[i].y][piratePos[i].x].item = 3;
			break;
			
		case 6:
		case 7:
		case 8:
			curMap[piratePos[i].y][piratePos[i].x].item = 5;
			break;
		}
	}
	
	// 清理被撞毁的海盗船（海盗船到达漩涡后也沉没）
	for (var i = 0; i < piratePos.length; i++) {
		if (curMap[piratePos[i].y][piratePos[i].x].item < 6) {
			findPirate(piratePos[i].x, piratePos[i].y, 0, false, true);
			i--;
		}
	}
}

function settleBoom(x, y)
{
	switch(curMap[y][x].item)
	{
	case 1:
		curMap[y][x].item = 5;
		break;
		
	case 2:
		// 高级海盗船撞到漩涡上时会爆炸
		findPirate(x, y, 0, false, true);
		break;
		
	case 4:
		// 如果利用小岛歼敌或向小岛开炮，则岛上的树木会消失
		curMap[y][x].item = 3;
		break;
		
	case 6:
	case 7:
	case 8:
		curMap[y][x].item = 5;
		findPirate(x, y, 0, false, true);
		break;
	}
}

function resetScore()
{
	score.kill = 0;
	score.kills = 0;
	score.killx = 0;
	score.island = 0;
	score.dead = 0;
	score.boom = 0;
	score.whirl = 0;
	score.step = 0;
	score.scored = false;
}

function countScore(dead)
{
	if (score.scored) {
		return;
	}
	
	for (var j = 0; j < size; j++) {
		for (var i = 0; i < size; i++) {
			if (curMap[j][i].item == 4) {
				score.island++;
			}
			else if (curMap[j][i].item == 5) {
				score.dead++;
			}
		}
	}
	
	if (!dead) {
		score.island *= 100;
		score.dead = Math.max(0, score.kills + score.killx + Math.floor(score.kill / 2) - score.dead) * 100;
		score.boom = Math.max(0, score.kills + score.killx + 3 - score.boom) * 100;
		score.whirl = Math.min(600, score.whirl * 200);
		score.step = Math.max(0, score.kill + score.kills + score.killx + 5 - score.step) * 50;
		
		switch(difficulty)
		{
		case 0:
			score.hard = 0;
			break;
			
		case 1:
			score.hard =  300;
			break;
			
		case 2:
			score.hard =  1000;
			break;
		}
	}
	else {
		score.island = 0;
		score.dead = 0;
		score.boom = 0;
		score.whirl = 0;
		score.step = 0;
		score.hard = 0;
	}
	score.kill *= 200;
	score.kills *= 400;
	score.killx *= 800;
	
	score.allScore += Math.max(0, score.kill + score.kills + score.killx + score.island + score.dead + score.boom + score.step + score.hard - score.whirl);
	score.scored = true;
}

function resetUndoMap()
{
	for (var j = 0; j < size; j++) {
		for (var i = 0; i < size; i++) {
			undoMap[j][i].item = -1;
			undoMap[j][i].dir = 0;
		}
	}
	
	undoScore.kill = 0;
	undoScore.kills = 0;
	undoScore.killx = 0;
	undoScore.island = 0;
	undoScore.dead = 0;
	undoScore.boom = 0;
	undoScore.whirl = 0;
	undoScore.step = 0;
	
	canUndo = true;
}

function saveUndoInfo()
{
	if (!canUndo) {
		return;
	}
	
	for (var j = 0; j < size; j++) {
		for (var i = 0; i < size; i++) {
			undoMap[j][i].item = curMap[j][i].item;
			undoMap[j][i].dir = curMap[j][i].dir;
		}
	}
	
	undoScore.kill = score.kill;
	undoScore.kills = score.kills;
	undoScore.killx = score.killx;
	undoScore.island = score.island;
	undoScore.dead = score.dead;
	undoScore.boom = score.boom;
	undoScore.whirl = score.whirl;
	undoScore.step = score.step;
}

function undo()
{
	if (undoMap[0][0].item < 0 || !canUndo) {
		return;
	}
	
	// 恢复己方船只信息
	for (var j = 0; j < size; j++) {
		for (var i = 0; i < size; i++) {
			curMap[j][i].item = undoMap[j][i].item;
			curMap[j][i].dir = undoMap[j][i].dir;
			if (undoMap[j][i].item == 1) {
				curBoatPos.x = i;
				curBoatPos.y = j;
				curBoatDir = undoMap[j][i].dir;
			}
		}
	}
	
	// 恢复海盗船信息
	piratePos.splice(0, piratePos.length);
	checkPirates(curBoatPos.x, curBoatPos.y, 6, false, size - 1, true);
	checkPirates(curBoatPos.x, curBoatPos.y, 7, false, size - 1, true);
	checkPirates(curBoatPos.x, curBoatPos.y, 8, false, size - 1, true);
	
	checkPiratesCross();
	checkBoatCross();
	
	// 恢复积分信息
	score.kill = undoScore.kill;
	score.kills = undoScore.kills;
	score.killx = undoScore.killx;
	score.island = undoScore.island;
	score.dead = undoScore.dead;
	score.boom = undoScore.boom;
	score.whirl = undoScore.whirl;
	score.step = undoScore.step;
	score.scored = false;
	
	userDead = false;
	showScreen = 2;
	canUndo = false;
}

function inputCode()
{
	if (!xmlMain) {
		return;
	}
	
	var str;
	if (testVar) {
		str = prompt("请输入地图数据：", levelCode);
	}
	else {
		str = prompt("请输入6位关卡口令（字母不区分大小写，取消则清空）：", levelCode);
	}
	
	if (!str || !str.length) {
		levelCode = "";
	}
	else {
		if (testVar) {
			levelCode = str;
		}
		else {
			levelCode = str.slice(0, 6).toUpperCase();
		}
	}
	
	if (!testVar) {
		checkCode();
	}
}

function checkCode()
{
	codeLevel = -1;
	codeHard = -1;
	
	if (levelCode.length) {
		var list;
		var tag = ["easy", "normal", "hard"];
		for (var i = 0; i < 3; i++) {
			list = xmlMain.getElementsByTagName(tag[i])[0].getElementsByTagName("level");
			for (var j = 0; j < list.length; j++) {
				if (list[j].getElementsByTagName("pswd")[0].childNodes[0].nodeValue == levelCode) {
					codeLevel = j;
					codeHard = i;
					difficulty = codeHard;
					break;
				}
			}
			
			if (j < list.length) {
				break;
			}
		}
	}
	
	window.localStorage.removeItem("levelCode");
	window.localStorage.setItem("levelCode", levelCode);
}