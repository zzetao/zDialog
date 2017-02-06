/*!
 * zDialog
 * (c) 2017 zzetao
 * Released under the MIT License.
 */
(function (window, factory) {

  if (typeof module !== 'undefined' && typeof exports === 'object' && define.cmd) {
      module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
      define(function() { return factory(); });
  } else {
      window.zDialog = factory();
  }

})(window, function() {

	/**================= Utils =================**/

 	function addEventListener (el, type, fn) {
 		if (el.attachEvent) {
 			return el.attachEvent('on' + type, fn);
 		} else {
 			return el.addEventListener(type, fn, false);
 		}
 	}
 	function removeEventListener (el, type, fn) {
 		if (el.detachEvent) {
 			return el.detachEvent('on' + type, fn);
 		} else {
 			return el.removeEventListener(type, fn, false);
 		}
 	}

 	/**
 	 * shallow copy
 	 * @param  {Object} source
 	 * @param  {Object} target
 	 * @return {Object}
 	 */
 	function extend (source, target) {
 		for(var i in target) {
 			if (target.hasOwnProperty(i)) {
 				source[i] = target[i];
 			}
 		}

 		return source;
 	}

 	/**
 	 * 判断是否为 Number
 	 * @param  {Number}  n 
 	 * @return {Boolean}
 	 */
	function isNumeric (n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}
 	/**
 	 * 判断是否为 Object
 	 * @param {Object}  obj
 	 * @return {Boolean}
 	 */
 	function isObject (obj) {
 		return obj !== null && typeof obj === "object";
 	}

 	/**
 	 * 判断是否为 Function
 	 * @param  {Function}  obj
 	 * @return {Boolean}
 	 *
 	 * Underscore.js
 	 * 
 	 */
 	function isFunction (obj) {
 		return !!(obj && obj.constructor && obj.call && obj.apply);
 	}

 	function noop () {}





	function _Dialog (options) {

		return this._init(options);
	}

	/**================= Private Method =================**/


	_Dialog.prototype._init = function (options) {

		var defaultOptions = {
			title: '信息',     // {String}    标题
			content: '',			 // {String}    内容
			skin: '',          // {String} 		皮肤 class
			buttons: null,		 // {Array} 		按钮组	
			time: null,        // {Number} 		定时关闭
			maxWidth: null,    // {Number}    设置最大宽度

			ondestroy: noop,   // {Function}	销毁后回调事件
			onshow: noop,      // {Function} 	展示后回调事件
			yes: noop, 				 // {Function} 	确定按钮事件
			no: noop,					 // {Function}	取消按钮事件
			close: noop,       // {Function} 	关闭按钮事件

			showClose: true,   // {Boolean} 	显示关闭按钮
			showMask: true,    // {Boolean} 	显示遮罩层
			maskClose: true,   // {Boolean} 	点击遮罩层关闭
		};

		this.options = extend(defaultOptions, options);
		// console.log('Dialog options: ',this.options);


		this._render();  	// 处理 DOM 并插入到 DOM 文档中
		this._center();  	// 垂直居中
		this._listener(); // 添加监听事件

		var time = this.options.time;
		if (isNumeric(time)) {
			this._timing(time);
		};

		return this;
	}

	_Dialog.prototype._render = function () {
		var options = this.options,
				buttons = "",
				buttonLength = options.buttons && options.buttons.length;

		if (buttonLength > 0) {
			for(var i = 0; i < buttonLength; i++) {
				var btnType;
				if (i === 0) {
					btnType = 'yes';
				} else if (i === 1) {
					btnType = 'no';
				} else {
					btnType = 'btn';
				}
				buttons += '<button class="z-dialog-button z-dialog-button__'+ btnType +'" type="button" dialog="' + btnType + '" index="' + i + '" tabindex="1">' + options.buttons[i] + '</button>';
			}
		}

		var dialogDomHtml = [
			'<div class="z-dialog-header">',
				'<div class="z-dialog-title"><span>' + options.title + '</span></div>',
				options.showClose ? '<button class="z-dialog-close" title="close" type="button" dialog="close" tabindex="1">×</button>' : '',
			'</div>',
			'<div class="z-dialog-body">',
				'<div class="z-dialog-body-content">' + options.content + '</div>',
			'</div>',
			'<div class="z-dialog-footer">',
				'<div class="z-dialog-buttons">',
					buttons,
				'</div>',
			'</div>',
		].join("")

		if (options.showMask) {
			this.maskDOM = document.createElement('div');
			this.maskDOM.className = 'z-dialog-mask';
			document.body.appendChild(this.maskDOM);
		}

		this.dialogDOM = document.createElement('div');
		this.dialogDOM.className = 'z-dialog z-dialog-ant-zoom-up ' + options.skin;
		this.dialogDOM.innerHTML = dialogDomHtml;

		document.body.appendChild(this.dialogDOM);

		options.onshow && options.onshow();
	}

	_Dialog.prototype._timing = function (time) {
		var self = this;
		setTimeout(function() {
			self._destroy();
		}, time || 0);
	}

	_Dialog.prototype._resizeHandler = function () {
		this._center();
	}

	_Dialog.prototype._listener = function (isRemove) {

		var self = this;

		// 点击遮罩层关闭
		if (this.options.maskClose && this.options.showMask) {
			addEventListener(this.maskDOM, 'click', function() {
				self._destroy();
			});
		}

		// 绑定上下文
		this._resizeHandler = this._resizeHandler.bind(this);
		addEventListener(window, 'resize', this._resizeHandler);


		/**
		 * 监听 click 事件到最外层，通过 event.target 来判断当前点击的
		 */
		addEventListener(this.dialogDOM, 'click', function(e) {
			var target = e.target || e.srcElement,
					btnType = target.getAttribute("dialog"),
					btnIndex = target.getAttribute("index");

			// todo: Array indexOf 不支持 IE8，待 polyfill
			if (['yes', 'no', 'btn', 'close'].indexOf(btnType) !== -1) {
				var btnFn = self.options[btnType],
						otherBtnFn = self.options[btnType + btnIndex];

				btnFn && btnFn();
				otherBtnFn && otherBtnFn();
				self._destroy();
			}
		});
	}

	_Dialog.prototype._removeListener = function () {
		removeEventListener(window, 'resize', this._resizeHandler);
	}

	_Dialog.prototype._destroy = function () {
		document.body.removeChild(this.dialogDOM);
		this.maskDOM && document.body.removeChild(this.maskDOM);

		this.dialogDOM = this.maskDOM = null;

		this._removeListener(); // Remove event listener

		this.options.ondestroy && this.options.ondestroy();
	}

	_Dialog.prototype._center = function () {

		// todo: 跟随滚动栏滚动
		var fiexd = true;
		var element = this.dialogDOM,
				maxWidth   = this.options.maxWidth;

		var windowWidth = window.innerWidth || document.documentElement.clientWidth,
				windowHeight = window.innerHeight || document.documentElement.clientHeight,

				elementWidth = element.offsetWidth;


		// 计算宽度
		var defaultMaxWidth = 360;
		if (elementWidth > defaultMaxWidth && !maxWidth) {
			elementWidth = defaultMaxWidth;
			element.style.width = defaultMaxWidth + 'px';
		}

		// todo: ↑↓ 优化

		// option: 最大宽度
		if (maxWidth) {
			elementWidth = maxWidth;
			element.style.width = maxWidth + 'px';
		}

		var elementHeight = element.offsetHeight;

		var documentLeft = fiexd ? 0 : document.body.scrollLeft,
				documentTop = fiexd ? 0 : document.body.scrollTop;

		var left = (windowWidth - elementWidth) / 2 + documentLeft,
				top  = (windowHeight - elementHeight) / 2 + documentTop;

		element.style.left =  parseInt(left) + 'px';
		element.style.top = parseInt(top) + 'px';
	}


	return {

		/**================= Public Method =================**/
		/**
		 * 信息层
		 * @param  {String} content 提示内容 
		 * @param  {Object} options Dialog 配置
		 * @return {Dialog}
		 * 
		 * [Example]:
		 * Dialog.msg('hello world');
		 * Dialog.msg('hello world', { time: 10000 });
		 * Dialog.msg({
		 * 		content: 'hello',
		 * 		time: 2000,
		 * 		skin: 'my-skin'
		 * })
		 */
		msg: function (content, options) {
			var msgDefaultOptions = {
				buttons: null,
				showClose: false,
				showMask: false,
				time: 3000,
				skin: 'z-dialog-msg',
			}

			options = isObject(options) ? extend(msgDefaultOptions, options) : msgDefaultOptions;

			if (typeof content === "string") {
				options['content'] = content;
			}

			return new _Dialog(options);
		},


		/**
		 * 提示层
		 * @param  {String} 	content     提示内容
		 * @param  {Object} 	options     Dialog 配置
		 * @param  {Function} yesCallback 确定回调
		 * @return {Dialog}
		 *
		 * [Example]:
		 * 
		 * Dialog.alert('hello world', { title: 'Tip', skin: 'my-skin' }, yesCallback)
		 * 
		 * Dialog.alert({
		 * 	 title: 'Tip',
		 *   content: 'hello',
		 * }, yesCallback)
		 * 
		 */
		alert: function (content, options, yesCallback) {
			var contentIsObject = isObject(content);

			if (contentIsObject) {
				content['yes'] = options;
				options = content;
			} else {
				options = options || {};
				options['content'] = content;
				options['yes'] = yesCallback;
			}

			options['buttons'] = options['buttons'] || ['确定'];

			return new _Dialog(options);
		},


		/**
		 * 询问层
		 * @param  {String} 	content     询问内容
		 * @param  {Object} 	options     Dialog 配置
		 * @param  {Function} yesCallback 确定回调
		 * @param  {Function} noCallback  取消回调
		 * @return {Dialog}
		 *
		 * [Example]:
		 * 
		 * Dialog.confirm('hello world', { title: 'Tip' }, yesCallback, noCallback)
		 * 
		 * Dialog.confirm({
		 * 	 title: 'Tip',
		 *   content: 'hello',
		 * }, yesCallback, noCallback)
		 * 
		 */
		confirm: function (content, options, yesCallback, noCallback) {
			var contentIsObject = isObject(content);

			if (isObject(content)) {
				content['yes'] = options || content['yes'];
				content['no'] = yesCallback || content['no'];
				options = content;
			} else {
				options = extend(options || {}, {
					content: content,
					yes: yesCallback,
					no: noCallback,
				})
			}

			options['buttons'] = options['buttons'] || ['确定', '取消'];

			return new _Dialog(options);
		}
	};
})