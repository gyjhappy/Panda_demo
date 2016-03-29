(function($) {
var supportedCSS,styles=document.getElementsByTagName("head")[0].style,toCheck="transformProperty WebkitTransform OTransform msTransform MozTransform".split(" ");
for (var a=0;a<toCheck.length;a++) if (styles[toCheck[a]] !== undefined) supportedCSS = toCheck[a];
// Bad eval to preven google closure to remove it from code o_O
// After compresion replace it back to var IE = 'v' == '\v'
var IE = eval('"v"=="\v"');

jQuery.fn.extend({
    rotate:function(parameters)
    {
        if (this.length===0||typeof parameters=="undefined") return;
            if (typeof parameters=="number") parameters={angle:parameters};
        var returned=[];
        for (var i=0,i0=this.length;i<i0;i++)
            {
                var element=this.get(i);	
                if (!element.Wilq32 || !element.Wilq32.PhotoEffect) {

                    var paramClone = $.extend(true, {}, parameters); 
                    var newRotObject = new Wilq32.PhotoEffect(element,paramClone)._rootObj;

                    returned.push($(newRotObject));
                }
                else {
                    element.Wilq32.PhotoEffect._handleRotation(parameters);
                }
            }
            return returned;
    },
    getRotateAngle: function(){
        var ret = [];
        for (var i=0,i0=this.length;i<i0;i++)
            {
                var element=this.get(i);	
                if (element.Wilq32 && element.Wilq32.PhotoEffect) {
                    ret[i] = element.Wilq32.PhotoEffect._angle;
                }
            }
            return ret;
    },
    stopRotate: function(){
        for (var i=0,i0=this.length;i<i0;i++)
            {
                var element=this.get(i);	
                if (element.Wilq32 && element.Wilq32.PhotoEffect) {
                    clearTimeout(element.Wilq32.PhotoEffect._timer);
                }
            }
    }
});

// Library agnostic interface

Wilq32=window.Wilq32||{};
Wilq32.PhotoEffect=(function(){

	if (supportedCSS) {
		return function(img,parameters){
			img.Wilq32 = {
				PhotoEffect: this
			};
            
            this._img = this._rootObj = this._eventObj = img;
            this._handleRotation(parameters);
		}
	} else {
		return function(img,parameters) {
			// Make sure that class and id are also copied - just in case you would like to refeer to an newly created object
            this._img = img;

			this._rootObj=document.createElement('span');
			this._rootObj.style.display="inline-block";
			this._rootObj.Wilq32 = 
				{
					PhotoEffect: this
				};
			img.parentNode.insertBefore(this._rootObj,img);
			
			if (img.complete) {
				this._Loader(parameters);
			} else {
				var self=this;
				// TODO: Remove jQuery dependency
				jQuery(this._img).bind("load", function()
				{
					self._Loader(parameters);
				});
			}
		}
	}
})();

Wilq32.PhotoEffect.prototype={
    _setupParameters : function (parameters){
		this._parameters = this._parameters || {};
        if (typeof this._angle !== "number") this._angle = 0 ;
        if (typeof parameters.angle==="number") this._angle = parameters.angle;
        this._parameters.animateTo = (typeof parameters.animateTo==="number") ? (parameters.animateTo) : (this._angle); 

        this._parameters.step = parameters.step || this._parameters.step || null;
		this._parameters.easing = parameters.easing || this._parameters.easing || function (x, t, b, c, d) { return -c * ((t=t/d-1)*t*t*t - 1) + b; }
		this._parameters.duration = parameters.duration || this._parameters.duration || 1000;
        this._parameters.callback = parameters.callback || this._parameters.callback || function(){};
        if (parameters.bind && parameters.bind != this._parameters.bind) this._BindEvents(parameters.bind); 
	},
	_handleRotation : function(parameters){
          this._setupParameters(parameters);
          if (this._angle==this._parameters.animateTo) {
              this._rotate(this._angle);
          }
          else { 
              this._animateStart();          
          }
	},

	_BindEvents:function(events){
		if (events && this._eventObj) 
		{
            // Unbinding previous Events
            if (this._parameters.bind){
                var oldEvents = this._parameters.bind;
                for (var a in oldEvents) if (oldEvents.hasOwnProperty(a)) 
                        // TODO: Remove jQuery dependency
                        jQuery(this._eventObj).unbind(a,oldEvents[a]);
            }

            this._parameters.bind = events;
			for (var a in events) if (events.hasOwnProperty(a)) 
				// TODO: Remove jQuery dependency
					jQuery(this._eventObj).bind(a,events[a]);
		}
	},

	_Loader:(function()
	{
		if (IE)
		return function(parameters)
		{
			var width=this._img.width;
			var height=this._img.height;
			this._img.parentNode.removeChild(this._img);
							
			this._vimage = this.createVMLNode('image');
			this._vimage.src=this._img.src;
			this._vimage.style.height=height+"px";
			this._vimage.style.width=width+"px";
			this._vimage.style.position="absolute"; // FIXES IE PROBLEM - its only rendered if its on absolute position!
			this._vimage.style.top = "0px";
			this._vimage.style.left = "0px";

			/* Group minifying a small 1px precision problem when rotating object */
			this._container =  this.createVMLNode('group');
			this._container.style.width=width;
			this._container.style.height=height;
			this._container.style.position="absolute";
			this._container.setAttribute('coordsize',width-1+','+(height-1)); // This -1, -1 trying to fix ugly problem with small displacement on IE
			this._container.appendChild(this._vimage);
			
			this._rootObj.appendChild(this._container);
			this._rootObj.style.position="relative"; // FIXES IE PROBLEM
			this._rootObj.style.width=width+"px";
			this._rootObj.style.height=height+"px";
			this._rootObj.setAttribute('id',this._img.getAttribute('id'));
			this._rootObj.className=this._img.className;			
		    this._eventObj = this._rootObj;	
		    this._handleRotation(parameters);	
		}
		else
		return function (parameters)
		{
			this._rootObj.setAttribute('id',this._img.getAttribute('id'));
			this._rootObj.className=this._img.className;
			
			this._width=this._img.width;
			this._height=this._img.height;
			this._widthHalf=this._width/2; // used for optimisation
			this._heightHalf=this._height/2;// used for optimisation
			
			var _widthMax=Math.sqrt((this._height)*(this._height) + (this._width) * (this._width));

			this._widthAdd = _widthMax - this._width;
			this._heightAdd = _widthMax - this._height;	// widthMax because maxWidth=maxHeight
			this._widthAddHalf=this._widthAdd/2; // used for optimisation
			this._heightAddHalf=this._heightAdd/2;// used for optimisation
			
			this._img.parentNode.removeChild(this._img);	
			
			this._aspectW = ((parseInt(this._img.style.width,10)) || this._width)/this._img.width;
			this._aspectH = ((parseInt(this._img.style.height,10)) || this._height)/this._img.height;
			
			this._canvas=document.createElement('canvas');
			this._canvas.setAttribute('width',this._width);
			this._canvas.style.position="relative";
			this._canvas.style.left = -this._widthAddHalf + "px";
			this._canvas.style.top = -this._heightAddHalf + "px";
			this._canvas.Wilq32 = this._rootObj.Wilq32;
			
			this._rootObj.appendChild(this._canvas);
			this._rootObj.style.width=this._width+"px";
			this._rootObj.style.height=this._height+"px";
            this._eventObj = this._canvas;
			
			this._cnv=this._canvas.getContext('2d');
            this._handleRotation(parameters);
		}
	})(),

	_animateStart:function()
	{	
		if (this._timer) {
			clearTimeout(this._timer);
		}
		this._animateStartTime = +new Date;
		this._animateStartAngle = this._angle;
		this._animate();
	},
    _animate:function()
    {
         var actualTime = +new Date;
         var checkEnd = actualTime - this._animateStartTime > this._parameters.duration;

         // TODO: Bug for animatedGif for static rotation ? (to test)
         if (checkEnd && !this._parameters.animatedGif) 
         {
             clearTimeout(this._timer);
         }
         else 
         {
             if (this._canvas||this._vimage||this._img) {
                 var angle = this._parameters.easing(0, actualTime - this._animateStartTime, this._animateStartAngle, this._parameters.animateTo - this._animateStartAngle, this._parameters.duration);
                 this._rotate((~~(angle*10))/10);
             }
             if (this._parameters.step) {
                this._parameters.step(this._angle);
             }
             var self = this;
             this._timer = setTimeout(function()
                     {
                     self._animate.call(self);
                     }, 10);
         }

         // To fix Bug that prevents using recursive function in callback I moved this function to back
         if (this._parameters.callback && checkEnd){
             this._angle = this._parameters.animateTo;
             this._rotate(this._angle);
             this._parameters.callback.call(this._rootObj);
         }
     },

	_rotate : (function()
	{
		var rad = Math.PI/180;
		if (IE)
		return function(angle)
		{
            this._angle = angle;
			this._container.style.rotation=(angle%360)+"deg";
		}
		else if (supportedCSS)
		return function(angle){
            this._angle = angle;
			this._img.style[supportedCSS]="rotate("+(angle%360)+"deg)";
		}
		else 
		return function(angle)
		{
            this._angle = angle;
			angle=(angle%360)* rad;
			// clear canvas	
			this._canvas.width = this._width+this._widthAdd;
			this._canvas.height = this._height+this._heightAdd;
						
			// REMEMBER: all drawings are read from backwards.. so first function is translate, then rotate, then translate, translate..
			this._cnv.translate(this._widthAddHalf,this._heightAddHalf);	// at least center image on screen
			this._cnv.translate(this._widthHalf,this._heightHalf);			// we move image back to its orginal 
			this._cnv.rotate(angle);										// rotate image
			this._cnv.translate(-this._widthHalf,-this._heightHalf);		// move image to its center, so we can rotate around its center
			this._cnv.scale(this._aspectW,this._aspectH); // SCALE - if needed ;)
			this._cnv.drawImage(this._img, 0, 0);							// First - we draw image
		}

	})()
}

if (IE)
{
Wilq32.PhotoEffect.prototype.createVMLNode=(function(){
document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
		try {
			!document.namespaces.rvml && document.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
			return function (tagName) {
				return document.createElement('<rvml:' + tagName + ' class="rvml">');
			};
		} catch (e) {
			return function (tagName) {
				return document.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
			};
		}		
})();
}
})(jQuery);

<!--�н���ѭ���б�-->
var doscroll = function(){
	var $parent = $('.js-slide-list');
	var $first = $parent.find('li:first');
	var height = $first.height();
	$first.animate({
		marginTop: -height + 'px'
	}, 500, function() {
		$first.css('marginTop', 0).appendTo($parent);
	});
};
setInterval(function(){doscroll()}, 2000);

/*�齱ת��js*/
var turnplate={
	restaraunts:[],				//��ת�̽�Ʒ����
	colors:[],					//��ת�̽�Ʒ�����Ӧ������ɫ
	outsideRadius:192,			//��ת����Բ�İ뾶
	textRadius:155,				//��ת�̽�Ʒλ�þ���Բ�ĵľ���
	insideRadius:68,			//��ת����Բ�İ뾶
	startAngle:0,				//��ʼ�Ƕ�

	bRotate:false				//false:ֹͣ;ture:��ת
};

$(document).ready(function(){
	//��̬��Ӵ�ת�̵Ľ�Ʒ�뽱Ʒ���򱳾���ɫ
	turnplate.restaraunts = ["лл����", "5����", "20����", "50����", "100����", "10Ԫ����ȯ", "50Ԫ����ȯ ", "100Ԫ����", "лл����", "20Ԫ����"];
	turnplate.colors = ["#FFF4D6", "#FFFFFF", "#FFF4D6", "#FFFFFF","#FFF4D6", "#FFFFFF", "#FFF4D6", "#FFFFFF","#FFF4D6", "#FFFFFF"];


	var rotateTimeOut = function (){
		$('#wheelcanvas').rotate({
			angle:0,
			animateTo:2160,
			duration:8000,
			callback:function (){
				alert('���糬ʱ�����������������ã�');
			}
		});
	};

	//��תת�� item:��Ʒλ��; txt����ʾ��;
	var rotateFn = function (item, txt){
		var angles = item * (360 / turnplate.restaraunts.length) - (360 / (turnplate.restaraunts.length*2));
		if(angles<270){
			angles = 270 - angles;
		}else{
			angles = 360 - angles + 270;
		}
		$('#wheelcanvas').stopRotate();
		$('#wheelcanvas').rotate({
			angle:0,
			animateTo:angles+1800,
			duration:8000,
			callback:function (){
				alert(txt);
				turnplate.bRotate = !turnplate.bRotate;
			}
		});
	};

	$('.pointer').click(function (){
		if(turnplate.bRotate)return;
		turnplate.bRotate = !turnplate.bRotate;
		//��ȡ�����(��Ʒ������Χ��)
		var item = rnd(1,turnplate.restaraunts.length);
		//��Ʒ��������10,ָ�����ڶ�Ӧ��Ʒ��������ĽǶ�[252, 216, 180, 144, 108, 72, 36, 360, 324, 288]
		rotateFn(item, turnplate.restaraunts[item-1]);
		/* switch (item) {
		 case 1:
		 rotateFn(252, turnplate.restaraunts[0]);
		 break;
		 case 2:
		 rotateFn(216, turnplate.restaraunts[1]);
		 break;
		 case 3:
		 rotateFn(180, turnplate.restaraunts[2]);
		 break;
		 case 4:
		 rotateFn(144, turnplate.restaraunts[3]);
		 break;
		 case 5:
		 rotateFn(108, turnplate.restaraunts[4]);
		 break;
		 case 6:
		 rotateFn(72, turnplate.restaraunts[5]);
		 break;
		 case 7:
		 rotateFn(36, turnplate.restaraunts[6]);
		 break;
		 case 8:
		 rotateFn(360, turnplate.restaraunts[7]);
		 break;
		 case 9:
		 rotateFn(324, turnplate.restaraunts[8]);
		 break;
		 case 10:
		 rotateFn(288, turnplate.restaraunts[9]);
		 break;
		 } */
		console.log(item);
	});
});

function rnd(n, m){
	var random = Math.floor(Math.random()*(m-n+1)+n);
	return random;

}


//ҳ������Ԫ�ؼ�����Ϻ�ִ��drawRouletteWheel()������ת�̽�����Ⱦ
window.onload=function(){
	drawRouletteWheel();
};

function drawRouletteWheel() {
	var canvas = document.getElementById("wheelcanvas");
	if (canvas.getContext) {
		//���ݽ�Ʒ��������Բ�ܽǶ�
		var arc = Math.PI / (turnplate.restaraunts.length/2);
		var ctx = canvas.getContext("2d");
		//�ڸ������������һ������
		ctx.clearRect(0,0,422,422);
		//strokeStyle �������û򷵻����ڱʴ�����ɫ�������ģʽ
		ctx.strokeStyle = "#FFBE04";
		//font �������û򷵻ػ������ı����ݵĵ�ǰ��������
		ctx.font = '16px Microsoft YaHei';
		for(var i = 0; i < turnplate.restaraunts.length; i++) {
			var angle = turnplate.startAngle + i * arc;
			ctx.fillStyle = turnplate.colors[i];
			ctx.beginPath();
			//arc(x,y,r,��ʼ��,������,���Ʒ���) ����������/���ߣ����ڴ���Բ�򲿷�Բ��
			ctx.arc(211, 211, turnplate.outsideRadius, angle, angle + arc, false);
			ctx.arc(211, 211, turnplate.insideRadius, angle + arc, angle, true);
			ctx.stroke();
			ctx.fill();
			//������(Ϊ�˱���֮ǰ�Ļ���״̬)
			ctx.save();

			//----���ƽ�Ʒ��ʼ----
			ctx.fillStyle = "#E5302F";
			var text = turnplate.restaraunts[i];
			var line_height = 17;
			//translate��������ӳ�仭���ϵ� (0,0) λ��
			ctx.translate(211 + Math.cos(angle + arc / 2) * turnplate.textRadius, 211 + Math.sin(angle + arc / 2) * turnplate.textRadius);

			//rotate������ת��ǰ�Ļ�ͼ
			ctx.rotate(angle + arc / 2 + Math.PI / 2);

			/** ���������ݽ�Ʒ���͡���Ʒ���Ƴ�����Ⱦ��ͬЧ���������塢��ɫ��ͼƬЧ����(�������ʵ������ı�) **/
			if(text.indexOf("M")>0){//������
				var texts = text.split("M");
				for(var j = 0; j<texts.length; j++){
					ctx.font = j == 0?'bold 20px Microsoft YaHei':'16px Microsoft YaHei';
					if(j == 0){
						ctx.fillText(texts[j]+"M", -ctx.measureText(texts[j]+"M").width / 2, j * line_height);
					}else{
						ctx.fillText(texts[j], -ctx.measureText(texts[j]).width / 2, j * line_height);
					}
				}
			}else if(text.indexOf("M") == -1 && text.length>6){//��Ʒ���Ƴ��ȳ���һ����Χ
				text = text.substring(0,6)+"||"+text.substring(6);
				var texts = text.split("||");
				for(var j = 0; j<texts.length; j++){
					ctx.fillText(texts[j], -ctx.measureText(texts[j]).width / 2, j * line_height);
				}
			}else{
				//�ڻ����ϻ�����ɫ���ı����ı���Ĭ����ɫ�Ǻ�ɫ
				//measureText()�������ذ���һ�����󣬸ö�����������ؼƵ�ָ��������
				ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
			}

			//��Ӷ�Ӧͼ��
			if(text.indexOf("����")>0){
				var img= document.getElementById("shan-img");
				img.onload=function(){
					ctx.drawImage(img,-15,10);
				};
				ctx.drawImage(img,-15,10);
			}else if(text.indexOf("лл����")>=0){
				var img= document.getElementById("sorry-img");
				img.onload=function(){
					ctx.drawImage(img,-15,10);
				};
				ctx.drawImage(img,-15,10);
			}
			//�ѵ�ǰ�������أ�����������һ��save()״̬֮ǰ
			ctx.restore();
			//----���ƽ�Ʒ����----
		}
	}
}

/*
 *����:ͼƬ�ϴ�����Ԥ����� v1.1
 *����:����
 *ʱ��:2013��11��26��
 *����:����JQUERY��չ,ͼƬ�ϴ�Ԥ����� Ŀǰ���������(IE �ȸ� ���) ��֧��safari
 *�����վ:http://keleyi.com/keleyi/phtml/image/16.htm
 *����˵��: Img:ͼƬID;Width:Ԥ�����;Height:Ԥ���߶�;ImgType:֧���ļ�����;Callback:ѡ���ļ���ʾͼƬ��ص�����;
 *ʹ�÷���:
 <div>
 <img id="ImgPr" width="120" height="120" /></div>
 <input type="file" id="up" />
 ����Ҫ����Ԥ����IMG��ǩ�� ��һ��DIV Ȼ����ϴ��ؼ�ID����uploadPreview�¼�
 $("#up").uploadPreview({ Img: "ImgPr", Width: 120, Height: 120, ImgType: ["gif", "jpeg", "jpg", "bmp", "png"], Callback: function () { }});
 */
jQuery.fn.extend({
	uploadPreview: function (opts) {
		var _self = this,
			_this = $(this);
		opts = jQuery.extend({
			Img: "ImgPr",
			Width: 100,
			Height: 100,
			ImgType: ["gif", "jpeg", "jpg", "bmp", "png"],
			Callback: function () {}
		}, opts || {});
		_self.getObjectURL = function (file) {
			var url = null;
			if (window.createObjectURL != undefined) {
				url = window.createObjectURL(file)
			} else if (window.URL != undefined) {
				url = window.URL.createObjectURL(file)
			} else if (window.webkitURL != undefined) {
				url = window.webkitURL.createObjectURL(file)
			}
			return url
		};
		_this.change(function () {
			if (this.value) {
				if (!RegExp("\.(" + opts.ImgType.join("|") + ")$", "i").test(this.value.toLowerCase())) {
					alert("ѡ���ļ�����,ͼƬ���ͱ�����" + opts.ImgType.join("��") + "�е�һ��");
					this.value = "";
					return false
				}
				if ($.support) {
					try {
						$("#" + opts.Img).attr('src', _self.getObjectURL(this.files[0]))
					} catch (e) {
						var src = "";
						var obj = $("#" + opts.Img);
						var div = obj.parent("div")[0];
						_self.select();
						if (top != self) {
							window.parent.document.body.focus()
						} else {
							_self.blur()
						}
						src = document.selection.createRange().text;
						document.selection.empty();
						obj.hide();
						obj.parent("div").css({
							'filter': 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)',
							'width': opts.Width + 'px',
							'height': opts.Height + 'px'
						});
						div.filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src = src
					}
				} else {
					$("#" + opts.Img).attr('src', _self.getObjectURL(this.files[0]))
				}
				opts.Callback()
			}
		})
	}
});

/*
test*/


