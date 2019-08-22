
var showScreen = 0;
var popUp = false;
var globalId = 0;

function rect(r, t, w, h)
{
	this.right = r;
	this.top = t;
	this.width = w;
	this.height = h;
}
var menuRect = new rect(0, 0, 0, 0);

window.requestAnimFrame = (function(){
	return (
	window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	});
})();

var step = 0; // 循环动画帧控制

function movieStep()
{
	this.movie = 0;
	this.step = -1;
	this.next = null;
	
	this.going = function() { return (this.step >= 0); }
	this.end = function() { if (typeof(this.next) == "function") { return this.next(); } };
	this.start = function(newStep) { this.movie = 0; this.step = newStep; };
	this.clear = function() { this.next = null; this.movie = 0; this.step = -1; }
}
var startStep = new movieStep; // 进入游戏和退出游戏动画控制
var actionStep = new movieStep; // 多个过场动画进行区分

// ------------------------------------------------------------------------
// 被其它js引用的函数
function initWelcome()
{
	initBtnPos();
	
	showScreen = 0;
	refreshScreen();
}
// 被其它js引用的函数结束
// ------------------------------------------------------------------------

function refreshScreen()
{
	ctx.clearRect(0, headHeight + 1, gridWidth, gridHeight);
	
	switch(showScreen)
	{
	case 0: // 欢迎界面
		step = (step + 1) % 720;
		
		drawMain(); // 绘制背景
		drawWave(); // 绘制波浪
		drawCode(); // 绘制关卡口令
		
		drawHead(); // 绘制顶端菜单栏
		drawTitle(); // 绘制标题
		break;
		
	case 1: // 游戏前的提示
		step = (step + 1) % 2880;
		
		if (!startStep.going()) {
			drawHead();
		}
		
		refreshMap();
		guideShow();
		
		if (startStep.going()) {
			drawWave();
			drawHead();
		}
		break;
		
	case 2: // 正式游戏
		step = (step + 1) % 192;
		
		drawHead();
		refreshMap();
		break;
		
	case 3: // 过关或通关
	case 4: // 玩家输
		step = (step + 1) % 2880;
		// 通关
		if (curLevel == allLevels - 1 || showScreen == 4) {
			if (!startStep.going()) {
				drawHead();
			}
			
			refreshMap();
			nextShow(showScreen);
			if (startStep.going()) {
				drawWave();
				drawHead();
			}
			break;
		}
		// 过关
		else {
			drawHead();
			refreshMap();
			nextShow(showScreen);
			break;
		}
	}
	
	drawButton(); // 绘制按钮
	drawPopUpMenu(); // 绘制弹出菜单
	
	drawInfo(); // 绘制最下方的信息区
	
	globalId = requestAnimationFrame(refreshScreen);
}

function drawMain()
{
	ctx.save();
	
	// 画背景
	var grd = ctx.createLinearGradient(0, headHeight + 1, 0, headHeight + 1 + gridHeight / 4 * 3);
	grd.addColorStop(0, "DeepSkyBlue");
	grd.addColorStop(1, "white");
	ctx.fillStyle = grd;
	ctx.fillRect(0, headHeight + 1, gridWidth, gridHeight / 4 * 3);
	ctx.restore();
	
	// 画椰子树
	ctx.translate(0, headHeight + 1 + gridHeight / 1.5);
	ctx.rotate((Math.sin(step * Math.PI / 180) * 2 + 3) * Math.PI / 180);
	ctx.drawImage(images.tree, gridWidth * (-0.1), gridHeight * (-0.1) - gridHeight / 1.5, gridWidth / 2, gridHeight / 1.5);
	ctx.setTransform(1,0,0,1,0,0);
	
	// 画太阳
	ctx.translate(gridWidth / 8 * 7, headHeight + 1 + gridHeight / 8);
	ctx.rotate(step * Math.PI / 360);
	ctx.drawImage(images.sun, gridWidth / (-8), gridHeight / (-8), gridWidth / 4, gridHeight / 4);
	ctx.setTransform(1,0,0,1,0,0);
	
	// 画小岛
	ctx.beginPath();
	ctx.fillStyle = "Chocolate";
	ctx.arc(gridWidth * (-0.1), headHeight + 1 + gridHeight * 1.3, gridWidth * 0.8, 0, 2*Math.PI);
	ctx.closePath();
	ctx.fill();
	
	ctx.restore();
}

function drawWave()
{
	// 定义三条不同波浪的颜色
	var lines = ["rgba(255,255,255, 1)", "rgba(0,168,255, 0.2)", "rgba(157,192,249, 0.2)", "rgba(0,222,255, 0.2)"];
	
	ctx.save();
	
	// 画3个不同颜色的波浪
	for(var j = 0; j < lines.length; j++) {
		ctx.fillStyle = lines[j];
		//每个矩形的角度都不同，每个之间相差45度
		var angle = (step-Math.max(j-1, 0)*45)*Math.PI/180;
		var deltaHeight = Math.sin(angle) * gridHeight * 0.07;
		var deltaHeightRight = Math.cos(angle) * gridHeight * 0.07;
		
		ctx.beginPath();
		
		var verticalPos = 0;
		switch(startStep.step)
		{
		case -1:
			var verticalPos = headHeight + 1 + gridHeight / 1.5;
			break;
			
		case 0:
			// 从初始位置上升状态
			verticalPos = headHeight + 1 + gridHeight / 1.5 - startStep.movie;
			if (verticalPos <= headHeight - gridHeight * 0.12) {
				startStep.end();
				if (startStep.going()) {
					startStep.start(1);
				}
			}
			else {
				startStep.movie += gridHeight * 0.005;
			}
			break;
		
		case 1:
			// 从顶端下降
			verticalPos = startStep.movie;
			if (verticalPos >= headHeight + gridHeight * 1.12) {
				startStep.clear();
			}
			else {
				startStep.movie += gridHeight * 0.005;
			}
			break;
			
		case 2:
			// 从底端上升
			verticalPos = headHeight + gridHeight * 1.12 - startStep.movie;
			if (verticalPos <= headHeight - gridHeight * 0.12) {
				startStep.end();
				if (startStep.going()) {
					startStep.start(3);
				}
			}
			else {
				startStep.movie += gridHeight * 0.005;
			}
			break;
			
		case 3:
			// 从顶端恢复
			verticalPos = startStep.movie;
			if (verticalPos >= headHeight + 1 + gridHeight / 1.5) {
				verticalPos = headHeight + 1 + gridHeight / 1.5;
				startStep.clear();
			}
			else {
				startStep.movie += gridHeight * 0.005;
			}
		}
		
		ctx.moveTo(0, verticalPos + deltaHeight);
		ctx.bezierCurveTo(gridWidth / 2, verticalPos + deltaHeight * 0.93, gridWidth / 2, verticalPos + deltaHeightRight * 0.93, gridWidth, verticalPos + deltaHeightRight);
		ctx.lineTo(gridWidth, headHeight + 1 + gridHeight);
		ctx.lineTo(0, headHeight + 1 + gridHeight);
		ctx.lineTo(0, verticalPos + deltaHeight);
		ctx.closePath();
		
		ctx.fill();
	}
	
	ctx.restore();
}

function drawCode()
{
	if (startStep.going()) {
		return;
	}
	
	if (testVar) {
		var str = "开发者版本：";
		
		if (!levelCode.length) {
			str += "无信息";
		}
		else {
			str += "已输入";
		}
	}
	else {
		var str = "关卡口令：";
		
		if (!levelCode.length) {
			str += "未输入";
		}
		else {
			str += levelCode;
			if (codeLevel < 0) {
				str += "，无效关";
			}
			else {
				switch(codeHard)
				{
				case 0:
					str += "，简单第";
					break;
					
				case 1:
					str += "，适中第";
					break;
					
				case 2:
					str += "，困难第";
					break;
				}
				
				str += ((codeLevel + 1) + "关");
			}
		}
	}
		
	ctx.save();
	
	ctx.fillStyle = "#000000";
	ctx.globalAlpha = 1;
	ctx.font = "bold " + gridWidth * 0.04 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "right";
	ctx.textBaseline = "alphabetical";
	ctx.fillText(str, gridWidth * 0.98, headHeight + gridHeight * 0.98);
	
	ctx.restore();
}

function drawTitle()
{
	if (startStep.going()) {
		return;
	}
	
	ctx.save();
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = "blue";
	ctx.font = "bold " + gridWidth * 0.12 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	ctx.shadowColor = "#00FFFF";
	ctx.shadowOffsetX = 5;
	ctx.shadowOffsetY = 5;
	ctx.shadowBlur = 25;
	
	var gameTitle = "海盗船";
	var sep = gridWidth * 0.05;
	var deltaHeight = 0;
	var txtLeft = (gridWidth - ctx.measureText(gameTitle).width - sep * (gameTitle.length - 1)) / 2;
	var i;
	for (i = 0; i < gameTitle.length; i++) {
		deltaHeight = Math.sin((step*2-i*45)*Math.PI/180) * 10;
		ctx.fillText(gameTitle.slice(i, i+1), txtLeft, headHeight + 1 + gridHeight / 3 - gridHeight * 0.05 - deltaHeight);
		
		txtLeft += (ctx.measureText(gameTitle.slice(i, i+1)).width + sep);
	}
	
	ctx.restore();
}

function drawButton()
{
	if (startStep.going()) {
		return;
	}
	
	for (var i = 0; i < ctrlList.length; i++) {
		if (ctrlList[i].screen >= 0 && showScreen == ctrlList[i].screen) {
			drawControl(ctrlList[i]);
		}
	}
}

function guideShow()
{
	ctx.save();
	
	ctx.fillStyle = "#FFFFFF";
	ctx.globalAlpha = 0.6;
	
	ctx.fillRect(0, headHeight + 1, gridWidth, gridHeight);
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = "#000000";
	ctx.font = gridWidth * 0.06 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	
	sep = headHeight + 1 + gridHeight * 0.4;
	ctx.fillText("船长，大批海盗船进犯！", gridWidth / 2, sep);
	
	sep += gridWidth * 0.06 + gridHeight * 0.02
	ctx.fillText("消灭他们，获得胜利！", gridWidth / 2, sep);
	
	sep += gridWidth * 0.06 + gridHeight * 0.02
	ctx.fillText("祝我们好运！", gridWidth / 2, sep);
	
	sep += gridWidth * 0.06 + gridHeight * 0.02
	ctx.font = gridWidth * 0.04 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.fillText("（点击界面任意部位开始）", gridWidth / 2, sep);
	
	ctx.restore();
}

function nextShow(screen)
{
	countScore(screen == 4);
	
	ctx.save();
	
	ctx.fillStyle = "#FFFFFF";
	ctx.globalAlpha = 0.6;
	
	ctx.fillRect(0, headHeight + 1, gridWidth, gridHeight);
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = "#000000";
	ctx.font = gridWidth * 0.06 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	
	if (screen > 3) {
		sep = headHeight + 1 + gridHeight * 0.35;
		ctx.fillText("船长……我们的船沉了……", gridWidth / 2, sep);
	}
	else if (curLevel == allLevels - 1) {
		sep = headHeight + 1 + gridHeight * 0.2;
		ctx.fillText("船长，我们消灭了全部海盗！", gridWidth / 2, sep);
	}
	else {
		if (!((curLevel + 1) % 100) && gameStyle == 1 && difficulty < 2) {
			sep = headHeight + 1 + gridHeight * 0.15;
			ctx.fillText("船长，我们击退了海盗的进攻！", gridWidth / 2, sep);
			
			sep += gridWidth * 0.06 + gridHeight * 0.02;
			ctx.fillText("更多的海盗出现了，准备迎战！", gridWidth / 2, sep);
		}
		else {
			sep = headHeight + 1 + gridHeight * 0.2;
			ctx.fillText("船长，我们击退了海盗的进攻！", gridWidth / 2, sep);
		}
	}
	
	sep += gridWidth * 0.06 + gridHeight * 0.02;
	
	ctx.font = gridWidth * 0.04 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.fillText("歼敌加分：" + (score.kill + score.kills + score.killx), gridWidth / 2, sep);
	if (screen < 4) {
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("保护小岛加分：" + score.island, gridWidth / 2, sep);
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("避免暗礁加分：" + score.dead, gridWidth / 2, sep);
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("开炮次数加分：" + score.boom, gridWidth / 2, sep);
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("回合数加分：" + score.step, gridWidth / 2, sep);
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("难度加分：" + score.hard, gridWidth / 2, sep);
		sep += gridWidth * 0.04 + gridHeight * 0.02;
		ctx.fillText("漩涡减分：" + score.whirl, gridWidth / 2, sep);
	}
	sep += gridWidth * 0.06 + gridHeight * 0.02;
	
	ctx.font = gridWidth * 0.06 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.fillText("本关得分：" + Math.max(0, score.kill + score.kills + score.killx + score.island + score.dead + score.boom + score.step + score.hard - score.whirl), gridWidth / 2, sep);
	
	if (screen == 4 && gameStyle == 0) {
		sep += gridWidth * 0.06 + gridHeight * 0.02;
		ctx.fillText("本关口令：" + levelList[curLevel].getElementsByTagName("pswd")[0].childNodes[0].nodeValue, gridWidth / 2, sep);
	}
	
	sep += gridWidth * 0.06 + gridHeight * 0.02
	ctx.font = gridWidth * 0.04 + "px Microsoft YaHei,SimHei,sans-serif";
	if (curLevel == allLevels - 1 || screen > 3) {
		ctx.fillText("（点击界面任意部位返回）", gridWidth / 2, sep);
	}
	else {
		ctx.fillText("（点击界面任意部位继续）", gridWidth / 2, sep);
	}
	
	ctx.restore();
}

function refreshMap()
{
	drawMap(); // 初始化战场
	drawItems(); // 绘制内容
	if (actionStep.step == 0) {
		drawPirates(); // 绘制全部海盗
		drawBoat(); // 绘制炮艇部分
	}
	else {
		drawBoat();
		drawPirates(); // 绘制全部海盗
	}
	drawPCross(); // 绘制海盗准星
	drawCross(); // 绘制准星
	drawBoom(); // 绘制爆炸
}

function drawMap()
{
	for (var j = 0; j < size; j++) {
		for (var i = 0;i < size; i++) {
			ctx.drawImage(images.sea, atomWidth * i, headHeight + 1 + atomHeight * j, atomWidth, atomHeight);
		}
	}
}

function drawItems()
{
	var pic, left = 0, top = 0, width = 0, height = 0, yPos = 1;
	for (var j = 0; j < curMap.length; j++) {
		for (var i = 0; i < curMap[j].length; i++) {
			var pic;
			switch(curMap[j][i].item)
			{
			case 1: // 绘制炮艇
				curBoatPos.x = i;
				curBoatPos.y = j;
				continue;
				
			case 2: // 绘制漩涡
				pic = images.whirl;
				width = pic.width;
				height = pic.height / 16;
				left = 0;
				top = Math.floor(step / 4) % 16 * height;
				yPos = 2;
				break;
				
			case 3: // 绘制无树小岛
			case 4: // 绘制有树小岛
				pic = images.island;
				width = pic.width / 4;
				height = pic.height / 2;
				left = Math.floor(step / 8) % 4 * width;
				top = (curMap[j][i].item - 3) * height;
				yPos = 1;
				break;
				
			case 5: // 绘制废墟
				pic = images.dead;
				width = pic.width / 12;
				height = pic.height;
				left = Math.floor(step / 8) % 12 * width;
				top = 0;
				yPos = 2;
				break;
				
			default:
				continue;
			}
			
			//每个图片不一样宽 需要在对应地板的中心绘制地图
			ctx.drawImage(pic, left, top, width, height, atomWidth * i - (width * globalScale - atomWidth) / 2, headHeight + 1 + atomHeight * j - (height * globalScale - atomHeight) / yPos, width * globalScale, height * globalScale);
		}
	}
}

function drawBoat()
{
	if (!userDead) {
		ctx.save();
		
		var width = images.boat.width / 16;
		var height = images.boat.height / 8;
		var left = 0, top = Math.floor(step / 8) % 8 * height;
		var moveX = 0, moveY = 0;
		
		// 绘制可能的旋转和移动动画
		var pre;
		var curX, curY, curDir;
		
		// 在漩涡处旋转
		if (whirlPos.x >= 0) {
			curX = whirlPos.x;
			curY = whirlPos.y;
			curDir = curMap[curY][curX].dir;
		}
		else {
			curX = curBoatPos.x;
			curY = curBoatPos.y;
			curDir = curBoatDir;
		}
		
		// 寻找移动前最初的方向
		pre = findPrePiratePos(curX, curY, curDir);
		
		// 平移前的旋转（顺时针）
		if (curMap[pre.y][pre.x].distX > 0) {
			left = ((curMap[pre.y][pre.x].dir - 1) * 2 + Math.floor(actionStep.movie / 2)) % 16 * width;
			if (actionStep.movie && !(actionStep.movie % 2)) {
				curMap[pre.y][pre.x].distX--;
			}
			
			moveX = atomWidth * pre.x -(width * globalScale  - atomWidth) / 2;
			moveY = atomHeight * pre.y - (height * globalScale - atomHeight);
			
			actionStep.movie++;
		}
		// 平移前的旋转（逆时针）
		else if (curMap[pre.y][pre.x].distX < 0) {
			left = ((curMap[pre.y][pre.x].dir - 1) * 2 - Math.floor(actionStep.movie / 2) + 16) % 16 * width;
			if (actionStep.movie && !(actionStep.movie % 2)) {
				curMap[pre.y][pre.x].distX++;
			}
			
			moveX = atomWidth * pre.x -(width * globalScale  - atomWidth) / 2;
			moveY = atomHeight * pre.y - (height * globalScale - atomHeight);
			
			actionStep.movie++;
		}
		// 平移
		else {
			left = (curDir - 1) * 2 * width;
			
			if (curMap[curY][curX].distX || curMap[curY][curX].distY) {
				moveX = atomWidth * curX -(width * globalScale  - atomWidth) / 2 + curMap[curY][curX].distX;
				moveY = atomHeight * curY - (height * globalScale - atomHeight) + curMap[curY][curX].distY;
				
				var moveStep = 3 * globalScale;
				if (curMap[curY][curX].distX > 0) {
					if (curMap[curY][curX].distX < moveStep) {
						curMap[curY][curX].distX = 0;
					}
					else {
						curMap[curY][curX].distX -= moveStep;
					}
				}
				else if (curMap[curY][curX].distX < 0) {
					if (curMap[curY][curX].distX > -moveStep) {
						curMap[curY][curX].distX = 0;
					}
					else {
						curMap[curY][curX].distX += moveStep;
					}
				}
				if (curMap[curY][curX].distY > 0) {
					if (curMap[curY][curX].distY < moveStep) {
						curMap[curY][curX].distY = 0;
					}
					else {
						curMap[curY][curX].distY -= moveStep;
					}
				}
				else if (curMap[curY][curX].distY < 0) {
					if (curMap[curY][curX].distY > -moveStep) {
						curMap[curY][curX].distY = 0;
					}
					else {
						curMap[curY][curX].distY += moveStep;
					}
				}
				
				actionStep.movie++;
			}
			// 平移结束
			else {
				if (whirlStep > 0) {
					moveX = atomWidth * curX -(width * globalScale  - atomWidth) / 2;
					moveY = atomHeight * curY - (height * globalScale - atomHeight);
				}
				else {
					moveX = atomWidth * curBoatPos.x -(width * globalScale  - atomWidth) / 2;
					moveY = atomHeight * curBoatPos.y - (height * globalScale - atomHeight);
					left = (curBoatDir - 1) * 2 * width;
				}
				
				// 如果有漩涡旋转
				if (whirlPos.x >= 0) {
					// 先在漩涡处顺时针旋转
					if (whirlStep > 0) {
						if (whirlStep > 32) {
							whirlStep = 32;
							actionStep.movie = 0;
						}
						
						left = ((curMap[curY][curX].dir - 1) * 2 + Math.floor(actionStep.movie / 2)) % 16 * width;
						if (actionStep.movie && !(actionStep.movie % 2)) {
							whirlStep--;
						}
						
						ctx.globalAlpha = Math.min(1, 1 / 16 * whirlStep);
						actionStep.movie++;
					}
					// 漩涡旋转结束后，在新位置逆时针旋转
					else if (curMap[curBoatPos.y][curBoatPos.x].distX > 0) {
						if (curMap[curBoatPos.y][curBoatPos.x].distX > 32) {
							curMap[curBoatPos.y][curBoatPos.x].distX = 32;
							actionStep.movie = 0;
						}
						
						left = ((curBoatDir - 1) * 2 - Math.floor(actionStep.movie / 2) % 16 + 16) % 16 * width;
						if (actionStep.movie && !(actionStep.movie % 2)) {
							curMap[curBoatPos.y][curBoatPos.x].distX--;
						}
						
						ctx.globalAlpha = 1 - Math.max(0, curMap[curBoatPos.y][curBoatPos.x].distX - 16) / 16;
						actionStep.movie++;
					}
					// 漩涡旋转结束
					else {
						whirlPos.x = -1;
						whirlPos.y = -1;
					}
				}
				// 不论是否开启动画，本方炮艇爆炸均显示
				else if (curMap[curBoatPos.y][curBoatPos.x].item > 1 && !curMap[curBoatPos.y][curBoatPos.x].boom) {
					curMap[curBoatPos.y][curBoatPos.x].boom = 16;
					boomHappens = true;
				}
				
				// 所有的旋转结束后，死亡判定，或移动海盗船
				if (whirlPos.x < 0 && actionStep.step == 0 && !boomHappens) {
					if (actionStep.end()) {
						if (actionStep.going()) {
							actionStep.start(1);
						}
					}
					else {
						actionStep.start(2);
					}
				}
			}
		}
		
		ctx.drawImage(images.boat, left, top, width, height, moveX, headHeight + 1 + moveY, width * globalScale, height * globalScale);
		ctx.restore();
	}
}

function drawCross()
{
	// 玩家死亡，或禁操时，不显示准星
	if (!userDead && !actionStep.going()) {
		var pic = images.cross;
		var width = pic.width * globalScale;
		var height = pic.height * globalScale;
		
		if (crossPos[0].x >= 0) {
			ctx.drawImage(pic, atomWidth * crossPos[0].x - (width - atomWidth) / 2, headHeight + 1 + atomHeight * crossPos[0].y - (height - atomHeight) / 2, width, height);
		}
		
		if (crossPos[1].x >= 0) {
			ctx.drawImage(pic, atomWidth * crossPos[1].x - (width - atomWidth) / 2, headHeight + 1 + atomHeight * crossPos[1].y - (height - atomHeight) / 2, width, height);
		}
	}
}

function drawPirates()
{
	var pic;
	var width, height, left, top;
	var moveX, moveY;
	
	// 依次检测每个海盗船的移动情况
	var pre;
	var count = 0;
	
	// 首先检测旋转情况，保证所有海盗船同时旋转完毕
	for (var i = 0; i < piratePos.length; i++) {
		// 通过当前的方向定位之前的位置
		pre = findPrePiratePos(piratePos[i].x, piratePos[i].y, piratePos[i].dir);
		
		if (pre.x < 0 || pre.x >= size || pre.y < 0 || pre.y >= size) {
			continue;
		}
		if (curMap[pre.y][pre.x].distX) {
			count++;
		}
	}
	
	if (count) {
		for (var i = 0; i < piratePos.length; i++) {
			// 通过当前的方向定位之前的位置
			pre = findPrePiratePos(piratePos[i].x, piratePos[i].y, piratePos[i].dir)
			
			switch(piratePos[i].item)
			{
			case 6:
				pic = images.pirate;
				break;
				
			case 7:
				pic = images.spirate;
				break;
				
			case 8:
				pic = images.xpirate;
				break;
			}
			width = pic.width / 16;
			height = pic.height / 8;
			top = Math.floor(step / 8) % 8 * height;
			moveX = atomWidth * pre.x -(width * globalScale  - atomWidth) / 2;
			moveY = atomHeight * pre.y - (height * globalScale - atomHeight);
			
			// 旋转
			if (curMap[pre.y][pre.x].distX > 0) {
				left = ((curMap[pre.y][pre.x].dir - 1) * 2 + Math.floor(actionStep.movie / 2)) % 16 * width;
				if (actionStep.movie && !(actionStep.movie % 2)) {
					curMap[pre.y][pre.x].distX--;
				}
			}
			else if (curMap[pre.y][pre.x].distX < 0) {
				left = ((curMap[pre.y][pre.x].dir - 1) * 2 - Math.floor(actionStep.movie / 2) + 16) % 16 * width;
				if (actionStep.movie && !(actionStep.movie % 2)) {
					curMap[pre.y][pre.x].distX++;
				}
			}
			else {
				left = (piratePos[i].dir - 1) * 2 * width;
			}
			
			ctx.drawImage(pic, left, top, width, height, moveX, headHeight + 1 + moveY, width * globalScale, height * globalScale);
		}
		
		actionStep.movie++;
	}
	else {
		// 检测平移情况
		count = 0;
		for (var i = 0; i < piratePos.length; i++) {
			if (piratePos[i].distX || piratePos[i].distY) {
				count++;
			}
		}
		
		if (count) {
			for (var i = 0; i < piratePos.length; i++) {
				switch(piratePos[i].item)
				{
				case 6:
					pic = images.pirate;
					break;
					
				case 7:
					pic = images.spirate;
					break;
					
				case 8:
					pic = images.xpirate;
					break;
				}
				width = pic.width / 16;
				height = pic.height / 8;
				top = Math.floor(step / 8) % 8 * height;
				left = (piratePos[i].dir - 1) * 2 * width;
				
				if (piratePos[i].distX || piratePos[i].distY) {
					moveX = atomWidth * piratePos[i].x -(width * globalScale  - atomWidth) / 2 + piratePos[i].distX;
					moveY = atomHeight * piratePos[i].y - (height * globalScale - atomHeight) + piratePos[i].distY;
					
					var moveStep = 3 * globalScale;
					if (piratePos[i].distX > 0) {
						if (piratePos[i].distX < moveStep) {
							piratePos[i].distX = 0;
						}
						else {
							piratePos[i].distX -= moveStep;
						}
					}
					else if (piratePos[i].distX < 0) {
						if (piratePos[i].distX > -moveStep) {
							piratePos[i].distX = 0;
						}
						else {
							piratePos[i].distX += moveStep;
						}
					}
					if (piratePos[i].distY > 0) {
						if (piratePos[i].distY < moveStep) {
							piratePos[i].distY = 0;
						}
						else {
							piratePos[i].distY -= moveStep;
						}
					}
					else if (piratePos[i].distY < 0) {
						if (piratePos[i].distY > -moveStep) {
							piratePos[i].distY = 0;
						}
						else {
							piratePos[i].distY += moveStep;
						}
					}
				}
				else {
					moveX = atomWidth * piratePos[i].x -(width * globalScale  - atomWidth) / 2;
					moveY = atomHeight * piratePos[i].y - (height * globalScale - atomHeight);
				}
				
				ctx.drawImage(pic, left, top, width, height, moveX, headHeight + 1 + moveY, width * globalScale, height * globalScale);
			}
			
			actionStep.movie++;
		}
		// 旋转和平移都结束了
		else {
			for (var i = 0; i < piratePos.length; i++) {
				switch(piratePos[i].item)
				{
				case 6:
					pic = images.pirate;
					break;
					
				case 7:
					pic = images.spirate;
					break;
					
				case 8:
					pic = images.xpirate;
					break;
				}
				width = pic.width / 16;
				height = pic.height / 8;
				top = Math.floor(step / 8) % 8 * height;
				left = (piratePos[i].dir - 1) * 2 * width;
				moveX = atomWidth * piratePos[i].x -(width * globalScale  - atomWidth) / 2;
				moveY = atomHeight * piratePos[i].y - (height * globalScale - atomHeight);
				
				ctx.drawImage(pic, left, top, width, height, moveX, headHeight + 1 + moveY, width * globalScale, height * globalScale);
			}
			
			// 判定是否有相撞（当撞击本方船只时，爆炸动画始终发生）
			if (!boomHappens) {
				// 如果有相撞，则绘制动画
				if (checkKnocked()) {
					boomHappens = true;
				}
			}
			
			if (actionStep.step == 1 && !boomHappens) {
				actionStep.end();
				if (actionStep.going()) {
					actionStep.start(2);
				}
			}
			else if (actionStep.step == 2 && !boomHappens) {
				actionStep.end();
				if (actionStep.going()) {
					actionStep.clear();
				}
			}
		}
	}
}

function drawPCross()
{
	var pic = images.pcross;
	var width = pic.width * globalScale;
	var height = pic.height * globalScale;
	
	for (var j = 0; j < piratePos.length; j++) {
		if (piratePos[j].item < 8) {
			continue;
		}
		
		if (!actionStep.going() || actionStep.step == 2) {
			if (piratePos[j].crossPos[0].x >= 0) {
				ctx.drawImage(pic, atomWidth * piratePos[j].crossPos[0].x - (width - atomWidth) / 2, headHeight + 1 + atomHeight * piratePos[j].crossPos[0].y - (height - atomHeight) / 2, width, height);
			}
			
			if (piratePos[j].crossPos[1].x >= 0) {
				ctx.drawImage(pic, atomWidth * piratePos[j].crossPos[1].x - (width - atomWidth) / 2, headHeight + 1 + atomHeight * piratePos[j].crossPos[1].y - (height - atomHeight) / 2, width, height);
			}
		}
	}
}

function drawBoom()
{
	if (boomHappens) {
		var type, pic, isEnd = false, left = 0, width = 0, x = 0, y = 0;
		
		for (var j = 0; j < size; j++) {
			for (var i = 0; i < size; i++) {
				if (curMap[j][i].boom) {
					// 初始化
					if (curMap[j][i].boom > 15) {
						curMap[j][i].boom = 15;
						actionStep.movie = 0;
					}
					
					switch(curMap[j][i].item)
					{
					case 1:
					case 3:
					case 4:
					case 6:
					case 7:
					case 8:
						type = 15;
						pic = images.boom;
						break;
						
					case 5:
						if (actionStep.step != 1 && (i != curBoatPos.x || j != curBoatPos.y)) {
							type = 24;
							pic = images.splash;
						}
						else {
							type = 15;
							pic = images.boom;
						}
						break;
						
					case 0:
						// 这里需要检测是否有海盗船在这里
						for (var k = 0; k < piratePos.length; k++) {
							if (piratePos[k].x == i && piratePos[k].y == j) {
								type = 15;
								pic = images.boom;
								break;
							}
						}
						if (k >= piratePos.length) {
							type = 24;
							pic = images.splash;
						}
						break;
						
					case 2:
						type = 24;
						pic = images.splash;
						break;
					}
					
					width = pic.width / type;
					left = Math.floor(actionStep.movie / (4 / type * curMap[j][i].boom)) * width;
					x = i * atomWidth + (atomWidth - width * globalScale) / 2;
					y = j * atomHeight + (atomHeight - pic.height * globalScale) / 2;
					ctx.drawImage(pic, left, 0, width, pic.height, x, headHeight + 1 + y, width * globalScale, pic.height * globalScale);
					
					// 判断动画是否完毕
					if (Math.floor(actionStep.movie / 4) > curMap[j][i].boom) {
						isEnd = true;
						settleBoom(i, j);
					}
				}
			}
		}
		
		if (isEnd) {
			boomHappens = false;
		}
		else {
			actionStep.movie++;
		}
	}
}

function drawHead()
{
	ctx.save();
	
	ctx.clearRect(0, 0, gridWidth, headHeight);
	
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2;
	ctx.strokeRect(0, 0, gridWidth, headHeight);
	
	// 写最高分
	ctx.fillStyle = "#000000";
	ctx.font = gridHeight * 0.05 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	ctx.fillText("最高分:" + score.hiScore + "(" + score.hiName + ")", gridWidth * 0.01, headHeight / 2);
	
	ctx.restore();
}

function drawInfo()
{
	var infoHeight = can.height - gridHeight - headHeight;
	
	ctx.save();
	
	ctx.clearRect(0, headHeight + gridHeight, gridWidth, infoHeight);
	
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2;
	ctx.strokeRect(0, headHeight + gridHeight, gridWidth, infoHeight);
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = "#000000";
	ctx.font = gridHeight * 0.05 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textBaseline = "middle";
	
	if (showScreen > 0) {
		ctx.textAlign = "left";
		var str = "当前关卡：" + (curLevel+1) + ((allLevels > 0) ? (" / " + allLevels) : "");
		switch(difficulty)
		{
		case 0:
			str += "(简单)";
			break;
			
		case 1:
			str += "(适中)";
			break;
			
		case 2:
			str += "(困难)";
			break;
		}
		ctx.fillText(str, gridWidth * 0.01, headHeight + gridHeight + infoHeight / 2);
		
		ctx.textAlign = "right";
		ctx.fillText("积分：" + score.allScore, gridWidth * 0.99, headHeight + gridHeight + infoHeight / 2);
	}
	else {
		ctx.textAlign = "center";
		ctx.fillText("作者：南郊居士    2018.07", gridWidth / 2, headHeight + 1 + gridHeight + infoHeight / 2);
	}
	
	ctx.restore();
}

function drawPopUpMenu()
{
	if (!popUp) {
		return;
	}
	
	ctx.save();
	
	ctx.fillStyle = "#87CEFA"; // LightSkyBlue
	ctx.globalAlpha = 0.98;
	
	ctx.fillRect(menuRect.left, menuRect.top, menuRect.width, menuRect.height);
	
	ctx.strokeStyle = "#00BFFF"; // DeepSkyBlue
	ctx.globalAlpha = 1;
	ctx.lineWidth = 5;
	ctx.strokeRect(menuRect.left, menuRect.top, menuRect.width, menuRect.height);
	
	ctx.fillStyle = "blue";
	ctx.font = "bold " + gridWidth * 0.08 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "hanging";
	ctx.fillText("游戏设置", menuRect.left + menuRect.width / 2, menuRect.top + menuRect.height * 0.05);
	
	ctx.restore();
	
	// 绘制各按钮
	for (var i = 0; i < ctrlList.length; i++) {
		if (ctrlList[i].screen < 0) {
			drawControl(ctrlList[i]);
		}
	}
}

function initPopUpMenu()
{
	// 寻找开始
	for (var i = 0; i < ctrlList.length; i++) {
		if (ctrlList[i].screen < 0) {
			break;
		}
	}
	
	var sepX = 0;
	var left, top = menuRect.top + menuRect.height * 0.05 + gridWidth * 0.1;
	
	// 关闭框
	ctrlList[i].width = ctrlList[i].text.width * globalScale;
	ctrlList[i].height = ctrlList[i].text.height * globalScale;
	ctrlList[i].left = menuRect.left + menuRect.width - ctrlList[i].width - gridWidth * 0.02;
	ctrlList[i].top = menuRect.top + gridHeight * 0.02;
	i++;
	
	// 操作模式，任何界面均可执行
	ctrlList[i].width = menuRect.width * 0.4;
	ctrlList[i].height = menuRect.height * 0.13;
	ctrlList[i].left = menuRect.left + (menuRect.width - ctrlList[i].width) / 2;
	ctrlList[i].top = top;
	
	top += ctrlList[i].height;
	i++;
	
	sepX = menuRect.width * 0.2;
	left = menuRect.left + menuRect.width * 0.2;
	for (var count = 2; count > 0; count--, i++) {
		ctrlList[i].width = menuRect.width * 0.2;
		ctrlList[i].height = menuRect.height * 0.13;
		ctrlList[i].left = left;
		ctrlList[i].top = top;
		
		left += ctrlList[i].width + sepX;
	}
	
	top += ctrlList[i - 1].height;
	
	// 观看动画，任何界面均可执行
	ctrlList[i].width = menuRect.width * 0.4;
	ctrlList[i].height = menuRect.height * 0.13;
	ctrlList[i].left = menuRect.left + (menuRect.width - ctrlList[i].width) / 2;
	ctrlList[i].top = top;
	
	top += ctrlList[i].height;
	i++;
	
	sepX = menuRect.width * 0.2;
	left = menuRect.left + menuRect.width * 0.2;
	for (var count = 2; count > 0; count--, i++) {
		ctrlList[i].width = menuRect.width * 0.2;
		ctrlList[i].height = menuRect.height * 0.13;
		ctrlList[i].left = left;
		ctrlList[i].top = top;
		
		left += ctrlList[i].width + sepX;
	}
	
	top += ctrlList[i - 1].height;
	
	// 选择难度，只在游戏开始前可选
	ctrlList[i].width = menuRect.width * 0.4;
	ctrlList[i].height = menuRect.height * 0.13;
	ctrlList[i].left = menuRect.left + (menuRect.width - ctrlList[i].width) / 2;
	ctrlList[i].top = top;
	ctrlList[i].show = (showScreen == 0);
	
	top += ctrlList[i].height;
	i++;

	sepX = menuRect.width * 0.1;
	left = menuRect.left + menuRect.width * 0.1;
		
	for (var count = 3; count > 0; count--, i++) {
		ctrlList[i].width = menuRect.width * 0.2;
		ctrlList[i].height = menuRect.height * 0.13;
		ctrlList[i].left = left;
		ctrlList[i].top = top;
		ctrlList[i].show = (showScreen == 0);
		
		left += ctrlList[i].width + sepX;
	}
}

function drawControl(ctrlObj)
{
	if (ctrlObj.width <= 0) {
		return;
	}
	else {
		switch(typeof(ctrlObj.show))
		{
		case "function":
			if (!ctrlObj.show()) {
				return;
			}
			break;
			
		case "boolean":
			if (!ctrlObj.show) {
				return;
			}
			break;
		}
	}
	
	ctx.save();
	
	ctx.font = gridWidth * 0.05 + "px Microsoft YaHei,SimHei,sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	
	switch(ctrlObj.type)
	{
	case 0: // 静态文本
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillText(ctrlObj.text, ctrlObj.left + ctrlObj.width / 2, ctrlObj.top + ctrlObj.height / 2);
		break;
	
	case 1: // 按钮
		switch(typeof(ctrlObj.text))
		{
		case "string":
			ctx.fillStyle = "rgba(66, 111, 197, 0.5)";
			ctx.fillRect(ctrlObj.left, ctrlObj.top, ctrlObj.width, ctrlObj.height);
			
			ctx.fillStyle = "rgba(255, 255, 255, 1)";
			ctx.fillText(ctrlObj.text, ctrlObj.left + ctrlObj.width / 2, ctrlObj.top + ctrlObj.height / 2);
			break;
			
		case "object":
			ctx.drawImage(ctrlObj.text, ctrlObj.left, ctrlObj.top, ctrlObj.width, ctrlObj.height);
			break;
		}
		break;
		
	case 2: // 选择
		if (ctrlObj.check()) {
			ctx.fillStyle = "rgba(255, 0, 0, 1)";
			ctx.shadowColor = "#FFFF00";
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 10;
		}
		else {
			ctx.fillStyle = "rgba(128, 128, 128, 1)";
			ctx.shadowBlur = 0;
		}
		ctx.fillText(ctrlObj.text, ctrlObj.left + ctrlObj.width / 2, ctrlObj.top + ctrlObj.height / 2);
		break;
	}
	
	ctx.restore();
}

function getHiNameLen(name)
{
	ctx.save();
	
	ctx.font = gridHeight * 0.05 + "px Microsoft YaHei,SimHei,sans-serif";
	
	var len = name.length;
	while(1) {
		if (ctx.measureText(name.slice(0, len)).width < gridWidth * 0.35) {
			score.hiName = name.slice(0, len);
			break;
		}
		len--;
	}
	
	ctx.restore();
	
	return len;
}