var EventCenter = {
    on: function(type, handler){
        $(document).on(type,handler)
    },
    fire: function(type, data){
        $(document).trigger(type, data)
    }
}

var Footer = {
    init: function(){
        this.$rightBtn = $('footer .icon-right')
        this.$leftBtn = $('footer .icon-left')
        this.$box = $('footer .list')
        this.$ul = this.$box.find('ul')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.$footer = $("footer")

        this.bind()
        this.render()
    },
    bind: function(){
        var _this = this
        this.$rightBtn.on('click',function(){

            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth)
            if(!_this.isToEnd){
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-='+rowCount*itemWidth
                },400, function(){
                    // console.log(_this.$ul.css('left'))
                    _this.isAnimate = false
                    _this.isToStart = false
                    //点击到最后一页，再点击无效
                    if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))){
                        _this.isToEnd = true
                    }
                })
            }
        })
        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return

            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart){
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+='+rowCount*itemWidth

                },400, function(){
                    // console.log(_this.$ul.css('left'))
                    _this.isAnimate = false
                    _this.isToEnd = false

                    if(parseFloat(_this.$ul.css('left'))>=-2) {
                        _this.isToStart = true
                    }
                })

            }
        })
        this.$footer.on('click','li', function(){
            $(this).addClass('active')
                .siblings().removeClass('active')

            EventCenter.fire('select-albumn', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })

    },
    //获取channel数据
    render: function(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
        .done(function(ret){
            // console.log(ret.channels)
            // console.log(ret.channels.cover_small)
            _this.renderFooter(ret.channels)
        }).fail(function(){
            console.log('error')
        })
    },
    //添加footer内容
    renderFooter: function(channels){
        var _this = this
        var html =''
        channels.unshift({
            channel_id:0,
            name: 'my favorate',
            cover_small: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-small',
            cover_middle: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-middle',
            cover_big: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-big'
        })
        channels.forEach(function(channel){

            html += '<li data-channel-id='+channel.channel_id+ ' data-channel-name='+channel.name+'>'
                  + '  <div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                  + '  <h3>'+channel.name+'</h3>'
                  + '</li>'
        })
        this.$ul.html(html)
        this.setStyle()
    },
    setStyle: function(){
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        this.$ul.css({
            width: count*width + 'px'
        })
    }
}

var FM ={
    init :function(){
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()

    },
    bind: function(){
        var _this = this
        EventCenter.on('select-albumn', function(e, channel){
            // console.log("channel:" + channel["channelName"])
           _this.channelId = channel.channelId
           _this.channelName = channel.channelName
           _this.loadSong()
        })

        this.$container.find('.btn-play').on('click',function(){
            var $this = $(this)
            if($this.hasClass('icon-play')){
                $this.addClass('icon-pause').removeClass('icon-play')
                _this.audio.play()
            }else{
                $this.addClass('icon-play').removeClass('icon-pause')
                _this.audio.pause()
            }

        })

        this.$container.find('.btn-next').on('click',function(){
            _this.loadSong()
        })

        this.audio.addEventListener('play',function(){
            //点击下一首时先取消定时器，再设置新的定时器
            clearInterval(_this.update)
            _this.update = setInterval(function(){
                _this.updateState()
            },1000)
        })

        this.audio.addEventListener('pause',function(){
            clearInterval(_this.update)
        })

        this.$container.find('.area-bar .bar').on('click',function(e){
            console.log(e)
            var percent =e.offsetX/ $(this).width()
            _this.audio.currentTime = percent * _this.audio.duration
        })
    },
    //实时更新进度条，时间，歌词
    updateState: function(){
        var min = Math.floor(this.audio.currentTime/60)
        var second = Math.floor(this.audio.currentTime%60)+''
        second = second.length===2?second:'0'+second
        this.$container.find('.current-time').text(min+':'+second)

        //时间轴
        // console.log(this.audio.currentTime/this.audio.duration*100+'%')
        this.$container.find('.progress-bar').css('width',this.audio.currentTime/this.audio.duration*100+'%')

        var lyric = this.lyricObj['0'+min+':'+second]
        if(lyric){
            this.$container.find('.lyric p').text(lyric).lyricAnimate('rollIn')
        }
    },
    //获取歌曲数据
    loadSong: function(){
        var _this = this
        if(this.channelId===0){
            this.loadCollection()
        }else{
            $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php', {channel: _this.channelId})
            .done(function(ret){
                console.log(ret)
                _this.play(ret.song[0]||null)
            })
        }
    },
    loadCollection: function(){

    },
    //更改歌曲相关信息
    play: function(song){
        console.log(song)
        this.$song = song
        this.audio.src = this.$song.url
        this.$container.find('.btn-play').addClass('icon-pause').removeClass('icon-play')
        this.$container.find('.detail h1').text(song.title)
        this.$container.find('.detail .auther').text(song.artist)
        this.$container.find('.aside figure').css('background-image', 'url('+song.picture+')')
        this.$container.find('.detail .tag').text(this.channelName)
        $('.bg').css('background-image','url('+song.picture+')')
        this.getLyrics(song.sid)
    },
    //获取歌词
    getLyrics : function(sid){
        var _this =this
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:sid})
        .done(function(ret){
            var lyricObj ={}

            ret.lyric.split('\n').forEach(function(line){
                var timeArr = line.match(/\d{2}:\d{2}/g)
                // console.log(timeArr)
                if(Array.isArray(timeArr)){
                    timeArr.forEach(function(time){
                        lyricObj[time] = line.replace(/\[.+?\]/g, ' ')
                    })
                }

            })
            _this.lyricObj = lyricObj
        })
    },
}
// 设置歌词动画
$.fn.lyricAnimate = function(type){
    type = type||'rollIn'
    this.html(function(){
        var arr = $(this).text()
        .split('').map(function(word){
            return '<span class="lyricAnimate">'+word+'</span>'
        })
        return arr.join('')
    })

    var index = 0
    var $lyricText = $(this).find('span')
    var clock = setInterval(function(){
        $lyricText.eq(index).addClass('animated '+type)
        index++
        if(index >= $lyricText.length){
            clearInterval(clock)
        }
    },300)
}
FM.init()
Footer.init()


