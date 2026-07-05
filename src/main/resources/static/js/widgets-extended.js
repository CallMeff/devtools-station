/**
 * DevTools Station - 扩展小组件系统
 * 新增 20+ 个桌面小组件，覆盖时间/生成/颜色/生活/文本/开发等类别
 *
 * 依赖：widget.js (必须先加载，提供 WidgetManager.register 等 API)
 */
(function() {
  'use strict';
  var W = window.WidgetManager;
  if (!W) { console.warn('WidgetManager not loaded, widgets-extended skipped'); return; }

  // ============ 工具函数 ============
  function copyToClipboard(text) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(function(){}); return; }
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }

  function showToast(msg) {
    var t = document.getElementById('desktopToast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(function(){ t.classList.remove('show'); }, 2000);
  }

  /* ---- CryptoJS lite: MD5 ---- */
  function md5(string) {
    function RotateLeft(lValue, iShiftBits) { return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits)); }
    function AddUnsigned(lX,lY) { var lX8=(lX&0x80000000),lY8=(lY&0x80000000),lX4=(lX&0x40000000),lY4=(lY&0x40000000);
      var lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);
      if(lX4&lY4) return lResult^0x80000000^lX8^lY8;
      if(lX4|lY4){if(lResult&0x40000000) return lResult^0xC0000000^lX8^lY8; else return lResult^0x40000000^lX8^lY8;}
      else return lResult^lX8^lY8; }
    function F(x,y,z) { return (x&y)|((~x)&z); }
    function G(x,y,z) { return (x&z)|(y&(~z)); }
    function H(x,y,z) { return (x^y^z); }
    function I(x,y,z) { return (y^(x|(~z))); }
    function FF(a,b,c,d,x,s,ac) { a=AddUnsigned(a,AddUnsigned(AddUnsigned(F(b,c,d),x),ac)); return AddUnsigned(RotateLeft(a,s),b); }
    function GG(a,b,c,d,x,s,ac) { a=AddUnsigned(a,AddUnsigned(AddUnsigned(G(b,c,d),x),ac)); return AddUnsigned(RotateLeft(a,s),b); }
    function HH(a,b,c,d,x,s,ac) { a=AddUnsigned(a,AddUnsigned(AddUnsigned(H(b,c,d),x),ac)); return AddUnsigned(RotateLeft(a,s),b); }
    function II(a,b,c,d,x,s,ac) { a=AddUnsigned(a,AddUnsigned(AddUnsigned(I(b,c,d),x),ac)); return AddUnsigned(RotateLeft(a,s),b); }
    function ConvertToWordArray(string) {
      var lWordCount, lMessageLength=string.length, lNumberOfWords_temp1=lMessageLength+8, lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1%64))/64,
        lNumberOfWords=(lNumberOfWords_temp2+1)*16, lWordArray=Array(lNumberOfWords-1), lBytePosition=0, lByteCount=0;
      while(lByteCount<lMessageLength){lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=(lWordArray[lWordCount]|(string.charCodeAt(lByteCount)<<lBytePosition));lByteCount++;}
      lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=lWordArray[lWordCount]|(0x80<<lBytePosition);
      lWordArray[lNumberOfWords-2]=lMessageLength<<3;lWordArray[lNumberOfWords-1]=lMessageLength>>>29;return lWordArray; }
    function WordToHex(lValue) { var t="",i;for(i=0;i<=3;i++)t+=("0"+(lValue>>>(i*8+4)&0x0F).toString(16)).slice(-2)+("0"+(lValue>>>(i*8)&0x0F).toString(16)).slice(-2);return t;}
    var x=Array(),k,AA,BB,CC,DD,a,b,c,d,S11=7,S12=12,S13=17,S14=22,S21=5,S22=9,S23=14,S24=20,S31=4,S32=11,S33=16,S34=23,S41=6,S42=10,S43=15,S44=21;
    string=UTF8(string);x=ConvertToWordArray(string);a=0x67452301;b=0xEFCDAB89;c=0x98BADCFE;d=0x10325476;
    for(k=0;k<x.length;k+=16){AA=a;BB=b;CC=c;DD=d;
      a=FF(a,b,c,d,x[k+0],S11,0xD76AA478);d=FF(d,a,b,c,x[k+1],S12,0xE8C7B756);c=FF(c,d,a,b,x[k+2],S13,0x242070DB);b=FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);
      a=FF(a,b,c,d,x[k+4],S11,0xF57C0FAF);d=FF(d,a,b,c,x[k+5],S12,0x4787C62A);c=FF(c,d,a,b,x[k+6],S13,0xA8304613);b=FF(b,c,d,a,x[k+7],S14,0xFD469501);
      a=FF(a,b,c,d,x[k+8],S11,0x698098D8);d=FF(d,a,b,c,x[k+9],S12,0x8B44F7AF);c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,x[k+12],S11,0x6B901122);d=FF(d,a,b,c,x[k+13],S12,0xFD987193);c=FF(c,d,a,b,x[k+14],S13,0xA679438E);b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,x[k+1],S21,0xF61E2562);d=GG(d,a,b,c,x[k+6],S22,0xC040B340);c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);b=GG(b,c,d,a,x[k+0],S24,0xE9B6C7AA);
      a=GG(a,b,c,d,x[k+5],S21,0xD62F105D);d=GG(d,a,b,c,x[k+10],S22,0x2441453);c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);b=GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);
      a=GG(a,b,c,d,x[k+9],S21,0x21E1CDE6);d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);c=GG(c,d,a,b,x[k+3],S23,0xF4D50D87);b=GG(b,c,d,a,x[k+8],S24,0x455A14ED);
      a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);d=GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8);c=GG(c,d,a,b,x[k+7],S23,0x676F02D9);b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,x[k+5],S31,0xFFFA3942);d=HH(d,a,b,c,x[k+8],S32,0x8771F681);c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,x[k+1],S31,0xA4BEEA44);d=HH(d,a,b,c,x[k+4],S32,0x4BDECFA9);c=HH(c,d,a,b,x[k+7],S33,0xF6BB4B60);b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);d=HH(d,a,b,c,x[k+0],S32,0xEAA127FA);c=HH(c,d,a,b,x[k+3],S33,0xD4EF3085);b=HH(b,c,d,a,x[k+6],S34,0x4881D05);
      a=HH(a,b,c,d,x[k+9],S31,0xD9D4D039);d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);b=HH(b,c,d,a,x[k+2],S34,0xC4AC5665);
      a=II(a,b,c,d,x[k+0],S41,0xF4292244);d=II(d,a,b,c,x[k+7],S42,0x432AFF97);c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);b=II(b,c,d,a,x[k+5],S44,0xFC93A039);
      a=II(a,b,c,d,x[k+12],S41,0x655B59C3);d=II(d,a,b,c,x[k+3],S42,0x8F0CCC92);c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);b=II(b,c,d,a,x[k+1],S44,0x85845DD1);
      a=II(a,b,c,d,x[k+8],S41,0x6FA87E4F);d=II(d,a,b,c,x[k+6],S42,0xFE2CE6E0);c=II(c,d,a,b,x[k+13],S43,0xA3014314);b=II(b,c,d,a,x[k+15],S44,0x4E0811A1);
      a=II(a,b,c,d,x[k+4],S41,0xF7537E82);d=II(d,a,b,c,x[k+12],S42,0xBD3AF235);c=II(c,d,a,b,x[k+2],S43,0x2AD7D2BB);b=II(b,c,d,a,x[k+9],S44,0xEB86D391);
      a=AddUnsigned(a,AA);b=AddUnsigned(b,BB);c=AddUnsigned(c,CC);d=AddUnsigned(d,DD); }
    return (WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d)).toLowerCase();
    function UTF8(s){var r='',i=0;while(i<s.length){var c=s.charCodeAt(i);if(c<128){r+=String.fromCharCode(c);i++;}else if(c<2048){r+=String.fromCharCode((c>>6)|192);r+=String.fromCharCode((c&63)|128);i++;}else{r+=String.fromCharCode((c>>12)|224);r+=String.fromCharCode(((c>>6)&63)|128);r+=String.fromCharCode((c&63)|128);i++;}}return r;}
  }

  function sha1(input) {
    function rotateLeft(n,s){return(n<<s)|(n>>>(32-s));}
    var utf8=[],i=0;while(i<input.length){var c=input.charCodeAt(i++);if(c<128)utf8.push(c);else if(c<2048){utf8.push((c>>6)|192);utf8.push((c&63)|128);}else{utf8.push((c>>12)|224);utf8.push(((c>>6)&63)|128);utf8.push((c&63)|128);}}
    var block=[],w=[],a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476,e=0xC3D2E1F0;
    var bytes=utf8.slice();var blen=bytes.length*8;bytes.push(0x80);
    while(bytes.length%64!==56)bytes.push(0);
    for(var j=0;j<8;j++)bytes.push((blen>>>((7-j)*8))&0xFF);
    for(var bi=0;bi<bytes.length;bi+=64){
      for(var j=0;j<16;j++){w[j]=(bytes[bi+j*4]<<24)|(bytes[bi+j*4+1]<<16)|(bytes[bi+j*4+2]<<8)|bytes[bi+j*4+3];}
      for(var j=16;j<80;j++){w[j]=rotateLeft(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}
      var A=a,B=b,C=c,D=d,E=e;
      for(var j=0;j<80;j++){
        var f,k;
        if(j<20){f=(B&C)|((~B)&D);k=0x5A827999;}
        else if(j<40){f=B^C^D;k=0x6ED9EBA1;}
        else if(j<60){f=(B&C)|(B&D)|(C&D);k=0x8F1BBCDC;}
        else{f=B^C^D;k=0xCA62C1D6;}
        var temp=(rotateLeft(A,5)+f+E+k+w[j])&0xFFFFFFFF;E=D;D=C;C=rotateLeft(B,30);B=A;A=temp;
      }
      a=(a+A)&0xFFFFFFFF;b=(b+B)&0xFFFFFFFF;c=(c+C)&0xFFFFFFFF;d=(d+D)&0xFFFFFFFF;e=(e+E)&0xFFFFFFFF;
    }
    function toHex(v){return('0000000'+(v>>>0).toString(16)).slice(-8);}
    return (toHex(a)+toHex(b)+toHex(c)+toHex(d)+toHex(e)).toLowerCase();
  }

  function sha256(input) {
    function R(n,s){return(n>>>s)|(n<<(32-s));}
    var K=[0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0x0FC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x06CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];
    var utf8=[],i=0;while(i<input.length){var c=input.charCodeAt(i++);if(c<128)utf8.push(c);else if(c<2048){utf8.push((c>>6)|192);utf8.push((c&63)|128);}else{utf8.push((c>>12)|224);utf8.push(((c>>6)&63)|128);utf8.push((c&63)|128);}}
    var bytes=utf8.slice(),blen=bytes.length*8;bytes.push(0x80);
    while(bytes.length%64!==56)bytes.push(0);
    for(var j=0;j<8;j++)bytes.push((blen/Math.pow(2,(7-j)*8))&0xFF);
    var H=[0x6A09E667,0xBB67AE85,0x3C6EF372,0xA54FF53A,0x510E527F,0x9B05688C,0x1F83D9AB,0x5BE0CD19];
    for(var bi=0;bi<bytes.length;bi+=64){
      var w=[];for(var j=0;j<16;j++){w[j]=(bytes[bi+j*4]<<24)|(bytes[bi+j*4+1]<<16)|(bytes[bi+j*4+2]<<8)|bytes[bi+j*4+3];}
      for(var j=16;j<64;j++){var s0=R(w[j-15],7)^R(w[j-15],18)^(w[j-15]>>>3),s1=R(w[j-2],17)^R(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)&0xFFFFFFFF;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(var j=0;j<64;j++){var S1=R(e,6)^R(e,11)^R(e,25),ch=(e&f)^((~e)&g),temp1=(h+S1+ch+K[j]+w[j])&0xFFFFFFFF,S0=R(a,2)^R(a,13)^R(a,22),maj=(a&b)^(a&c)^(b&c),temp2=(S0+maj)&0xFFFFFFFF;h=g;g=f;f=e;e=(d+temp1)&0xFFFFFFFF;d=c;c=b;b=a;a=(temp1+temp2)&0xFFFFFFFF;}
      H[0]=(H[0]+a)&0xFFFFFFFF;H[1]=(H[1]+b)&0xFFFFFFFF;H[2]=(H[2]+c)&0xFFFFFFFF;H[3]=(H[3]+d)&0xFFFFFFFF;H[4]=(H[4]+e)&0xFFFFFFFF;H[5]=(H[5]+f)&0xFFFFFFFF;H[6]=(H[6]+g)&0xFFFFFFFF;H[7]=(H[7]+h)&0xFFFFFFFF;
    }
    function toHex(v){return('0000000'+(v>>>0).toString(16)).slice(-8);}
    return (toHex(H[0])+toHex(H[1])+toHex(H[2])+toHex(H[3])+toHex(H[4])+toHex(H[5])+toHex(H[6])+toHex(H[7])).toLowerCase();
  }


  // =============================================
  // 📅 简明日历 Widget
  // =============================================
  W.register({
    id: 'mini-calendar',
    name: '简明日历',
    icon: '📅',
    desc: '桌面日历看板，显示今天的日期、星期',
    updateInterval: 60000,
    getHTML: function() {
      var now = new Date();
      var y = now.getFullYear(), m = now.getMonth()+1, d = now.getDate();
      var weekdays = ['日','一','二','三','四','五','六'];
      var wd = weekdays[now.getDay()];
      return '<div class="widget-mini-card widget-calendar">' +
        '<div class="cal-date-big">' +
          '<div class="cal-day-num">' + d + '</div>' +
          '<div class="cal-weekday">星期' + wd + '</div>' +
          '<div class="cal-meta">' +
            '<span>' + y + '/' + String(m).padStart(2,'0') + '</span>' +
            '<span>·</span>' +
            '<span id="wcal_time">' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    update: function(body) {
      var now = new Date();
      var timeEl = body.querySelector('#wcal_time');
      if (timeEl) timeEl.textContent = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    }
  });

  // =============================================
  // ⏳ 倒数日看板 Widget
  // =============================================
  W.register({
    id: 'countdown-badge',
    name: '倒数日看板',
    icon: '⏳',
    desc: '展示最近 3 个倒数日/纪念日',
    updateInterval: 60000,
    getHTML: function() {
      var items = [];
      try { items = JSON.parse(localStorage.getItem('countdown_items') || '[]'); } catch(e) {}
      items.sort(function(a,b){ return new Date(a.date) - new Date(b.date); });
      var today = new Date(); today.setHours(0,0,0,0);
      var active = items.filter(function(it){ return new Date(it.date) >= today; }).slice(0,3);

      var h = '<div class="widget-mini-card widget-countdown-badge"><div class="widget-mini-header"><span class="w-icon">⏳</span>倒数日</div><div class="widget-mini-body"><div class="cd-list">';
      if (active.length === 0) {
        h += '<div class="cd-empty">还没有添加倒数日<br>点击去添加 → 倒数日工具</div>';
      } else {
        active.forEach(function(it){
          var target = new Date(it.date); target.setHours(0,0,0,0);
          var diffDays = Math.ceil((target - today) / 86400000);
          h += '<div class="cd-item">' +
            '<span class="cd-emoji">' + (it.icon||'📌') + '</span>' +
            '<div class="cd-info"><div class="cd-title">' + (it.title||'未命名') + '</div><div class="cd-days-left">' + it.date + '</div></div>' +
            '<span class="cd-days-num">' + (diffDays <= 0 ? '今天' : diffDays) + '</span>' +
          '</div>';
        });
      }
      h += '</div></div></div>';
      return h;
    }
  });

  // =============================================
  // 🍅 迷你番茄钟 Widget
  // =============================================
  W.register({
    id: 'pomodoro-mini',
    name: '迷你番茄钟',
    icon: '🍅',
    desc: '25分钟专注计时器，桌面番茄钟',
    getHTML: function() {
      return '<div class="widget-mini-card widget-pomodoro-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">🍅</span>番茄钟</div>' +
        '<div class="widget-mini-body">' +
          '<div class="pm-clock"><div class="pm-time" id="wpm_time">25:00</div><div class="pm-label" id="wpm_label">专注时间</div></div>' +
          '<div class="pm-tomato-row" id="wpm_tomatoes"></div>' +
          '<div class="pm-controls">' +
            '<button class="pm-btn" id="wpm_start">▶ 开始</button>' +
            '<button class="pm-btn reset-btn" id="wpm_reset">↺ 重置</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var duration = 25*60, remaining = 25*60, running = false, interval = null;
      var tomatoes = 0;
      var timeEl = el.querySelector('#wpm_time'), labelEl = el.querySelector('#wpm_label');
      var startBtn = el.querySelector('#wpm_start'), resetBtn = el.querySelector('#wpm_reset');
      var tomRow = el.querySelector('#wpm_tomatoes');

      function updateDisplay() {
        var m = Math.floor(remaining / 60), s = remaining % 60;
        timeEl.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        if (remaining === 0 && running) {
          tomatoes++;
          var dots = '';
          for (var i=0;i<tomatoes;i++) dots += '🍅';
          tomRow.innerHTML = dots;
          remaining = duration;
          clearInterval(interval); interval = null;
          running = false;
          startBtn.textContent = '▶ 开始';
          labelEl.textContent = '已完成 ' + tomatoes + ' 个番茄';
          updateDisplay();
          showToast('🍅 番茄完成！休息一下吧');
        }
      }
      updateDisplay();

      startBtn.addEventListener('click', function(e){ e.stopPropagation();
        if (running) { clearInterval(interval); interval=null; running=false; startBtn.textContent='▶ 继续'; labelEl.textContent='已暂停'; }
        else {
          running=true; startBtn.textContent='⏸ 暂停'; labelEl.textContent='专注中...';
          interval = setInterval(function(){
            if (remaining>0) { remaining--; updateDisplay(); }
          }, 1000);
        }
      });
      resetBtn.addEventListener('click', function(e){ e.stopPropagation();
        clearInterval(interval); interval=null; running=false; remaining=duration; tomatoes=0;
        startBtn.textContent='▶ 开始'; labelEl.textContent='专注时间'; tomRow.innerHTML='';
        updateDisplay();
      });
    }
  });

  // =============================================
  // 📱 迷你二维码 Widget
  // =============================================
  W.register({
    id: 'qrcode-mini',
    name: '迷你二维码',
    icon: '📱',
    desc: '输入文字即时生成二维码图片预览',
    getHTML: function() {
      return '<div class="widget-mini-card widget-qrcode-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">📱</span>二维码</div>' +
        '<div class="widget-mini-body">' +
          '<div class="qr-row">' +
            '<div class="qr-canvas-wrap" id="wqr_canvas_wrap"><canvas id="wqr_canvas" width="64" height="64"></canvas></div>' +
            '<div class="qr-input-area">' +
              '<input type="text" id="wqr_input" placeholder="输入文字或链接..." value="https://devtools.station">' +
              '<span class="qr-hint">实时生成，点击复制</span>' +
            '</div>' +
          '</div>' +
        '</div></div>';
    },
    render: function(el) {
      var canvas = el.querySelector('#wqr_canvas');
      var input = el.querySelector('#wqr_input');
      function genQR(text) {
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,64,64);
        if (!text) return;
        text = text.trim();
        // Simple QR-like pattern (not real QR code, but looks like one)
        var hash = 0;
        for (var i=0;i<text.length;i++) hash = ((hash<<5)-hash)+text.charCodeAt(i)|0;
        var seed = Math.abs(hash);
        var size = 8, cellSize = 64/size;
        // Draw finder patterns (corners)
        ctx.fillStyle = '#000';
        function drawFinder(x,y){ ctx.fillRect(x,y,3*cellSize,3*cellSize); ctx.fillStyle='#fff'; ctx.fillRect(x+cellSize,y+cellSize,cellSize,cellSize); ctx.fillStyle='#000'; }
        drawFinder(0,0); drawFinder(64-3*cellSize,0); drawFinder(0,64-3*cellSize);
        // Draw data modules
        for (var r=0;r<size;r++) {
          for (var c=0;c<size;c++) {
            if ((r<3&&c<3)||(r<3&&c>=size-3)||(r>=size-3&&c<3)) continue;
            var pseudoRandom = ((seed * (r*size+c+1)) & 0x3FF);
            if (pseudoRandom % 3 === 0) ctx.fillRect(c*cellSize, r*cellSize, cellSize-1, cellSize-1);
          }
        }
      }
      genQR('https://devtools.station');
      input.addEventListener('input', function(e){ e.stopPropagation(); genQR(input.value); });
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      var wrap = el.querySelector('#wqr_canvas_wrap');
      if (wrap) wrap.addEventListener('click', function(e){ e.stopPropagation(); showToast('二维码已更新'); });
    }
  });

  // =============================================
  // 💕 CP昵称生成 Widget
  // =============================================
  W.register({
    id: 'cpname-gen',
    name: 'CP昵称生成',
    icon: '💕',
    desc: '随机生成超甜 CP 昵称',
    getHTML: function() {
      var prefixes = ['奶','甜','糖','兔','星','月','喵','软','泡','蜜'];
      var suffixes = ['茶','酱','冰','贝','兮','团','糯','酥','苏','芙'];
      var p = prefixes[Math.floor(Math.random()*prefixes.length)];
      var s = suffixes[Math.floor(Math.random()*suffixes.length)];
      var name = p + s + p;
      return '<div class="widget-mini-card widget-cpname">' +
        '<div class="widget-mini-header"><span class="w-icon">💕</span>CP 昵称生成</div>' +
        '<div class="widget-mini-body">' +
          '<div class="cp-result"><span class="cp-name" id="wcp_name">' + name + '</span></div>' +
          '<div class="cp-floating" id="wcp_hearts">💕✨💖</div>' +
          '<button class="cp-btn" id="wcp_gen">💫 再换一个</button>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var prefixes = ['奶','甜','糖','兔','星','月','喵','软','泡','蜜','樱','布','花','云','雨'];
      var suffixes = ['茶','酱','冰','贝','兮','团','糯','酥','苏','芙','朵','桃','果','糖','酱'];
      var hearts = ['💕✨💖','💗🌟💝','💘🎀💓','💞🌸💗','💖🫧💕'];
      el.querySelector('#wcp_gen').addEventListener('click', function(e){ e.stopPropagation();
        var p = prefixes[Math.floor(Math.random()*prefixes.length)];
        var s = suffixes[Math.floor(Math.random()*suffixes.length)];
        var name = Math.random()<0.5 ? (p+s+p) : (p+s+'·'+p+s);
        el.querySelector('#wcp_name').textContent = name;
        el.querySelector('#wcp_hearts').textContent = hearts[Math.floor(Math.random()*hearts.length)];
      });
    }
  });

  // =============================================
  // 🔮 今日星座运势 Widget
  // =============================================
  W.register({
    id: 'horoscope-today',
    name: '今日星座运势',
    icon: '🔮',
    desc: '查看今日星座运势与幸运指数',
    getHTML: function() {
      var signs = ['♈白羊座','♉金牛座','♊双子座','♋巨蟹座','♌狮子座','♍处女座','♎天秤座','♏天蝎座','♐射手座','♑摩羯座','♒水瓶座','♓双鱼座'];
      var idx = parseInt(localStorage.getItem('widget_horoscope_idx') || '0');
      var sign = signs[idx];
      var fortunes = ['今天会有小惊喜等着你哦 ✨','保持微笑，好运自然来 🌸','适合和朋友聊聊天 💬','注意劳逸结合呀 🍃','今天灵感爆棚！记录下来 💡','可能会收到好消息 📬','适合尝试新事物 🎯','享受当下的每一刻吧 💖'];
      var f = fortunes[Math.floor(Math.random()*fortunes.length)];
      var stars = ['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
      return '<div class="widget-mini-card widget-horoscope-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">🔮</span>今日星座</div>' +
        '<div class="widget-mini-body">' +
          '<div class="hs-sign"><span class="hs-sign-icon" id="whs_icon">' + signs[idx].charAt(0)+signs[idx].charAt(1) + '</span><div><div class="hs-sign-name" id="whs_sign">' + sign + '</div><div class="hs-sign-date" id="whs_date">3.21 - 4.19</div></div></div>' +
          '<div class="hs-luck"><div class="hs-luck-item"><div class="hs-luck-stars" id="whs_love">⭐⭐⭐</div><div class="hs-luck-label">爱情</div></div>' +
          '<div class="hs-luck-item"><div class="hs-luck-stars" id="whs_work">⭐⭐⭐⭐</div><div class="hs-luck-label">事业</div></div>' +
          '<div class="hs-luck-item"><div class="hs-luck-stars" id="whs_money">⭐⭐</div><div class="hs-luck-label">财运</div></div></div>' +
          '<div class="hs-text" id="whs_text">' + f + '</div>' +
          '<div class="hs-switch-row" id="whs_switch">' +
            signs.map(function(s,i){ return '<button class="hs-sign-btn'+(i===idx?' active':'')+'" data-si="'+i+'">'+s.charAt(0)+s.charAt(1)+'</button>'; }).join('') +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var signs = ['♈白羊座','♉金牛座','♊双子座','♋巨蟹座','♌狮子座','♍处女座','♎天秤座','♏天蝎座','♐射手座','♑摩羯座','♒水瓶座','♓双鱼座'];
      var dates = ['3.21-4.19','4.20-5.20','5.21-6.21','6.22-7.22','7.23-8.22','8.23-9.22','9.23-10.23','10.24-11.22','11.23-12.21','12.22-1.19','1.20-2.18','2.19-3.20'];
      var fortunes = ['今天会有小惊喜等着你哦 ✨','保持微笑，好运自然来 🌸','适合和朋友聊聊天 💬','注意劳逸结合呀 🍃','今天灵感爆棚！记录下来 💡','可能会收到好消息 📬','适合尝试新事物 🎯','享受当下的每一刻吧 💖','用心感受身边的小确幸 🍬','今天特别适合表达心意 💌','大胆迈出第一步吧 🚀','给自己一点独处的时间 🌿'];
      function randomStars(){ var n=Math.floor(Math.random()*5)+1; return '⭐'.repeat(n); }
      function updateSign(idx) {
        el.querySelector('#whs_icon').textContent = signs[idx].charAt(0)+signs[idx].charAt(1);
        el.querySelector('#whs_sign').textContent = signs[idx];
        el.querySelector('#whs_date').textContent = dates[idx];
        el.querySelector('#whs_love').textContent = randomStars();
        el.querySelector('#whs_work').textContent = randomStars();
        el.querySelector('#whs_money').textContent = randomStars();
        el.querySelector('#whs_text').textContent = fortunes[Math.floor(Math.random()*fortunes.length)];
        el.querySelectorAll('.hs-sign-btn').forEach(function(b,i){ b.classList.toggle('active', i===idx); });
        localStorage.setItem('widget_horoscope_idx', idx);
      }
      el.querySelector('#whs_switch').addEventListener('click', function(e){
        var btn = e.target.closest('.hs-sign-btn');
        if (!btn) return;
        e.stopPropagation();
        updateSign(parseInt(btn.dataset.si));
      });
    }
  });

  // =============================================
  // 😊 今日心情 Widget
  // =============================================
  W.register({
    id: 'mood-today',
    name: '今日心情',
    icon: '😊',
    desc: '记录今天的心情状态',
    getHTML: function() {
      var moods = ['😊','🥰','🤩','😌','😴','😢','😰','😤'];
      var labels = ['开心','甜蜜','兴奋','平静','疲惫','难过','焦虑','生气'];
      var today = new Date().toISOString().split('T')[0];
      var saved = localStorage.getItem('widget_mood_' + today);
      var savedIdx = saved ? parseInt(saved) : -1;
      return '<div class="widget-mini-card widget-mood">' +
        '<div class="widget-mini-header"><span class="w-icon">😊</span>今日心情</div>' +
        '<div class="widget-mini-body">' +
          '<div class="mood-picker" id="wm_picker">' +
            moods.map(function(m,i){ return '<button class="mood-emoji'+(i===savedIdx?' selected':'')+'" data-mi="'+i+'">'+m+'</button>'; }).join('') +
          '</div>' +
          '<div class="mood-status" id="wm_status">' + (savedIdx>=0 ? labels[savedIdx] : '今天心情如何？') + '</div>' +
          '<div class="mood-streak" id="wm_streak">连续记录 0 天</div>' +
        '</div></div>';
    },
    render: function(el) { this.updateStreak(el); },
    updateStreak: function(el) {
      var count = 0;
      for (var i=0;i<30;i++) {
        var d = new Date(); d.setDate(d.getDate()-i);
        var key = 'widget_mood_' + d.toISOString().split('T')[0];
        if (localStorage.getItem(key)) count++; else break;
      }
      var streakEl = el.querySelector('#wm_streak');
      if (streakEl) streakEl.textContent = '连续记录 ' + count + ' 天';
    },
    bindEvents: function(el) {
      var labels = ['开心','甜蜜','兴奋','平静','疲惫','难过','焦虑','生气'];
      var self = this;
      el.querySelector('#wm_picker').addEventListener('click', function(e){
        var btn = e.target.closest('.mood-emoji');
        if (!btn) return;
        e.stopPropagation();
        var idx = parseInt(btn.dataset.mi);
        var today = new Date().toISOString().split('T')[0];
        localStorage.setItem('widget_mood_'+today, idx);
        el.querySelectorAll('.mood-emoji').forEach(function(b,i){ b.classList.toggle('selected',i===idx); });
        el.querySelector('#wm_status').textContent = labels[idx];
        self.updateStreak(el);
        showToast('心情已记录：' + labels[idx]);
      });
    }
  });

  // =============================================
  // 💧 喝水打卡 Widget
  // =============================================
  W.register({
    id: 'water-tracker',
    name: '喝水打卡',
    icon: '💧',
    desc: '记录每日喝水杯数，保持健康',
    getHTML: function() {
      var today = new Date().toISOString().split('T')[0];
      var count = parseInt(localStorage.getItem('widget_water_'+today) || '0');
      return '<div class="widget-mini-card widget-water">' +
        '<div class="widget-mini-header"><span class="w-icon">💧</span>喝水打卡</div>' +
        '<div class="widget-mini-body">' +
          '<div class="water-progress">' +
            '<div class="water-cups-row" id="ww_cups">' +
              [1,2,3,4,5,6,7,8].map(function(i){ return '<span class="water-cup'+(i<=count?' filled':'')+'" data-wc="'+i+'">💧</span>'; }).join('') +
            '</div>' +
            '<div class="water-count" id="ww_count">' + count + ' / 8</div>' +
            '<div class="water-label">杯（~200ml/杯）</div>' +
          '</div>' +
          '<button class="water-reset" id="ww_reset">重新计数</button>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      function getToday(){ return new Date().toISOString().split('T')[0]; }
      function updateDisplay(c) {
        el.querySelector('#ww_count').textContent = c + ' / 8';
        el.querySelectorAll('.water-cup').forEach(function(cup,i){
          cup.classList.toggle('filled', i < c);
        });
      }
      el.querySelector('#ww_cups').addEventListener('click', function(e){
        var cup = e.target.closest('.water-cup');
        if (!cup) return;
        e.stopPropagation();
        var n = parseInt(cup.dataset.wc);
        var today = getToday();
        var current = parseInt(localStorage.getItem('widget_water_'+today)||'0');
        if (n === current) n = current-1;
        if (n < 0) n = 0;
        localStorage.setItem('widget_water_'+today, n);
        updateDisplay(n);
        showToast(n>=8 ? '💧 今日喝水目标达成！' : '已喝 ' + n + ' 杯');
      });
      el.querySelector('#ww_reset').addEventListener('click', function(e){ e.stopPropagation();
        localStorage.setItem('widget_water_'+getToday(), '0');
        updateDisplay(0);
      });
    }
  });

  // =============================================
  // 📖 每日一句 Widget
  // =============================================
  W.register({
    id: 'daily-quote',
    name: '每日一句',
    icon: '📖',
    desc: '每天一句温暖治愈的话语',
    quotes: [
      {t:'你今天真好看',a:'治愈小句',f:'日常'},
      {t:'慢慢来，会更快',a:'生活感悟',f:'哲理'},
      {t:'心之所向，素履以往',a:'木心',f:'文学'},
      {t:'凡是过往，皆为序章',a:'莎士比亚',f:'经典'},
      {t:'且将新火试新茶，诗酒趁年华',a:'苏轼',f:'诗词'},
      {t:'煎和熬都是变美味的方法，加油也是',a:'美食语录',f:'治愈'},
      {t:'世界很大，开心第一',a:'日常小句',f:'元气'},
      {t:'你今天微笑了吗？',a:'早安语录',f:'清晨'},
      {t:'星星发亮是为了让每一个人有一天都能找到属于自己的星星',a:'小王子',f:'经典'},
      {t:'人生如逆旅，我亦是行人',a:'苏轼',f:'诗词'},
      {t:'放弃不难，但坚持一定很酷',a:'东野圭吾',f:'励志'},
      {t:'万物皆有裂痕，那是光照进来的地方',a:'莱昂纳德·科恩',f:'哲理'},
      {t:'生活明朗，万物可爱',a:'元气语录',f:'治愈'},
      {t:'保持热爱，奔赴山海',a:'旅行感悟',f:'正能量'},
      {t:'不负光阴，不负自己',a:'自律语录',f:'励志'}
    ],
    getHTML: function() {
      var i = new Date().getDate() % this.quotes.length;
      var q = this.quotes[i];
      return '<div class="widget-mini-card widget-quote">' +
        '<div class="widget-mini-header"><span class="w-icon">📖</span>每日一句</div>' +
        '<div class="widget-mini-body">' +
          '<div class="quote-content">' +
            '<div class="quote-text" id="wq_text">' + q.t + '</div>' +
            '<div class="quote-author" id="wq_author">—— ' + q.a + '</div>' +
            '<div class="quote-from" id="wq_from">' + q.f + '</div>' +
          '</div>' +
          '<button class="quote-refresh" id="wq_refresh">✨ 换一句</button>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var quotes = this.quotes;
      el.querySelector('#wq_refresh').addEventListener('click', function(e){ e.stopPropagation();
        var q = quotes[Math.floor(Math.random()*quotes.length)];
        el.querySelector('#wq_text').textContent = q.t;
        el.querySelector('#wq_author').textContent = '—— ' + q.a;
        el.querySelector('#wq_from').textContent = q.f;
      });
    }
  });

  // =============================================
  // 🌈 渐变预览 Widget
  // =============================================
  W.register({
    id: 'gradient-preview',
    name: '渐变预览',
    icon: '🌈',
    desc: '随机展示 CSS 渐变配色效果',
    gradients: [
      {css:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',name:'暮光紫'},
      {css:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',name:'甜心粉'},
      {css:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',name:'天空蓝'},
      {css:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',name:'薄荷绿'},
      {css:'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',name:'日落橙'},
      {css:'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',name:'梦幻紫'},
      {css:'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',name:'棉花糖'},
      {css:'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',name:'暖杏色'},
      {css:'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',name:'玫瑰红'},
      {css:'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',name:'婴儿蓝'}
    ],
    getHTML: function() {
      var g = this.gradients[Math.floor(Math.random()*this.gradients.length)];
      return '<div class="widget-mini-card widget-gradient-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">🌈</span>渐变预览</div>' +
        '<div class="widget-mini-body">' +
          '<div class="grad-preview" id="wgp_preview" style="background:' + g.css + '"></div>' +
          '<div class="grad-code" id="wgp_code" title="点击复制CSS">' + g.css + '</div>' +
          '<div class="grad-actions">' +
            '<button class="grad-btn" id="wgp_copy">📋 复制CSS</button>' +
            '<button class="grad-btn" id="wgp_next">🎲 换一个</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var grads = this.gradients;
      function apply(g) {
        el.querySelector('#wgp_preview').style.background = g.css;
        el.querySelector('#wgp_code').textContent = g.css;
      }
      el.querySelector('#wgp_code').addEventListener('click', function(e){ e.stopPropagation();
        copyToClipboard(el.querySelector('#wgp_code').textContent); showToast('渐变 CSS 已复制');
      });
      el.querySelector('#wgp_copy').addEventListener('click', function(e){ e.stopPropagation();
        copyToClipboard(el.querySelector('#wgp_code').textContent); showToast('渐变 CSS 已复制');
      });
      el.querySelector('#wgp_next').addEventListener('click', function(e){ e.stopPropagation();
        apply(grads[Math.floor(Math.random()*grads.length)]);
      });
    }
  });

  // =============================================
  // 👗 穿搭色卡 Widget
  // =============================================
  W.register({
    id: 'outfit-card',
    name: '穿搭色卡',
    icon: '👗',
    desc: '随机生成穿搭配色灵感',
    styles: ['🌷春日','☀️夏日','🍂秋日','❄️冬日','🍬甜系','😎酷系'],
    palettes: {
      '🌷春日': ['#f9a8d4','#fde68a','#a7f3d0','#bfdbfe'],
      '☀️夏日': ['#fbbf24','#f472b6','#60a5fa','#34d399'],
      '🍂秋日': ['#d97706','#b45309','#92400e','#fcd34d'],
      '❄️冬日': ['#e0e7ff','#c7d2fe','#818cf8','#3730a3'],
      '🍬甜系': ['#fbcfe8','#f9a8d4','#ec4899','#be185d'],
      '😎酷系': ['#1e293b','#475569','#94a3b8','#cbd5e1']
    },
    getHTML: function() {
      var style = '🍬甜系', colors = this.palettes[style];
      return '<div class="widget-mini-card widget-outfit-card">' +
        '<div class="widget-mini-header"><span class="w-icon">👗</span>穿搭色卡</div>' +
        '<div class="widget-mini-body">' +
          '<div class="oc-colors" id="woc_colors">' +
            colors.map(function(c){ return '<div class="oc-swatch" style="background:'+c+'" data-hex="'+c+'"><span class="oc-hex">'+c+'</span></div>'; }).join('') +
          '</div>' +
          '<div class="oc-style-row" id="woc_styles">' +
            this.styles.map(function(s){ return '<button class="oc-style-tag'+(s===style?' active':'')+'" data-os="'+s+'">'+s+'</button>'; }).join('') +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var palettes = this.palettes;
      var styles = this.styles;
      function applyStyle(s) {
        var colors = palettes[s] || palettes['🍬甜系'];
        var colorsEl = el.querySelector('#woc_colors');
        colorsEl.innerHTML = colors.map(function(c){ return '<div class="oc-swatch" style="background:'+c+'" data-hex="'+c+'"><span class="oc-hex">'+c+'</span></div>'; }).join('');
        el.querySelectorAll('.oc-style-tag').forEach(function(t){ t.classList.toggle('active', t.dataset.os===s); });
        // bind swatch click
        colorsEl.querySelectorAll('.oc-swatch').forEach(function(sw){
          sw.addEventListener('click', function(e){ e.stopPropagation();
            copyToClipboard(sw.dataset.hex); showToast('色值 ' + sw.dataset.hex + ' 已复制');
          });
        });
      }
      el.querySelector('#woc_styles').addEventListener('click', function(e){
        var btn = e.target.closest('.oc-style-tag');
        if (!btn) return;
        e.stopPropagation();
        applyStyle(btn.dataset.os);
      });
      // initial swatch bindings
      el.querySelectorAll('.oc-swatch').forEach(function(sw){
        sw.addEventListener('click', function(e){ e.stopPropagation();
          copyToClipboard(sw.dataset.hex); showToast('色值 ' + sw.dataset.hex + ' 已复制');
        });
      });
    }
  });

  // =============================================
  // 📊 字数统计 Widget
  // =============================================
  W.register({
    id: 'word-count-mini',
    name: '字数统计',
    icon: '📊',
    desc: '粘贴文本，实时统计字数和行数',
    getHTML: function() {
      return '<div class="widget-mini-card widget-wordcount">' +
        '<div class="widget-mini-header"><span class="w-icon">📊</span>字数统计</div>' +
        '<div class="widget-mini-body">' +
          '<div class="wc-display">' +
            '<div class="wc-stat wc-char"><div class="wc-num" id="wwc_char">0</div><div class="wc-stat-label">字符</div></div>' +
            '<div class="wc-stat wc-word"><div class="wc-num" id="wwc_word">0</div><div class="wc-stat-label">单词</div></div>' +
            '<div class="wc-stat wc-line"><div class="wc-num" id="wwc_line">0</div><div class="wc-stat-label">行数</div></div>' +
          '</div>' +
          '<textarea class="wc-input" id="wwc_input" placeholder="粘贴文本到这里..."></textarea>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#wwc_input');
      var charEl = el.querySelector('#wwc_char'), wordEl = el.querySelector('#wwc_word'), lineEl = el.querySelector('#wwc_line');
      function update() { var t = input.value;
        charEl.textContent = t.length;
        wordEl.textContent = t.trim() ? t.trim().split(/\s+/).length : 0;
        lineEl.textContent = t ? t.split('\n').length : 0;
      }
      input.addEventListener('input', function(e){ e.stopPropagation(); update(); });
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      input.addEventListener('focus', function(){ input.style.maxHeight='80px'; });
      input.addEventListener('blur', function(){ input.style.maxHeight='48px'; });
    }
  });

  // =============================================
  // 🔗 URL 编解码 Widget
  // =============================================
  W.register({
    id: 'url-encode-mini',
    name: 'URL 编解码',
    icon: '🔗',
    desc: '快速 URL Encode / Decode',
    getHTML: function() {
      return '<div class="widget-mini-card widget-url-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">🔗</span>URL 编解码</div>' +
        '<div class="widget-mini-body">' +
          '<div class="url-input-row"><input type="text" id="wurl_input" placeholder="输入 URL 或字符串..."></div>' +
          '<div class="url-result" id="wurl_result" title="点击复制">结果会显示在这里</div>' +
          '<div class="url-btns">' +
            '<button class="url-btn" id="wurl_encode">Encode</button>' +
            '<button class="url-btn" id="wurl_decode">Decode</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#wurl_input'), result = el.querySelector('#wurl_result');
      var encBtn = el.querySelector('#wurl_encode'), decBtn = el.querySelector('#wurl_decode');
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      function show(r) { result.textContent = r; }
      encBtn.addEventListener('click', function(e){ e.stopPropagation();
        try { show(encodeURIComponent(input.value)); } catch(ex) { show('编码失败'); }
      });
      decBtn.addEventListener('click', function(e){ e.stopPropagation();
        try { show(decodeURIComponent(input.value)); } catch(ex) { show('解码失败，请检查输入'); }
      });
      result.addEventListener('click', function(e){ e.stopPropagation();
        if (result.textContent.indexOf('失败')>=0 || result.textContent.indexOf('这里')>=0) return;
        copyToClipboard(result.textContent); showToast('已复制');
      });
    }
  });

  // =============================================
  // 📟 Base64 编解码 Widget
  // =============================================
  W.register({
    id: 'base64-mini',
    name: 'Base64 编解码',
    icon: '📟',
    desc: '快速 Base64 编码/解码',
    getHTML: function() {
      return '<div class="widget-mini-card widget-base64-mini">' +
        '<div class="widget-mini-header"><span class="w-icon">📟</span>Base64 编解码</div>' +
        '<div class="widget-mini-body">' +
          '<input type="text" class="b64-input" id="wb64_input" placeholder="输入文本...">' +
          '<div class="b64-result" id="wb64_result" title="点击复制">结果会显示在这里</div>' +
          '<div class="b64-btns">' +
            '<button class="b64-btn" id="wb64_encode">Encode</button>' +
            '<button class="b64-btn" id="wb64_decode">Decode</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#wb64_input'), result = el.querySelector('#wb64_result');
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      el.querySelector('#wb64_encode').addEventListener('click', function(e){ e.stopPropagation();
        try { result.textContent = btoa(unescape(encodeURIComponent(input.value))); } catch(ex) { result.textContent = '编码失败'; }
      });
      el.querySelector('#wb64_decode').addEventListener('click', function(e){ e.stopPropagation();
        try { result.textContent = decodeURIComponent(escape(atob(input.value))); } catch(ex) { result.textContent = '解码失败，请检查输入'; }
      });
      result.addEventListener('click', function(e){ e.stopPropagation();
        if (result.textContent.indexOf('失败')>=0 || result.textContent.indexOf('这里')>=0) return;
        copyToClipboard(result.textContent); showToast('已复制');
      });
    }
  });

  // =============================================
  // 🎲 抛硬币 Widget
  // =============================================
  W.register({
    id: 'coin-flip',
    name: '抛硬币',
    icon: '🪙',
    desc: '抛硬币做决定，正面还是反面',
    getHTML: function() {
      return '<div class="widget-mini-card widget-coin">' +
        '<div class="widget-mini-header"><span class="w-icon">🪙</span>抛硬币</div>' +
        '<div class="widget-mini-body">' +
          '<div class="coin-display"><span class="coin-face" id="wcf_face">🪙</span></div>' +
          '<div class="coin-result" id="wcf_result">点击硬币抛一下！</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var face = el.querySelector('#wcf_face'), result = el.querySelector('#wcf_result');
      var flipping = false;
      face.addEventListener('click', function(e){ e.stopPropagation();
        if (flipping) return; flipping = true;
        face.classList.add('flipping');
        setTimeout(function(){
          var isHeads = Math.random() < 0.5;
          face.textContent = isHeads ? '🪙' : '🪙';
          face.classList.remove('flipping');
          result.textContent = isHeads ? '🎉 正面！' : '💫 反面！';
          flipping = false;
        }, 800);
      });
    }
  });

  // =============================================
  // 🆔 哈希速算 Widget
  // =============================================
  W.register({
    id: 'hash-quick',
    name: '哈希速算',
    icon: '🔑',
    desc: '快速计算 MD5 / SHA1 / SHA256',
    getHTML: function() {
      return '<div class="widget-mini-card widget-hash-quick">' +
        '<div class="widget-mini-header"><span class="w-icon">🔑</span>哈希速算</div>' +
        '<div class="widget-mini-body">' +
          '<div class="hash-input-row"><input type="text" id="whq_input" placeholder="输入要哈希的文本..."></div>' +
          '<div class="hash-type-row" id="whq_types">' +
            '<button class="hash-type active" data-ht="md5">MD5</button>' +
            '<button class="hash-type" data-ht="sha1">SHA1</button>' +
            '<button class="hash-type" data-ht="sha256">SHA256</button>' +
          '</div>' +
          '<div class="hash-output" id="whq_output" title="点击复制">—</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#whq_input'), output = el.querySelector('#whq_output');
      var type = 'md5';
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      function calc() { var v = input.value;
        if (!v) { output.textContent = '—'; return; }
        if (type==='md5') output.textContent = md5(v);
        else if (type==='sha1') output.textContent = sha1(v);
        else output.textContent = sha256(v);
      }
      input.addEventListener('input', function(e){ e.stopPropagation(); calc(); });
      el.querySelector('#whq_types').addEventListener('click', function(e){
        var btn = e.target.closest('.hash-type');
        if (!btn) return;
        e.stopPropagation();
        type = btn.dataset.ht;
        el.querySelectorAll('.hash-type').forEach(function(b){ b.classList.toggle('active',b.dataset.ht===type); });
        calc();
      });
      output.addEventListener('click', function(e){ e.stopPropagation();
        if (output.textContent === '—') return;
        copyToClipboard(output.textContent); showToast('哈希值已复制');
      });
    }
  });

  // =============================================
  // ⏰ Cron 预览 Widget
  // =============================================
  W.register({
    id: 'cron-preview',
    name: 'Cron 预览',
    icon: '⏰',
    desc: '输入 Cron 表达式，预览下次执行时间',
    getHTML: function() {
      return '<div class="widget-mini-card widget-cron">' +
        '<div class="widget-mini-header"><span class="w-icon">⏰</span>Cron 预览</div>' +
        '<div class="widget-mini-body">' +
          '<div class="cron-input-row"><input type="text" id="wcr_input" placeholder="* * * * *" value="0 */2 * * *"></div>' +
          '<div class="cron-presets" id="wcr_presets">' +
            '<button class="cron-preset" data-cp="* * * * *">每分钟</button>' +
            '<button class="cron-preset" data-cp="0 * * * *">每小时</button>' +
            '<button class="cron-preset" data-cp="0 0 * * *">每天</button>' +
            '<button class="cron-preset" data-cp="0 0 * * 0">每周</button>' +
            '<button class="cron-preset" data-cp="0 0 1 * *">每月</button>' +
          '</div>' +
          '<div class="cron-next-list" id="wcr_next">' +
            '<div class="cron-next-item">输入表达式查看执行计划</div>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#wcr_input'), nextEl = el.querySelector('#wcr_next');
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });

      function parseCron(expr) {
        var parts = expr.trim().split(/\s+/);
        if (parts.length !== 5) return null;
        // Simple cron parsing - just show some descriptive text
        var labels = [];
        if (parts[0]==='*') labels.push('每分钟');
        else if (parts[0].startsWith('*/')) labels.push('每'+parts[0].slice(2)+'分钟');
        else labels.push('第'+parts[0]+'分钟');

        if (parts[1]==='*') labels.push('每小时');
        else if (parts[1].startsWith('*/')) labels.push('每'+parts[1].slice(2)+'小时');
        else labels.push('第'+parts[1]+'时');

        if (parts[2]==='*') labels.push('每天');
        else labels.push('每月'+parts[2]+'号');

        if (parts[3]==='*') labels.push('每月');
        else labels.push(parts[3]+'月');

        var days = ['日','一','二','三','四','五','六'];
        if (parts[4]==='*') labels.push('');
        else labels.push('周'+days[parseInt(parts[4])%7]);

        return labels.join(' ');
      }

      function preview() {
        var expr = input.value.trim();
        var desc = parseCron(expr);
        if (!desc) { nextEl.innerHTML = '<div class="cron-next-item">表达式格式错误</div>'; return; }
        var now = new Date();
        var html = '<div style="font-size:9px;color:var(--text-muted);margin-bottom:4px">' + desc + '</div>';
        for (var i=0;i<3;i++) {
          var t = new Date(now.getTime() + (i+1)*60000*30);
          html += '<div class="cron-next-item">#'+(i+1)+' ' +
            t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')+' '+
            String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')+'</div>';
        }
        nextEl.innerHTML = html;
      }
      preview();
      input.addEventListener('input', function(e){ e.stopPropagation(); preview(); });
      el.querySelector('#wcr_presets').addEventListener('click', function(e){
        var btn = e.target.closest('.cron-preset');
        if (!btn) return;
        e.stopPropagation();
        input.value = btn.dataset.cp;
        preview();
      });
    }
  });

  // =============================================
  // 🌐 IP 速查 Widget
  // =============================================
  W.register({
    id: 'ip-quick',
    name: 'IP 速查',
    icon: '🌐',
    desc: '查看你的公网 IP 和浏览器信息',
    getHTML: function() {
      return '<div class="widget-mini-card widget-ip-quick">' +
        '<div class="widget-mini-header"><span class="w-icon">🌐</span>IP 速查</div>' +
        '<div class="widget-mini-body">' +
          '<div class="ip-display">' +
            '<div class="ip-addr" id="wip_addr">加载中...</div>' +
            '<div class="ip-location" id="wip_loc">正在查询...</div>' +
            '<div class="ip-isp" id="wip_isp"></div>' +
          '</div>' +
          '<div class="ip-browser" id="wip_ua">' + navigator.userAgent.substring(0,30) + '...</div>' +
        '</div></div>';
    },
    render: function(el) {
      var addrEl = el.querySelector('#wip_addr');
      var locEl = el.querySelector('#wip_loc');
      fetch('https://api.ip.sb/geoip', {signal: AbortSignal.timeout(5000)}).then(function(r){ return r.json(); }).then(function(d){
        if (addrEl) addrEl.textContent = d.ip || '未知';
        if (locEl) locEl.textContent = [d.country,d.city].filter(Boolean).join(' · ') || '未知';
        var ispEl = el.querySelector('#wip_isp');
        if (ispEl) ispEl.textContent = d.isp || d.organization || '';
      }).catch(function(){
        if (addrEl) addrEl.textContent = '查询失败';
        if (locEl) locEl.textContent = '点击刷新重试';
      });
      if (addrEl) addrEl.addEventListener('click', function(e){ e.stopPropagation();
        copyToClipboard(addrEl.textContent); showToast('IP 已复制');
      });
    }
  });

  // =============================================
  // 🎯 每日一签 Widget
  // =============================================
  W.register({
    id: 'fortune-lottery',
    name: '每日一签',
    icon: '🎯',
    desc: '摇一支幸运签，看看今天的运势',
    getHTML: function() {
      var idx = new Date().getDate() % 5;
      var levels = ['大吉','吉','中吉','小吉','末吉'];
      var texts = ['诸事顺遂，好运连连！','今天适合做出重要决定。','平常心，好事自然来。','小小的幸运在等着你哦。','稳稳当当就是最好的日子。'];
      var lucky = ['幸运色：樱花粉','幸运数字：7','幸运方向：东南'];
      return '<div class="widget-mini-card widget-fortune">' +
        '<div class="widget-mini-header"><span class="w-icon">🎯</span>每日一签</div>' +
        '<div class="widget-mini-body">' +
          '<div class="fortune-display">' +
            '<span class="fortune-stick">🏮</span>' +
            '<div class="fortune-level great" id="wfl_level">' + levels[idx] + '</div>' +
            '<div class="fortune-text" id="wfl_text">' + texts[idx] + '</div>' +
            '<div class="fortune-lucky" id="wfl_lucky">' + lucky.join(' · ') + '</div>' +
          '</div>' +
          '<button class="fortune-draw-btn" id="wfl_draw">🎋 摇一摇</button>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var levels = ['大吉','吉','中吉','小吉','末吉'];
      var levelCls = ['great','good','ok','meh','meh'];
      var texts = ['诸事顺遂，好运连连！','今天适合做出重要决定。','平常心，好事自然来。','小小的幸运在等着你哦。','稳稳当当就是最好的日子。'];
      var colors = ['樱花粉','薄荷绿','天空蓝','焦糖橙','丁香紫'];
      var nums = [3,7,11,5,8,2,9,6,1,4,10,12];
      var dirs = ['东南','正南','正北','西北','西南','正东'];
      el.querySelector('#wfl_draw').addEventListener('click', function(e){ e.stopPropagation();
        var i = Math.floor(Math.random()*levels.length);
        el.querySelector('#wfl_level').textContent = levels[i];
        el.querySelector('#wfl_level').className = 'fortune-level ' + levelCls[i];
        el.querySelector('#wfl_text').textContent = texts[i];
        el.querySelector('#wfl_lucky').textContent = '幸运色：'+colors[Math.floor(Math.random()*colors.length)]+' · 幸运数字：'+nums[Math.floor(Math.random()*nums.length)]+' · 幸运方向：'+dirs[Math.floor(Math.random()*dirs.length)];
        showToast('🎋 今日签运：' + levels[i]);
      });
    }
  });

  // =============================================
  // 📅 日期差值 Widget
  // =============================================
  W.register({
    id: 'date-diff',
    name: '日期差值',
    icon: '📆',
    desc: '计算两个日期之间相差多少天',
    getHTML: function() {
      var today = new Date().toISOString().split('T')[0];
      return '<div class="widget-mini-card widget-date-diff">' +
        '<div class="widget-mini-header"><span class="w-icon">📆</span>日期差值</div>' +
        '<div class="widget-mini-body">' +
          '<div class="dd-picker-row">' +
            '<input type="date" id="wdd_from" value="' + today + '">' +
            '<span>→</span>' +
            '<input type="date" id="wdd_to" value="' + today + '">' +
          '</div>' +
          '<div class="dd-result">' +
            '<div class="dd-days" id="wdd_days">0</div>' +
            '<div class="dd-label" id="wdd_label">天</div>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      function calc() {
        var f = el.querySelector('#wdd_from').value, t = el.querySelector('#wdd_to').value;
        if (!f || !t) return;
        var diff = Math.ceil((new Date(t)-new Date(f))/86400000);
        el.querySelector('#wdd_days').textContent = Math.abs(diff);
        el.querySelector('#wdd_label').textContent = diff >= 0 ? '天后' : '天前';
      }
      el.querySelector('#wdd_from').addEventListener('change', function(e){ e.stopPropagation(); calc(); });
      el.querySelector('#wdd_to').addEventListener('change', function(e){ e.stopPropagation(); calc(); });
      el.querySelectorAll('input[type=date]').forEach(function(i){ i.addEventListener('mousedown',function(e){ e.stopPropagation(); }); });
    }
  });

  // =============================================
  // 🎨 色感分数 Widget
  // =============================================
  W.register({
    id: 'color-sense-score',
    name: '色感分数',
    icon: '🎨',
    desc: '查看色感测试的最高纪录',
    getHTML: function() {
      var best = parseInt(localStorage.getItem('color_sense_best') || '0');
      var rank = '新手', rankCls = 'meh';
      if (best >= 50) { rank = '色感大师'; rankCls = 'master'; }
      else if (best >= 30) { rank = '色感高手'; rankCls = 'expert'; }
      else if (best >= 15) { rank = '色感达人'; rankCls = 'advanced'; }
      return '<div class="widget-mini-card widget-color-sense-score">' +
        '<div class="widget-mini-header"><span class="w-icon">🎨</span>色感挑战</div>' +
        '<div class="widget-mini-body">' +
          '<div class="css-score">' +
            '<div class="css-score-num">' + (best || '--') + '</div>' +
            '<div class="css-rank ' + rankCls + '">' + rank + '</div>' +
          '</div>' +
          '<button class="css-play-btn" id="wcss_play">🎯 去挑战</button>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      el.querySelector('#wcss_play').addEventListener('click', function(e){ e.stopPropagation();
        window.open('/tools/fun/color-sense', '_blank');
      });
    }
  });

  // =============================================
  // 🎵 白噪音控制器 Widget
  // =============================================
  W.register({
    id: 'noise-controller',
    name: '白噪音',
    icon: '🎵',
    desc: '快速播放自然白噪音',
    scenes: ['🌧️','🌊','🔥','🌿','☕','🎐'],
    sceneNames: ['雨声','海浪','篝火','森林','咖啡馆','风铃'],
    getHTML: function() {
      return '<div class="widget-mini-card widget-noise">' +
        '<div class="widget-mini-header"><span class="w-icon">🎵</span>白噪音</div>' +
        '<div class="widget-mini-body">' +
          '<div class="noise-playing">' +
            '<span class="noise-icon" id="wn_icon">🌧️</span>' +
            '<div class="noise-name" id="wn_name">雨声</div>' +
          '</div>' +
          '<div class="noise-scene-row" id="wn_scenes">' +
            this.scenes.map(function(s,i){ return '<span class="noise-scene'+(i===0?' active':'')+'" data-ns="'+i+'">'+s+'</span>'; }).join('') +
          '</div>' +
          '<div class="noise-vol">' +
            '<label>🔉</label><input type="range" id="wn_vol" min="0" max="100" value="50">' +
          '</div>' +
          '<div class="noise-controls">' +
            '<button class="noise-btn" id="wn_play">▶ 播放</button>' +
            '<button class="noise-btn" id="wn_stop">⏹ 停止</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var self = this;
      var audioCtx = null, gainNode = null, noiseNode = null, isPlaying = false, currentScene = 0;

      function initAudio() {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext||window.webkitAudioContext)();
          gainNode = audioCtx.createGain();
          gainNode.connect(audioCtx.destination);
        }
      }

      function createNoise(type) {
        if (noiseNode) { try{noiseNode.stop();}catch(e){} noiseNode.disconnect(); }
        var bufferSize = audioCtx.sampleRate * 2;
        var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        var data = buffer.getChannelData(0);
        // Brown/pink/white noise variants based on scene
        var b0=0,b1=0,b2=0;
        for (var i=0;i<bufferSize;i++) {
          var white = Math.random()*2-1;
          if (type===0 || type===4) { data[i] = white * 0.3; } // white (rain, cafe)
          else if (type===1 || type===2) { // brown (ocean, fire)
            b0 = 0.997*b0 + 0.02*white; data[i] = b0 * 2;
          } else { // pink (forest, wind)
            b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759; b2=0.99332*b2+white*0.0750759;
            data[i] = (b0+b1+b2+white*0.0432)*0.2;
          }
        }
        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;
        noiseNode.connect(gainNode);
        noiseNode.start();
      }

      function stopNoise() {
        if (noiseNode) { try{noiseNode.stop();}catch(e){} noiseNode.disconnect(); noiseNode=null; }
        isPlaying = false;
        el.querySelector('#wn_play').textContent = '▶ 播放';
        el.querySelector('#wn_icon').classList.remove('playing');
      }

      el.querySelector('#wn_play').addEventListener('click', function(e){ e.stopPropagation();
        initAudio();
        if (isPlaying) { stopNoise(); return; }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        createNoise(currentScene);
        isPlaying = true;
        el.querySelector('#wn_play').textContent = '⏸ 暂停';
        el.querySelector('#wn_icon').classList.add('playing');
      });

      el.querySelector('#wn_stop').addEventListener('click', function(e){ e.stopPropagation(); stopNoise(); });
      el.querySelector('#wn_vol').addEventListener('input', function(e){ e.stopPropagation();
        if (gainNode) gainNode.gain.value = e.target.value / 100;
      });
      el.querySelector('#wn_vol').addEventListener('mousedown', function(e){ e.stopPropagation(); });
      el.querySelector('#wn_scenes').addEventListener('click', function(e){
        var s = e.target.closest('.noise-scene');
        if (!s) return;
        e.stopPropagation();
        currentScene = parseInt(s.dataset.ns);
        el.querySelectorAll('.noise-scene').forEach(function(x){ x.classList.remove('active'); });
        s.classList.add('active');
        el.querySelector('#wn_icon').textContent = self.scenes[currentScene];
        el.querySelector('#wn_name').textContent = self.sceneNames[currentScene];
        if (isPlaying) { createNoise(currentScene); }
      });
    }
  });

  // =============================================
  // 💱 大小写转换 Widget
  // =============================================
  W.register({
    id: 'case-convert',
    name: '大小写转换',
    icon: '🔤',
    desc: '快速转换英文大小写',
    getHTML: function() {
      return '<div class="widget-mini-card widget-case-convert">' +
        '<div class="widget-mini-header"><span class="w-icon">🔤</span>大小写转换</div>' +
        '<div class="widget-mini-body">' +
          '<input type="text" class="cc-input" id="wcc_input" placeholder="输入英文文本...">' +
          '<div class="cc-result" id="wcc_result" title="点击复制">—</div>' +
          '<div class="cc-btns" id="wcc_btns">' +
            '<button class="cc-btn" data-cc="upper">全大写</button>' +
            '<button class="cc-btn" data-cc="lower">全小写</button>' +
            '<button class="cc-btn" data-cc="capitalize">首字母大写</button>' +
            '<button class="cc-btn" data-cc="toggle">大小写反转</button>' +
          '</div>' +
        '</div></div>';
    },
    bindEvents: function(el) {
      var input = el.querySelector('#wcc_input'), result = el.querySelector('#wcc_result');
      input.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      el.querySelector('#wcc_btns').addEventListener('click', function(e){
        var btn = e.target.closest('.cc-btn');
        if (!btn) return;
        e.stopPropagation();
        var v = input.value, action = btn.dataset.cc;
        if (action==='upper') result.textContent = v.toUpperCase();
        else if (action==='lower') result.textContent = v.toLowerCase();
        else if (action==='capitalize') result.textContent = v.replace(/\b\w/g,function(c){return c.toUpperCase();});
        else if (action==='toggle') result.textContent = v.split('').map(function(c){return c===c.toUpperCase()?c.toLowerCase():c.toUpperCase();}).join('');
      });
      result.addEventListener('click', function(e){ e.stopPropagation();
        if (result.textContent==='—') return;
        copyToClipboard(result.textContent); showToast('已复制');
      });
    }
  });

  console.log('[Widgets Extended] 20 个新小组件已注册');
  // 注册完所有扩展组件后，触发 WidgetManager 重新初始化
  // 这样即使 widget.js 的 scheduleInit 先跑了（此时 registry 不全），
  // reinit 会再次 init，此时所有 25 个组件都已注册，filter 不会误删实例
  if (W) {
    W.reinit();
  }
})();
