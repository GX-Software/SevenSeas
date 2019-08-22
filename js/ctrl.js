
var ctrlList = [
	{
		text : "开始闯关",
		left : 0, top : 0, width : 0, height : 0,
		screen : 0, show : function() { return (xmlMain ? true : false); },
		check : 0,
		click : function () { gameStyle = 0; startGame(); },
		type : 1,
	},
	{
		text : "无尽模式",
		left : 0, top : 0, width : 0, height : 0,
		screen : 0, show : true,
		check : 0,
		click : function () { gameStyle = 1; startGame(); },
		type : 1,
	},
	{
		text : images.menu,
		left : 0, top : 0, width : 0, height : 0,
		screen : 0, show : true,
		check : 0,
		click : function () { initPopUpMenu(); popUp = true; return false; },
		type : 1,
	},
	{
		text : images.menu,
		left : 0, top : 0, width : 0, height : 0,
		screen : 2, show : true,
		check : 0,
		click : function () { initPopUpMenu(); popUp = true; return false; },
		type : 1,
	},
	{
		text : images.undo,
		left : 0, top : 0, width : 0, height : 0,
		screen : 4, show : function() { return (canUndo && undoMap[0][0].item >= 0); },
		check : 0,
		click : function () { undo(); },
		type : 1,
	},
	{
		text : images.code,
		left : 0, top : 0, width : 0, height : 0,
		screen : 0, show : true,
		check : 0,
		click : inputCode,
		type : 1,
	},
	{
		text : images.undo,
		left : 0, top : 0, width : 0, height : 0,
		screen : 2, show : function() { return (canUndo && undoMap[0][0].item >= 0); },
		check : 0,
		click : function () { undo(); },
		type : 1,
	},
	{
		text : images.cancel,
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : 0,
		click : function () { popUp = false; },
		type : 1,
	},
	{
		text : "移动船只方式",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : 0, click : 0,
		type : 0,
	},
	{
		text : "滑动",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (!moveStyle ? true : false); },
		click : function () { moveStyle = 0; window.localStorage.removeItem("moveStyle"); window.localStorage.setItem("moveStyle", moveStyle); },
		type : 2,
	},
	{
		text : "点击",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (moveStyle ? true : false); },
		click : function () { moveStyle = 1; window.localStorage.removeItem("moveStyle"); window.localStorage.setItem("moveStyle", moveStyle); },
		type : 2,
	},
	{
		text : "观看动画",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : 0, click : 0,
		type : 0,
	},
	{
		text : "观看",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (showAnimation ? true : false); },
		click : function () { showAnimation = 1; window.localStorage.removeItem("showAnimation"); window.localStorage.setItem("showAnimation", showAnimation); },
		type : 2,
	},
	{
		text : "不看",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (!showAnimation ? true : false); },
		click : function () { showAnimation = 0; window.localStorage.removeItem("showAnimation"); window.localStorage.setItem("showAnimation", showAnimation); },
		type : 2,
	},
	{
		text : "游戏难度",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : 0, click : 0,
		type : 0,
	},
	{
		text : "简单",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (difficulty == 0); },
		click : function () { difficulty = 0; window.localStorage.removeItem("difficulty"); window.localStorage.setItem("difficulty", difficulty); },
		type : 2,
	},
	{
		text : "适中",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (difficulty == 1); },
		click : function () { difficulty = 1; window.localStorage.removeItem("difficulty"); window.localStorage.setItem("difficulty", difficulty); },
		type : 2,
	},
	{
		text : "困难",
		left : 0, top : 0, width : 0, height : 0,
		screen : -1, show : true,
		check : function () { return (difficulty == 2); },
		click : function () { difficulty = 2; window.localStorage.removeItem("difficulty"); window.localStorage.setItem("difficulty", difficulty); },
		type : 2,
	},
];

function initBtnPos()
{
	var width = gridWidth * 0.4;
	var left = (gridWidth - width) / 2;
	var height = gridHeight * 0.13;
	var top = headHeight + 1 + gridHeight * 0.48;
	
	// 前两个按钮
	var i = 0;
	for (var count = 2; count > 0; count--, i++) {
		ctrlList[i].left = left;
		ctrlList[i].top = top;
		ctrlList[i].width = width;
		ctrlList[i].height = height;
		
		top += height + gridHeight * 0.07;
	}
	
	// 设置按钮和撤销按钮
	for (var count = 3; count > 0; count--, i++) {
		left = gridWidth * 0.98 - ctrlList[i].text.width * globalScale;
		ctrlList[i].left = left;
		ctrlList[i].top = (headHeight - ctrlList[i].text.height * globalScale) / 2;
		ctrlList[i].width = ctrlList[i].text.width * globalScale;
		ctrlList[i].height = ctrlList[i].text.height * globalScale;
	}
	
	// 撤销按钮和口令按钮
	left -= (ctrlList[i].text.width * globalScale + gridWidth * 0.05);
	for (var count = 2; count > 0; count--, i++) {
		ctrlList[i].left = left;
		ctrlList[i].top = (headHeight - ctrlList[i].text.height * globalScale) / 2;
		ctrlList[i].width = ctrlList[i].text.width * globalScale;
		ctrlList[i].height = ctrlList[i].text.height * globalScale;
	}
	
	// 菜单大小
	menuRect.width = gridWidth * 0.7;
	menuRect.height = gridHeight * 0.7;
	menuRect.left = gridWidth * 0.15;
	menuRect.top = headHeight + gridHeight * 0.15;
}