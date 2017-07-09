var intervals = {};
var bulletIntervals = {};
var target = null;
var wordsSort = {};
var monsterCount = 0;

var i = global_words.length;
var tmpWord;
while (i) {
	i -= 1;
	tmpWord = global_words[i];
    if (!wordsSort[tmpWord[0]]) {
		wordsSort[tmpWord[0]] = [];
	}
	wordsSort[tmpWord[0]].push(tmpWord);
}

// custom exception
function ExceptionFail() {}
function ExceptionSuccess() {}
function ExceptionNoTarget() {}
function ExceptionNotMatch() {}

function getRandInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function monsterDown(word) {
	// return;
	var randomSpeed = getRandInt(400, 4000);
	intervals[word] = setInterval(function(tmpWord) {
		try {
			var tmpObj = $('.monster-col[data-word='+tmpWord+']');
			var top = parseInt(tmpObj.css('top'));
			top += 10;
			tmpObj.css('top', top+'px');
			var gameHeight = parseInt($('.game-top').css('height'));
			var selfHeight = parseInt(tmpObj.css('height'));
			if (top > gameHeight-selfHeight) { // 碰到了底部
				hideMonster(tmpWord);
				if (!tmpObj.hasClass('died')) {
					throw new ExceptionFail(); // 游戏失败
				}
			}
		} catch (e) {
			handleException(e);
		}
	}, randomSpeed, word);
}

function getRandomWord() {
	var existLetters = {};
	$('.monster-living').each(function(index, el) {
		existLetters[$(el).data('word')[0]] = 1;
	});
	while (true) {
		if (Object.keys(wordsSort).length === 0) {
			alert('Perfect! You have beating all words!')
			throw new ExceptionSuccess();
		}
		var isLower = 1; // 控制出现小写字母开头和大写字母开头出现的概率
		if (1 == getRandInt(1, 10)) {
			isLower = 0; // 让大写字母开头出现的概率为1/10
		}
		var letters = [];
		for (index in wordsSort) {
			if (!existLetters[index]) {
				if (isLower && index == index.toLowerCase()) { // 需要小写开头的字母, 并且该index真的是小写字母
					letters.push(index); // 需要的字母
				}
				if (!isLower && index == index.toUpperCase()){
					letters.push(index); // 需要的字母
				}
			}
		}
		if (!letters.length) {
			continue;
		}

		var letter = letters[getRandInt(0, letters.length - 1)]; // 随机首字母
		if (!wordsSort[letter].length) { // 该组的词用完了!
			delete wordsSort[letter];
			continue;
		}
		var index = getRandInt(0, wordsSort[letter].length - 1);
		var res = wordsSort[letter][index];
		wordsSort[letter].splice(index, 1); // 保证单词只出现一次!
		return res;
	}
}

function genMonster(monsterNum) {
	try {
		if (!monsterNum) {
			monsterNum = getRandInt(5,12);
		}
		var monsterWord;
		for (var i = 0; i < monsterNum; i++) {
			monsterWord = getRandomWord();
			monsterObj = $('<div class="col-md-1 col-xs-1 monster-col monster-living" data-word="'+monsterWord+'" data-index="'+monsterCount+'"><span class="monster"></div>');
			for (var j = 0; j < monsterWord.length; j++) {
				monsterObj.find('.monster').append('<font class="monster-letter undone ' + monsterWord[j] + '" id="word-'+monsterWord+'-'+j+'">' + monsterWord[j] + '</font>');
			}
			$('.game-top').append(monsterObj);
			monsterCount += 1;
			monsterDown(monsterWord);
		}
	} catch (e) {
		handleException(e);
	}
}

function hideMonster(word) {
	var tmpObj = $('.monster-living[data-word='+word+']');
	// 加入消失效果
	var magics = ['magic', 'puffOut', 'puffOut', 'vanishOut', 'openDownLeftOut', 'openDownRightOut', 'openUpLeftOut', 'openUpRightOut', 'rotateDown', 'rotateUp', 'rotateLeft', 'rotateRight', 'swashOut', 'foolishOut', 'holeOut', 'tinRightOut', 'tinLeftOut', 'tinUpOut', 'tinDownOut', 'bombRightOut', 'bombLeftOut', 'boingOutDown', 'spaceOutUp', 'spaceOutRight', 'spaceOutDown', 'spaceOutLeft'];
	var magic = magics[getRandInt(0, magics.length - 1)];
	tmpObj.removeClass('monster-living').addClass('magictime ' + magic);
}

function searchTarget(key) {
	if (target) {
		return target;
	}
	var monsters;
	if (!key) { // 按的是功能键之类的非打印字符键
		throw new ExceptionNoTarget();
	}
	monsters = $('.monster-living[data-word^='+key+']'); // 寻找首字母为key的monster
	if (!monsters.length) {
		throw new ExceptionNoTarget();
	}
	target = $(monsters[0]);
	target.css('z-index', 9999);
	var margetLeft = ((target.data('index') % 12) * (100/12)) + '%';
	$('.game-me').animate({'margin-left': margetLeft}, 1500);	
}

function shoot(targetKey) {
	var key = targetKey.text();
	var word = targetKey.closest('.monster-col').data('word');
	var bulletId = 'bullet-' + word + '-' + targetKey.index();
	var targetKeyId = targetKey.attr('id');

	targetKey.removeClass('undone').addClass('done');
	$('.game-top').append('<div class="bullet" data-word="' + word + '" id="' + bulletId + '" data-target-id="' + targetKeyId + '">' + key + '</div>')
	$('#'+bulletId).css($('.game-me').offset());
	var offset = targetKey.offset();
	offset.left -= 79;


	$('#'+bulletId).animate(offset, {
	    duration: 1000,
	    specialEasing: {
	      width: "linear",
	      height: "easeOutBounce"
	    },
	    complete: function() {
      		var obj = $('#' + $(this).data('target-id'));
      		obj.css('color', '#ec3b83').addClass('colored');
      		var tmpTarget = obj.closest('.monster-col');
      		// 所有字母都消灭后, 停止循环器, 并隐藏单词
      		if (!tmpTarget.find('.monster-letter.undone').length && tmpTarget.find('.monster-letter.done').length == tmpTarget.find('.monster-letter.colored').length) {
      			$('.bullet[data-word=' + tmpTarget.data('word') + ']').hide();
      			hideMonster(tmpTarget.data('word'))
      			clearInterval(intervals[word]);
      		}
	    },
	    step: function(now, fx) { // 让子弹临近目标时隐藏
	    	var obj = $('#' + fx.elem.id);
	    	var tmpTarget = $('#' + obj.data('target-id')).closest('.monster-col');
			if (tmpTarget.position().top + 20 >= obj.position().top) {
	    		obj.hide();
			}
		}
	});

	if (!target.find('.monster-letter.undone').length) {
		target.addClass('died');
		target = null
	}
	if (!$('.monster-living').length) {
		throw new ExceptionSuccess();
	}
}

function attackMonster(key) {
	var targetKey;
	if (!target) {
		throw new ExceptionNoTarget();
	}
	targetKey = target.find('.monster-letter.undone:first'); // 按键和选定monster的下一个字母不一样
	if (key != targetKey.text()) {
		throw new ExceptionNotMatch();
	}
	shoot(targetKey);
}

function clearAllInterval() {
	$.each(intervals, function(index, val) {
		 clearInterval(val);
	});
}

function handleException(e) {
	if (e instanceof ExceptionNoTarget) {
		console.log(target)
		// do nothing
	} else if (e instanceof ExceptionNotMatch) {
		console.log(target)
		// do nothing
	} else if (e instanceof ExceptionSuccess) {
		alert('You Win!! Wonderful!!!');
		clearAllInterval();
	} else if (e instanceof ExceptionFail) {
		// alert('You Die!!!');
		clearAllInterval();
	}
}

$(document).ready(function(){
	genMonster();
	intervals['___init___'] = setInterval(function() {
		genMonster(1);
	}, 2000);
	$(document).on('keypress', function(e) {
		try {
			var key = String.fromCharCode(e.which);
			searchTarget(key);
			attackMonster(key);
		} catch (e) {
			handleException(e);
		}
	});
});
