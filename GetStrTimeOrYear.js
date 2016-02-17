    module.exports = function(mode){ // 'date' または 'time'
        
        var date = new Date();
        
        if(mode == undefined){
            console.error('getStringTime needs argument');
        }else if(mode == 'time'){

            var hour = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds(),
                milliseconds = date.getMilliseconds()
            ;
                    
            if(hour < 10) hour = '0' + hour;
            if(minutes < 10) minutes = '0' + minutes; 
            if(seconds < 10) seconds = '0' + seconds;
            if(milliseconds < 10){
                milliseconds = '000' + milliseconds;
            }else if (milliseconds < 100){
                milliseconds = '00' + milliseconds;
            }else if (milliseconds < 1000){
                milliseconds = '0' + milliseconds;
            }

            return String() + hour + '-' + minutes + '-' + seconds + '-' + milliseconds;
        }else if(mode == 'date'){
            var month = date.getMonth()+1,
                day = date.getDate(),
                year = date.getFullYear()
            ;
            return String() + year + '-' + month + '-' + day;
        }
    };