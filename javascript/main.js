
var EventCenter = {
    on: function(type , handler){
        $(document).on(type,handler)
    },
    fire:function(type,data){
        $(document).trigger(type,data)
    }
}
// 上面一段没有明白什么意思
// 应该是表示的是将一个信息进行打包，进行触发

var Footer = {
    init:function(){
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.isToStart = true
        this.isToEnd = false
        this.Animation = false
        this.bind()
        this.rander()
        
    },
    bind:function(){
        var _this = this
        if(_this.isToStart && !_this.isToEnd){
            _this.$leftBtn.addClass('disable')/*这里设置的是左边按钮初始位置的状态 */
        }
        this.$rightBtn.on('click',function(){
            if(_this.Animation) return/* 这里设置的是当点击按钮之后，轮播还没有结束不能进行点击*/
            _this.$leftBtn.removeClass('disable')
            let itemWidth = _this.$box.find('li').outerWidth(true)//得到每个li的宽度
            let rowCount = Math.floor(_this.$box.width()/itemWidth)//得到一个box中有多少整数个li
            if(!_this.isToEnd){
            _this.Animation = true//只要一点击就会处于轮播就处于开始状态   
            _this.$ul.animate({
                left:'-='+rowCount*itemWidth//向左移动整数个li
            },400,function(){
                _this.Animation = false//一个轮播结束之后就可以再次点击了
                _this.isToStart = false
                if(parseFloat(_this.$box.width())-parseFloat(_this.$ul.css('left'))>=parseFloat(_this.$ul.width())){
                    _this.isToEnd = true
                    _this.$rightBtn.addClass('disable')
                    _this.$leftBtn.removeClass('disable')
                    }
                })//400设置的是变化的时间，设置的越短，整个页面就会跳转的特别快 
            }
        })
        this.$leftBtn.on('click',function(){
            if(_this.Animation) return/* 这里设置的是当点击按钮之后，轮播还没有结束不能进行点击*/
            let itemWidth = _this.$box.find('li').outerWidth(true)//得到每个li的宽度
            let rowCount = Math.floor(_this.$box.width()/itemWidth)//得到一个box中有多少整数个li
            if(!_this.isToStart){
            _this.Animation = true//只要一点击就会处于轮播就处于开始状态               
            _this.$ul.animate({
                left:'+='+rowCount*itemWidth//向左移动整数个li
            },400,function(){
                _this.Animation = false//一个轮播结束之后就可以再次点击了
                _this.isToEnd = false
                if(parseFloat(_this.$ul.css('left'))>=0){
                    _this.isToStart = true
                    _this.$leftBtn.addClass('disable')
                    _this.$rightBtn.removeClass('disable')
                    } 
                })
            }
        })
        this.$footer.on('click','li',function(){
            $(this).addClass('active')
            .siblings().removeClass('active')

            EventCenter.fire('select-albumn',{
                channelId:$(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            })
        })
    },
    rander:function(){
        var _this = this
        $.getJSON('http://jirenguapi.applinzi.com/fm/getChannels.php')
        .done(function(ret){
            _this.renderFooter(ret.channels)
        }).fail(function(){
            console.log('error')
        })
    },
    renderFooter:function(channels){
        var html = ''
        channels.forEach(function(channel){
            html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
                  + '  <div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                  + '  <h3>'+channel.name+'<h3>'
                  + '</li>'
        })
        this.$ul.html(html)
        this.setStyle()
    },
    setStyle:function(){
        var count = this.$footer.find('li').length  //取到的li的个数
        var width = this.$footer.find('li').outerWidth(true)//得到的每一个li的宽度
        this.$ul.css({
            width:count * width + 'px'//设置整个ul的宽度为所有的li的宽度总和
        })
    }
}
var Fm = {
    init:function(){
        this.$container = $('#page-music')//设置操作的范围
        this.audio = new Audio() //视频上面说播放是需要设置这个属性的东西，不知道是啥
        this.audio.autoplay = true //这里说的好像是播放的状态在显示
        
        this.bind()
    },
    bind:function(){
        var _this = this
        _this.musicplay = true
        EventCenter.on('select-albumn',function(e,channelObj){
            _this.channelId = channelObj.channelId
            _this.channelName = channelObj.channelName
            _this.loadMusic()
        })
        this.$container.find('.btn-play').on('click',function(){
            //这就实现了点击暂停和开始按钮的相互转换
            var $btn = $(this)
            var html = ''
            if(_this.musicplay){
                html = '<use xlink:href="#icon-bofang1"></use>'
                $btn.html(html)
                _this.musicplay = false
                _this.audio.pause()
            }else{
                html = '<use xlink:href="#icon-ai07"></use>'
                $btn.html(html)
                _this.musicplay = true
                _this.audio.play()
            }
        })
        this.$container.find('.btn-next').on('click',function(){
            //暂停选项
            _this.loadMusic()
        })
        this.audio.addEventListener('play',function(){//监听播放事件
            clearInterval(_this.statusClock)//当之间换为下一曲的时候将上一曲的定时器关掉
            _this.statusClock = setInterval(function(){
                _this.updataStatus()
            },1000)
        })
        this.audio.addEventListener('pause',function(){//监听停止事件
            clearInterval(_this.statusClock)//当点击暂停的时候就关掉定时器
        })
    },
    loadMusic(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId})
        .done(function(ret){
            _this.song = ret['song'][0]
            _this.setMusic()
            _this.loadLyric()
        })
    },
    loadLyric(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid})
        .done(function(ret){
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach(function(line){//此处是对歌词进行拆分，这里的歌词是时间和歌词混合在一起的列表形式
                var times = line.match(/\d{2}:\d{2}/g)
                var str = line.replace(/\[.+?]/g,'')
                if(Array.isArray(times)){ //如果得到的times是一个数组就进行数组列表的重新安排
                    times.forEach(function(time){
                        lyricObj[time] = str
                    })
                }
            })
            _this.lyricObj = lyricObj
        })
    },
    setMusic(){
        this.audio.src = this.song.url//只要设置这一个就可以进行播放音乐了，已经成功读取音乐资源
        //以下就是设置点击对应的音乐之后就改变对应的详细信息
        $('.bg').css('background-image','url('+this.song.picture+')')
        this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
        this.$container.find('.detail h1').text(this.song.title)
        this.$container.find('.detail .author').text(this.song.artist)
        this.$container.find('.detail .tag').text(this.channelName)
        var html = ''
        html = '<use xlink:href="#icon-ai07"></use>'
        this.$container.find('.btn-play').html(html)//这三段是为了解决点击新的歌曲或者下一曲的时候停止和播放转换之间的bug
        
    },
    updataStatus(){//这个状态主要是为了能计算好时间的变化
        var min = Math.floor(this.audio.currentTime/60)//得到分钟，用当前时间的长度去除以60得到分钟
        var second = Math.floor(Fm.audio.currentTime%60)+''//将当前时间对60取余数，将得到秒，转换为字符串
        second = second.length ===2?second:'0'+second//对得到的秒的字符串进行识别，如果是两位，就保持不变，如果是一位，就在这一个数字前面加1
        this.$container.find('.current-time').text(min+':'+second)//将得到的时间，放到时间显示部分去，这里显示的内容中分和秒用分号隔开
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100+'%')
        //此处设置的是进度条的变化，进度条的变化主要是根据当前时间占总的时间的百分比
        var line = this.lyricObj['0'+min+':'+second]
        if(line){//将得到的歌词显示在对应的显示区域，这个时候所有的歌词都放在了lyricObj数组中了
            this.$container.find('.lyric p').text(line).boomText()
        }
    }
}

$.fn.boomText = function(type){
    type = type || 'rollIn'
    this.html(function(){
      var arr = $(this).text()
      .split('').map(function(word){
          return '<span class="boomText">'+ word + '</span>'
      })
      return arr.join('')
    })
    
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
        $boomTexts.eq(index).addClass('animated ' + type)
        index++
        if(index >= $boomTexts.length){
        clearInterval(clock)
        }
    }, 400)
} 
Footer.init()
Fm.init()