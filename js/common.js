
var can = document.getElementById("canvas");
var ctx = can.getContext("2d");
var headHeight = 0, gridWidth = 0, gridHeight = 0, globalScale = 1;

var gameStyle = 0; // 闯关模式或无尽模式
var canTouch = false;
var moveStyle = 0; // 滑动或点击
var showAnimation = 1;
var difficulty = 1; // 难度，分为3级

function point(x, y)
{
	this.x = x;
	this.y = y;
}
var preClick = new point(0, 0);
var touchDown = false;

var images = {};
var oImgs = {
	"sea" : "images/sea.png",
	"island" : "images/islands.png",
	"boat" : "images/boat.png",
	"pirate" : "images/pirate.png",
	"spirate" : "images/spirate.png",
	"xpirate" : "images/xpirate.png",
	"cross" : "images/crosshair.png",
	"pcross" : "images/pcrosshair.png",
	"dead" : "images/dead.png",
	"tree" : "images/tree.png",
	"sun" : "images/sun.png",
	"whirl" : "images/whirl.png",
	"boom" : "images/boom.png",
	"splash" : "images/splash.png",
	"menu" : "images/menu.png",
	"cancel" : "images/cancel.png",
	"undo" : "images/undo.png",
	"code" : "images/code.png",
}

function scoreManage()
{
	this.hiScore = 10000;	// 最高分
	this.hiName = "无名";	// 高分名称
	this.allScore = 0;		// 总得分
	this.scored = false;	// 已计算过得分
	this.kill = 0;				// 击溃初级海盗加分（每个海盗船200分）
	this.kills = 0;				// 击溃中级海盗加分（每个海盗船400分）
	this.killx = 0;				// 击溃高级海盗加分（每个海盗船800分）
	this.island = 0;			// 保存小岛加分（每保存一个小岛100分）
	this.dead = 0;				// 废墟加分（当废墟数量少于歼敌数的一半时，每少一个加100分）
	this.boom = 0;				// 开炮次数加分（当开炮次数少于3次时，每少一次加100分）
	this.step = 0;				// 回合数（回合数少于歼敌数+5时，每少一回合加50分）
	this.whirl = 0;				// 使用漩涡减分（使用一次漩涡，减200分，最多减600分）
	this.hard = 300;			// 难度加分，适中难度+300分，困难难度+1000分
}
var score = new scoreManage;

// ------------------------------------------------------------------------
// 游戏初始化部分
function imgPreload(srcs, callback)
{
	var count = 0, imgNum = countOf(srcs);

	for(var src in srcs ) {
		images[src] = new Image();
		images[src].onload = function() {
			// 【学习笔记】
			// 当Image对象的src被设置后，图片即被加载，加载是异步的，即在加载的过程中js代码会继续进行
			// 图片加载后，onload会被自动调用，如果先加载图片再设置onload行为，则可能出现图片已加载而onload未被读取的问题，造成不可预知的后果
			// 因此在图片加载时一般采用先设置onload后加载图片的方式
			if (++count >= imgNum)
			{
				callback(images);
			}
		}
		
		images[src].src = srcs[src];
	}
}

imgPreload(oImgs, function(images) {
	// 重置画布大小
	if (window.innerWidth < window.innerHeight) {
		if (can.parentNode.clientWidth * 1.2 < window.innerHeight) {
			can.width = can.parentNode.clientWidth;
			can.height = can.width * 1.2 - 5;
		}
		else {
			can.height = window.innerHeight - 5;
			can.width = can.height / 1.2;
		}
	}
	else {
		can.height = window.innerHeight - 5;
		can.width = can.height / 1.2;
	}
	
	gridWidth = can.width;
	gridHeight = can.width;
	headHeight = gridWidth * 0.1;
	globalScale = gridWidth / (images.sea.width * size);
	
	if (!xmlMain) {
		xmlMain = loadXML("xml/levels.xml");
		if (!xmlMain) {
			alert("读取关卡信息失败!");
		}
	}
	
	// 初始化内容
	moveStyle = parseInt(window.localStorage.getItem("moveStyle"));
	if (moveStyle !== moveStyle) {
		moveStyle = 0;
	}
	
	showAnimation = parseInt(window.localStorage.getItem("showAnimation"));
	if (showAnimation !== showAnimation) {
		showAnimation = 1;
	}
	
	difficulty = parseInt(window.localStorage.getItem("difficulty"));
	if (difficulty !== difficulty) {
		difficulty = 1;
	}
	
	score.hiScore = parseInt(window.localStorage.getItem("hiScore"));
	if (score.hiScore !== score.hiScore) {
		score.hiScore = 10000;
	}
	
	score.hiName = window.localStorage.getItem("hiName");
	if (!score.hiName) {
		score.hiName = "无名";
	}
	
	if (!testVar) {
		levelCode = window.localStorage.getItem("levelCode");
		if (!levelCode) {
			levelCode = "";
		}
		checkCode();
	}
	
	try {
		if("ontouchstart" in window) {
			canTouch = true;
			can.addEventListener('touchmove', handleMouseM, false);
			can.addEventListener('touchstart', handleMouseD, false);
			can.addEventListener('touchend', handleMouseU, false);
		}
		else {
			can.addEventListener('mousedown', handleMouseD, false);
			can.addEventListener('mouseup', handleMouseU, false);
			window.addEventListener('keyup', handleKeyU, false);
		}
	}
	catch(e) {
		can.attachEvent('mousedown', handleMouseD);
		can.attachEvent('mouseup', handleMouseU);
		window.attachEvent('keyup', handleKeyU);
	}
	
	// 这里是真实的入口
	initWelcome();
});
// 游戏初始化部分结束
// ------------------------------------------------------------------------

// ------------------------------------------------------------------------
// 游戏消息机制开始
function getEventPosition(e)
{
	var box = can.getBoundingClientRect();
	
	var x1, y1;
	if (canTouch) {
		if (e.targetTouches.length) {
			x1 = e.targetTouches[0].clientX;
			y1 = e.targetTouches[0].clientY;
		}
		else {
			x1 = e.changedTouches[0].clientX;
			y1 = e.changedTouches[0].clientY;
			// 当最后一个手指离开，则滑动完毕
			touchDown = false;
		}
	}
	else {
		x1 = e.clientX;
		y1 = e.clientY;
	}
	
	return {
		x: (x1 - box.left) * (can.width / box.width),
		y: (y1 - box.top) * (can.height / box.height)
			
		/*
		 * 此处不用下面两行是为了防止使用CSS和JS改变了canvas的高宽之后是表面积拉大而实际
		 * 显示像素不变而造成的坐标获取不准的情况
		x: (x - bbox.left),
		y: (y - bbox.top)
		*/
	};
}

function handleMouseD(e)
{
	if(window.event) {
		//IE中阻止函数器默认动作的方式
		window.event.returnValue = false;
	}
	else {
		//阻止默认浏览器动作(W3C)
		e.preventDefault();
	}
  
	var p = getEventPosition(e);
	if (canTouch) {
		// 只保留第一个按下的手指位置
		if (!touchDown) {
			touchDown = true;
		}
		else {
			return;
		}
	}
	
	preClick.x = p.x;
	preClick.y = p.y;
}

function handleMouseU(e)
{
	if(window.event) {
		//IE中阻止函数器默认动作的方式
		window.event.returnValue = false;
	}
	else {
		//阻止默认浏览器动作(W3C)
		e.preventDefault();
	}
  
	var p = getEventPosition(e);
	if (touchDown) {
		return;
	}
	
	if (p.x >= preClick.x - 1 && p.x <= preClick.x + 1 && p.y >= preClick.y - 1 && p.y <= preClick.y + 1) {
		handleMouseClick(p);
	}
	else {
		handleMouseMove(p);
	}
}

function handleMouseM(e)
{
	// 阻止页面滑动
	e.preventDefault();
}

function handleKeyU(e)
{
	// 动画执行中不可操作
	if (actionStep.going() || startStep.going()) {
		firstKey = -1;
		return;
	}
	
	switch(showScreen)
	{
	case 2:
		switch(e.keyCode)
		{
		case 32: // space
		case 96: // KP_0
		case 101: // KP_5
			checkGameKey(0, 0); break;
		case 97: // KP_1
			checkGameKey(-1, 1); break;
		case 98: // KP_2
			checkGameKey(0, 1); break;
		case 99: // KP_3
			checkGameKey(1, 1); break;
		case 100: // KP_4
			checkGameKey(-1, 0); break;
		case 102: // KP_6
			checkGameKey(1, 0); break;
		case 103: // KP_7
			checkGameKey(-1, -1); break;
		case 104: // KP_8
			checkGameKey(0, -1); break;
		case 105: // KP_9
			checkGameKey(1, -1); break;
			
		default:
			return;
		}
		
		if(window.event) {
			//IE中阻止函数器默认动作的方式
			window.event.returnValue = false;
		}
		else {
			//阻止默认浏览器动作(W3C)
			e.preventDefault();
		}
		break;
		
	case 1:
	case 3:
	case 4:
		checkGameClick(point(0, 0));
		break;
	}
}

function handleMouseClick(p)
{
	// 动画执行中不可操作
	if (actionStep.going() || startStep.going()) {
		return;
	}
	
	if (popUp) {
		if (!isPtInRect(p, menuRect.left, menuRect.top, menuRect.width, menuRect.height)) {
			popUp = false;
			return;
		}
		
		checkBtnClick(p);
		return;
	}
	
	switch(showScreen)
	{
	case 0:
		checkBtnClick(p);
		break;
		
	case 1:
	case 2:
	case 3:
	case 4:
		if (isPtInRect(p, 0, headHeight, gridWidth, gridHeight)) {
			checkGameClick(p);
		}
		else {
			checkBtnClick(p);
		}
		break;
	}
}

function handleMouseMove(p)
{
	// 动画执行中不可操作
	if (actionStep.going() || startStep.going()) {
		return;
	}
	
	switch(showScreen)
	{
	case 2:
		if (moveStyle == 0) {
			checkGameMove(p);
		}
		break;
	}
}

function checkBtnClick(p)
{
	var b = false;
	
	for (var i = 0; i < ctrlList.length; i++) {
		if (popUp) {
			b = (ctrlList[i].screen < 0);
		}
		else {
			b = (ctrlList[i].screen == showScreen);
		}
		
		if (b && ctrlList[i].click && isPtInRect(p, ctrlList[i].left, ctrlList[i].top, ctrlList[i].width, ctrlList[i].height)) {
			switch(typeof(ctrlList[i].show))
			{
			case "function":
				if (ctrlList[i].show()) {
					ctrlList[i].click();
				}
				break;
				
			case "boolean":
				if (ctrlList[i].show) {
					ctrlList[i].click();
				}
			}
		}
	}
}
// 游戏消息机制结束
// ------------------------------------------------------------------------

// ------------------------------------------------------------------------
// 公用函数开始
function isPtInRect(p, l, t, w, h)
{
	return (p.x >= l && p.x <= l + w && p.y >= t && p.y <= t + h);
}

function countOf(obj)
{
	var objType = typeof obj;
	if(objType == "string") {
		return obj.length;
	}
	else if(objType == "object") {
		var objLen = 0;
		for(var i in obj) {
			objLen++;
		}
		return objLen;
	}
	return false;
}
// 公用函数结束
// ------------------------------------------------------------------------
