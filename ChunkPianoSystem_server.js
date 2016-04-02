var ChunkPianoSystem_server = function(){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var constructor,
        getStrTimeOrYear = require('./myNodeModules/GetStrTimeOrYear'), // node_modules を指定せずに require する方法はないのか? 
        initHttpAndSocketIo,
        splitedIoi = [],
        scoreDataParser = require('./myNodeModules/ScoreDataParser.js')('./ScoreData/TurcoScore.json'),
        annotationHintDataBaseProcessor = require('./myNodeModules/AnnotationHintDataBaseProcessor.js'),
        userDataBaseProcessor = require('./myNodeModules/UserDataBaseProcessor.js'),
        noteLinePosition = scoreDataParser.getNoteLinePosition(),
        extendedFs = require('./myNodeModules/ExtendedFs'),
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
            var data = null, 
                extension
            ;
            
            // console.log(req.url);
            // res.writeHead(200, {'Content-type':'text/plain'});
            // res.end('hello http server!\n');
            
            // req.url から拡張子を抽出
            extension = String() + req.url;
            extension = extension.split('.');
            extension = extension[extension.length-1];
            // console.log(extension);
            
            // 多数の同時リロードに耐えるよう，非同期にファイル読込のテストを行ったが同期読込でないとダメらしい．
            // ファイルロードは sync で行わないと，先に res.end(data); が実行されてしまう!
            //      res.end(data); を callback として与えてもダメだった
            switch(extension){
                case 'js':
                    res.writeHead(200, {'Content-Type':'text/javascript'});
                    data = extendedFs.readFileSync('./' + req.url, 'utf-8');
                    res.end(data);
                    break;
                case 'css':
                    res.writeHead(200, {'Content-Type':'text/css'});
                    data = extendedFs.readFileSync('./' + req.url, 'utf-8');
                    res.end(data);
                    break;
                case 'png':
                    // How to serve an image using nodejs. 
                    // http://stackoverflow.com/questions/5823722/how-to-serve-an-image-using-nodejs
                    res.writeHead(200, {'Content-Type':'image/png'});
                    data = extendedFs.readFileSync('./' + req.url); // png なので utf-8 で読み込んではいけない．
                    res.end(data, 'binary');
                    break;
                //default:
                case '/':
                    res.writeHead(200, {'Content-Type':'text/html'});
                    data = extendedFs.readFileSync('./ChunkPianoSystem.html', 'utf-8');
                    res.end(data);
                    break;
            }
        };
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        httpServer = http.createServer(onHttpRequest).listen(process.env.PORT || 3003); // for heroku deployment
        // httpServer = http.createServer(onHttpRequest).listen(3003, '127.0.0.1');
        
        // socket.io を httpServer と関連づける (初期化)．
        io = socketIo.listen(httpServer);
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        io.sockets.on('connection', function(socket){
            ///////////////////////////////////////////////
            /////////////////////////////////////////////// 
            socket.on('reqNoteLinePosition', function(data){
                socket.emit('noteLinePosition', {noteLinePosition:noteLinePosition});
            });
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            // data には認証用ユーザ名，パスワード 例: {'userName':'KensukeS', 'userPassword':'12345'}
            // が格納されている．
            socket.on('authorizationreq', function(data){
                
                var authorizationResult = userDataBaseProcessor.authorize(data);
                
                if(authorizationResult == 'authorized'){ // 認証成功時
                    socket.emit('authorizationResult',{
                        status : 'success',
                        message: 'ようこそ，' + data.userName + ' さん!'
                    });
                }else if(authorizationResult == 'incorrectUserPassword'){ // 不正なパスワードを与えられた時
                    socket.emit('authorizationResult',{
                        status : 'error',
                        message: '不正なパスワードです．'
                    });
                }else if(authorizationResult == 'userNotExist'){ // 存在しないユーザ名を与えられた時
                    socket.emit('authorizationResult',{
                        status : 'error',
                        message: '登録されていないユーザ名です．'
                    });
                }
                
                // socket.emit('noteLinePosition', {noteLinePosition:noteLinePosition});
            });
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////             
            socket.on('chunkSaveReq', function(data){ // data は chunkDataObj
                
                var fileName = '';
                
                fileName = String() + './ChunkData/ChunkPianoData_' + data.chunkDataObj.userName + '_' + 
                           getStrTimeOrYear('date') + '_' + getStrTimeOrYear('time') + 
                           '_practiceDay-' + data.chunkDataObj.practiceDay + '.json'
                ;
                
                data.chunkDataObj = JSON.stringify(data.chunkDataObj); // chunkDataObj を JSONに変換
                
                extendedFs.writeFile(fileName, data.chunkDataObj, function(err){
                   if(err){
                       console.log(err);
                       socket.emit('chunkDataSaveRes',{
                           status : 'error', // status は success, error, sameFileExist
                           message: 'チャンクデータの保存に\n失敗しました...'
                       });
                   }else{
                       // todo: 既に同じファイル名が存在する時の確認処理を追加
                       // todo: クライアントに保存を完了した旨の通知を行う
                       
                       socket.emit('chunkDataSaveRes',{
                           status : 'success', // status は success, error, sameFileExist
                           message: 'チャンクデータの保存を\n完了しました'
                       });
                       
                       // chunkData 保存時に annotationHintDataBase も更新．
                       // todo: annotationHintDataBase の更新をクライアントにどのように送信する?
                       //       ヒントボタン が押された時でよい?
                       annotationHintDataBaseProcessor.uppdateDataBase(function(){
                           console.log('uppdateDataBase');   
                       });
                   }
                });
            });
            ///////////////////////////////////////////////
            /////////////////////////////////////////////// 
            socket.on('chunkFileNameReq', function(data){                
                extendedFs.getFileNameListAsync('./ChunkData/', 'json', function(fileNameList, isError){                    
                    if(isError){
                        socket.emit('chunkFileNameList',{
                            status : 'error',
                            message: 'チャンクデータの読み込みに失敗しました...',
                            fileNameList:fileNameList
                        });
                    }else{
                        // todo: 保存しているファイルがない場合の処理を追加
                        socket.emit('chunkFileNameList',{
                            status : 'success', // status は success, error, sameFileExist
                            fileNameList:fileNameList
                        });
                    }
                });
            });
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            socket.on('chunkDataReq', function(data){
                var reqestedChunkData;
                
                try{
                    reqestedChunkData = extendedFs.readFileSync('./ChunkData/' + data.requestChunkDataFileName, 'utf-8');
                    socket.emit('reqestedChunkData',{
                        status : 'success', // status は success, error, sameFileExist
                        message: 'チャンクデータの読み込みを\n完了しました',
                        reqestedChunkData:reqestedChunkData
                    });
                }catch(e){
                    console.log(e);
                    socket.emit('reqestedChunkData',{
                        status : 'error', // status は success, error, sameFileExist
                        message: 'チャンクデータの読み込みに\n失敗しました...'
                    });
                }
            });
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            socket.on('annotationHintReq', function(data){
                // annotationHintSearchOption は クライアントの annotationDomRenderer モジュールで設定された検索オプション．
                // 以下の形式をとる．
                /*
                    annotationHintSearchOption = { // サーバで annotationHint をサーチする際のオプション．
                        patternChunk:true, // patternChunk をサーチ対象に入れるか否か．
                        phraseChunk :true,
                        hardChunk   :true,
                        summaryChunk:true,
                        margin      :3,    // chunk の chunkMiddleLine から +- いくつまで検索対象に入れるか．
                        order       :'normal' // todo: 何を優先して検索するかを指定して検索できるようにする．normal はdbのインデックス順にそのまま返却するモード．
                    }
                */
                var searchResult = annotationHintDataBaseProcessor.search(data.chunkData, data.annotationHintSearchOption);
                // 検索中に error が発生した際は文字列 'error' が返却される．

                if(searchResult != 'error'){
                    socket.emit('annotationHint',{
                        status : 'success',
                        message: 'ヒントアノテーションを受信しました',
                        searchResult:searchResult
                    });
                }else{
                    socket.emit('annotationHint',{
                        status : 'error',
                        message: 'ヒントアノテーションの受信に失敗しました',
                        searchResult:searchResult
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
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    constructor = function(){
        /*
        // サーバ起動時に AnnotationHintDataBase を更新せずに起動する場合はこちらを有効化．
        // この場合，サーバ起動時に AnnotationHintDataBase が構成されている必要がある．
        annotationHintDataBaseProcessor.loadDataBase(function(){
            initHttpAndSocketIo();
        });
        */
        
        // サーバ起動時に AnnotationHintDataBase を更新してから起動する場合はこちらを有効化．
        // この場合，AnnotationHintDataBase が構成されていなくても実行可能．
        // サーバ負荷を気にしなくて良い場合はこちらで起動すること．
        annotationHintDataBaseProcessor.uppdateDataBase(function(){
            initHttpAndSocketIo();
        });
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    return {constructor:constructor};
};
/////////////////////////////////////////////// 
///////////////////////////////////////////////
(function main(){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var cpss = ChunkPianoSystem_server();
    cpss.constructor();    
})();

