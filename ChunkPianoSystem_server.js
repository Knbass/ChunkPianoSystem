
var ChunkPianoSystem_server = function(){
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    var constructor, readIoiFile, getIoiMaxMin, 
        getStrTimeOrYear = require('./GetStrTimeOrYear'), 
        getChunkDataJsonList,
        initHttpAndSocketIo,
        splitedIoi = [],
        fs = require('fs'),
        http = require('http'),
        socketIo = require('socket.io'), 
        io
    ;
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    initHttpAndSocketIo = function(){
        
        var httpServer, onHttpRequest;

        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        onHttpRequest = function(req, res){
                        
            var extension;
            
            // console.log(req.url);
            // res.writeHead(200, {'Content-type':'text/plain'});
            // res.end('hello http server!\n');
            
            // req.url から拡張子を抽出
            extension = String() + req.url;
            extension = extension.split('.');
            extension = extension[extension.length-1];
            // console.log(extension);
            
            switch(extension){
                case 'js':
                    res.writeHead(200, {'Content-Type':'text/javascript'});
                    data = fs.readFileSync('./' + req.url, 'utf-8');
                    res.end(data);
                    break;
                case 'css':
                    res.writeHead(200, {'Content-Type':'text/css'});
                    data = fs.readFileSync('./' + req.url, 'utf-8');
                    res.end(data);
                    break;
                case 'png':
                    // How to serve an image using nodejs
                    // http://stackoverflow.com/questions/5823722/how-to-serve-an-image-using-nodejs
                    res.writeHead(200, {'Content-Type':'image/png'});
                    data = fs.readFileSync('./' + req.url); // png なので utf-8 で読み込んではいけない．
                    res.end(data, 'binary');
                    break;
                //default:
                case '/':
                    res.writeHead(200, {'Content-Type':'text/html'});
                    data = fs.readFileSync('./ChunkPianoSystem.html', 'utf-8');
                    res.end(data);
                    break;
            }
        };
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        httpServer = http.createServer(onHttpRequest).listen(process.env.PORT || 3003); // for heroku deployment
        // httpServer = http.createServer(onHttpRequest).listen(3003, '127.0.0.1');
        
        // socket.io の初期化
        io = socketIo.listen(httpServer);
        
        io.sockets.on('connection', function(socket){

            socket.on('conected', function(data){
                console.log('server connected.');
                // console.log(data);
            });
            
            socket.on('chunkSaveReq', function(data){ // data は chunkDataObj
                
                var fileName = '';
                
                fileName = String() + './ChunkData/ChunkPianoData_' + data.chunkDataObj.userName + '_' + 
                           getStrTimeOrYear('date') + '_' + getStrTimeOrYear('time') + 
                           '_practiceDay-' + data.chunkDataObj.practiceDay + '.json'
                ;
                
                data.chunkDataObj = JSON.stringify(data.chunkDataObj); // chunkDataObj を JSONに変換
                
                fs.writeFile(fileName, data.chunkDataObj, function(err){
                   if(err){
                       console.log(err);
                       socket.emit('chunkDataSaveRes',{
                           status: 'error', // status は success, error, sameFileExist
                           message: 'チャンクデータの保存に\n失敗しました...'
                       });
                   }else{
                       // todo: 既に同じファイル名が存在する時の確認処理を追加
                       // todo: クライアントに保存を完了した旨の通知を行う
                       
                       socket.emit('chunkDataSaveRes',{
                           status: 'success', // status は success, error, sameFileExist
                           message: 'チャンクデータの保存を\n完了しました!'
                       });
                   }
                });
            });
            
            socket.on('chunkFileNameReq', function(data){
                
                getChunkDataJsonList('./ChunkData/', function(fileNameList, err){
                    if(err){
                        
                    }else{
                        // todo: 保存しているファイルがない場合の処理を追加
                        socket.emit('chunkFileNameList',{
                            status: 'success', // status は success, error, sameFileExist
                            message: 'チャンクデータの保存を\n完了しました!',
                            fileNameList:fileNameList
                        });
                    }
                });
            });
            
            socket.on('chunkDataReq', function(data){
                var reqestedChunkData;
                
                try{
                    reqestedChunkData = fs.readFileSync('./ChunkData/' + data.requestChunkDataFileName, 'utf-8');
                    socket.emit('reqestedChunkData',{
                        status: 'success', // status は success, error, sameFileExist
                        message: 'チャンクデータの読み込みを\n完了しました!!',
                        reqestedChunkData:reqestedChunkData
                    });
                }catch(e){
                    console.log(e);
                    socket.emit('reqestedChunkData',{
                        status: 'error', // status は success, error, sameFileExist
                        message: 'チャンクデータの読み込みに\n失敗しました...'
                    });
                }
            });
            // io.sockets.emit では自分以外の全員に emit してしまう... 
            // 参考: http://www.tettori.net/post/852/ , http://blog.choilabo.com/20120320/31
            // io.sockets.emit  　→ 自分を含む全員にデータを送信する.
            // socket.broadcast.emit　→ 自分以外の全員にデータを送信する.
            // socket.emit　      → 自分のみにデータを送信する. socket.emit であることに注意!
        });
    };
    
    // 指定フォルダのファイル一覧を取得... http://blog.panicblanket.com/archives/2465
    // readdir は非同期実行なので次処理は callback で渡す．
    getChunkDataJsonList = function(directryPathGCDJL, callback){
        
        fs.readdir(directryPathGCDJL, function(err, files){    
            try{
            
                if (err) throw err;

                var chunkDataJsonList = [];

                files.forEach(function (file){
                    chunkDataJsonList.push(file);
                });

                // json 拡張子以外のファイルをファイル名リストから削除
                for (var i in chunkDataJsonList){

                    var substrString;

                    // 文字列を末尾から指定分切り抜く... https://syncer.jp/javascript-reverse-reference/how-to-use-substr
                    substrString = chunkDataJsonList[i].substr( (chunkDataJsonList[i].length - 4) , (chunkDataJsonList[i].length - 1) );

                    // 指定位置の要素を削除... https://syncer.jp/javascript-reverse-reference/array-remove
                    if(substrString != 'json'){
                        chunkDataJsonList.splice( i , 1 ) ; // i 番目の要素のみを配列から削除
                    }
                }
                
                callback(chunkDataJsonList);
            }catch(e){
                callback(chunkDataJsonList, e);
            }
        });
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // todo: ioi などの打鍵データを処理するモジュールを分離．
    readIoiFile = function(fileName){        
        var ioi;

        ioi = fs.readFileSync('./files/' + fileName, 'utf-8');
        splitedIoi = ioi.split('\n');
        for(var i in splitedIoi){
           splitedIoi[i] = parseInt(splitedIoi[i], 10);
        }
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    getIoiMaxMin = function(callback){
        try{
            var ioiMax = 0,
                ioiMin = 0
            ;
            // 比較する初期値として splitedIoi の先頭要素を代入
            ioiMax = splitedIoi[0]; 
            ioiMin = splitedIoi[0];

            for(var i in splitedIoi){

                // 最大値を抽出
                if(ioiMax < splitedIoi[i]){
                    ioiMax = splitedIoi[i];
                }
                // 最小値を抽出
                if(ioiMin > splitedIoi[i]){
                    ioiMin = splitedIoi[i];
                }            
            }
            
            if(ioiMax == undefined || ioiMin == undefined){
                throw new Error('readIoiFile を先に実行すべし');
            }

            callback({ioiMax: ioiMax, ioiMin: ioiMin}); // callback の実体は main 関数の getIoiMaxMin 引数に与えた無名関数
            
        }catch(e){ // もしエラーを検出したら: e はただの変数名
            console.log(e);
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    constructor = function(){
        initHttpAndSocketIo();
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    return {constructor:constructor, readIoiFile:readIoiFile, getIoiMaxMin:getIoiMaxMin};
};
///////////////////////////////////////////////
/////////////////////////////////////////////// 
///////////////////////////////////////////////
/////////////////////////////////////////////// 
///////////////////////////////////////////////
(function main(){
    
    var hhs = ChunkPianoSystem_server(), 
        ioiMaxMin
    ;
    
    hhs.constructor();
    // hhs.readIoiFile('ioi.txt');
    // hhs.getIoiMaxMin(function(ioiMaxMinObj){ // ioiMaxMinObj には getIoiMaxMin 関数から与えられた引数が格納されている
       // console.log(ioiMaxMinObj);
    // });
})();

