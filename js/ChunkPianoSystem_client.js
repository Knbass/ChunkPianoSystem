var ChunkPianoSystem_client = function(){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var constructor, initSocketIo,
        resetChunkDrawingAreaAndChunkData, turnNotEditedMode,
        // 複数のクラスで利用するメンバはこの globalMem オブジェクトに定義し，インスタンス生成時に引数として渡す.
        // しかしこれはベストプラクティスではないような...
        // Java のように this でメンバを渡せるようにできないか?
        globalMem = { // 複数のクラスで利用するメンバ/メソッドはここで定義すること
            chunkDrawingArea:$('#chunkDrawingArea'),
            annotationTextFlame:$('#annotationTextFlame'), // todo: このメンバは annotationRenderer でしか使わない場合は annotationRenderer に単独で与える．
            isAuthorize:true, // 初期状態で認証を有効化するか/しないか．todo: 実運用時は false を選択できないようにすること．
            socketIo:null,
            reqNoteLinePosition:null,
            reqAuthorization:null,
            reqAnnotationHint:null,
            turnNotEditedMode:null, // 後方参照ができないので，一旦 null を代入し，クラス内メンバの宣言が終わってからメンバを代入
            chunkDomRenderer:null,
            isFromLoadChunkButton:false,
            isEditedByChunkMovingOrDelete:false, 
            isEditedByNewChunk:false,
            isEditedByAnnotation:false,
            noteLinePosition:null,
            chunkHeadLinePositions:[], // チャンクによる頭出し位置を昇順ソートして格納．チャンクの移動が生じる度にソートしなおす．
            nowNoteRowCount:0,
            nowChunkMode:null, 
            chunkDataObj:{
                userName:null,
                chunkData:{},
                practiceDay:null
            },
            patternChunkCount:0,
            phraseChunkCount:0,
            hardChunkCount:0,
            summaryChunkCount:0,
            annotationDomRenderer:null,
            annotationHintDomRenderer:null
        }, 
        // todo: ステートレスなクラスメソッドは chunkDomRenderer = ChunkPianoSystem_client.chunkDomRenderer(globalMem)
        //       などと宣言し，chunkDomRenderer.createChunkDom(); と実行するように変更．名前空間の汚染を防ぐ．
        // !!! グローバルメンバを宣言してからサブクラスのインスタンス化を行う
        initDomAction =  ChunkPianoSystem_client.initDomAction(globalMem).initDomAction
    ;
    // 以下は globalMem を初期値として与えるため，globalMem オブジェクトを宣言した後に値を設定する．
    globalMem.chunkDomRenderer = ChunkPianoSystem_client.chunkDomRenderer(globalMem);
    globalMem.annotationDomRenderer = ChunkPianoSystem_client.annotationDomRenderer(globalMem); // annotationTextFlame を取得した後に実行すること．
    globalMem.annotationHintDomRenderer = ChunkPianoSystem_client.annotationHintDomRenderer(globalMem);
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // このメソッドは chunkDataObj の chunkData のみを初期化する
    // チャンクのカウントもリセットするので注意...
    resetChunkDrawingAreaAndChunkData = function(){
        globalMem.chunkDataObj.chunkData = {};
        globalMem.patternChunkCount = 0;
        globalMem.phraseChunkCount = 0;
        globalMem.hardChunkCount = 0;
        globalMem.chunkDrawingArea.empty();
        globalMem.annotationTextFlame.empty();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // turnNotEditedMode はクラスにして編集状態の変更をメソッドで実行するようにする
    globalMem.turnNotEditedMode = function(){                        
        globalMem.isEditedByChunkMovingOrDelete = false;
        globalMem.isEditedByNewChunk = false;
        globalMem.isEditedByAnnotation = false;
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    initSocketIo = function(callback){
        
        var reqNoteLinePositionCallback = null, 
            reqAnnotationHintCallback   = null,
            reqAuthorizationCallback    = null
        ;
        // globalMem.socketIo = io.connect('http://127.0.0.1:3001');
        globalMem.socketIo = io.connect();
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // noteLinePosition が正しく受信されていない場合に chunkDomRenderer クラスは 再受信のために reqNoteLinePosition を呼び出す．
        // そのため, reqNoteLinePosition を globalMem に追加した．
        // このメソッドは必ず即時実行すること (忘れてもバックアップがあるけども)．
        (globalMem.reqNoteLinePosition = function(callback){
            globalMem.socketIo.emit('reqNoteLinePosition', {data:0});
            //  noteLinePosition 再受信の再，chunkDomRenderer クラスは noteLinePosition の受信が完了してから
            //  dom rendering を行う必要がある．
            //  そのため，callback で処理を受け取り，initSocketIo スコープ変数 reqNoteLinePositionCallback を経由し
            //  noteLinePosition の socket on 時にこれを実行．
            if(callback){reqNoteLinePositionCallback = callback;}
        })();
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('noteLinePosition', function(data){ 
            globalMem.noteLinePosition = data.noteLinePosition;
            if(reqNoteLinePositionCallback != null){
                reqNoteLinePositionCallback();
                reqNoteLinePositionCallback = null; // これを行わなければ reqNoteLinePositionCallback が null でも実行されバグる．
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // 認証用ユーザ名，パスワード送信用メソッド．
        // initDomAction モジュールの認証処理用 swal から呼び出される.
        // authorizationUserData は {'userName':'KensukeS', 'userPassword':'12345'} といった形式となっている．
        globalMem.reqAuthorization = function(authorizationUserData, callback){ 
            // chunkData はユーザがクリックしたhintボタンと関連する chunk の chunkData. 
            globalMem.socketIo.emit('authorizationreq', authorizationUserData);
            if(callback){ reqAuthorizationCallback = callback }
        };        
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // サーバから認証結果を受け取った際の処理．
        globalMem.socketIo.on('authorizationResult', function(data){
            if(reqAuthorizationCallback) reqAuthorizationCallback(data);
        }); 
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.reqAnnotationHint = function(chunkDataRAH, annotationHintSearchOptionRAH, callback){ 
            // chunkData はユーザがクリックしたhintボタンと関連する chunk の chunkData. 
            globalMem.socketIo.emit('annotationHintReq', {chunkData:chunkDataRAH, annotationHintSearchOption:annotationHintSearchOptionRAH});
            if(callback){reqAnnotationHintCallback = callback;}
        };
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('annotationHint', function(data){ // ユーザが hint ボタンを押下し要求した annotation hint が返却された際の動作．
            if(reqAnnotationHintCallback){
                reqAnnotationHintCallback(data);
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('disconnect', function(client){  
            swal('サーバとのコネクションが\n切断されました．', '' , 'error');
	    });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('chunkDataSaveRes', function(data){
            
            var isFromLoadChunkButtonProcessing,
                WAIT_TIME = 2000
            ;
            
            isFromLoadChunkButtonProcessing = function(){
                // loadChunkButton を押し保存するを選択後，正しい練習日数を記入し保存をクリックした際に呼ばれる処理．
                if(globalMem.isFromLoadChunkButton){ 
                    // todo: 通信エラー時に globalMem.isFromLoadChunkButton を false にできない可能性がある．
                    //       ユーザがブラウザをリロードすれば解決するが...
                    globalMem.isFromLoadChunkButton = false; // これを行わないと，保存処理を行うたびにロード処理のモーダルウィンドウも表示される
                    globalMem.socketIo.emit('chunkFileNameReq',{});
                }
            };
            
            // セーブが完了したら，編集モードを未編集にする． 
            globalMem.turnNotEditedMode();
            
            // chunkData 保存通知をサーバから受け取った後，モーダルウィンドウは WAIT_TIME msec 表示される．
            // その後，500 msec 秒後に  ↓ chunkLoad ボタン経由で保存を行った場合の処理 が実行される．500 msec 以下にすると正しく動作しない場合あり．
            setTimeout(isFromLoadChunkButtonProcessing, (WAIT_TIME + 500));

            swal({
                title: data.message, 
                type : data.status, 
                timer: WAIT_TIME, 
                showConfirmButton: false 
            });
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('chunkFileNameList', function(data){
            // console.log(data.fileNameList);
            
            // サーバからファイル名リストを受け取ったら，ファイル名リスト選択 UI を select タグで作成．
            var pullDownMenuTemplate = '<select class="pullDownMenu" id="chunkDataSelectMenu">';
            
            // todo: プルダウンメニューに ChunkPianoData や .json を描画する必要は無いので，split して消去
            for(var fileNameList_i in data.fileNameList){ //  i をインデックスとして data.fileNameList の長さ分 for 文を実行
                pullDownMenuTemplate += '<option value ="' 
                                     + data.fileNameList[fileNameList_i] + '">' 
                                     + data.fileNameList[fileNameList_i] + '</option>'
                ;
            }
            
            pullDownMenuTemplate += '</select>';
            
            swal({
                title: '読み込むチャンクデータを<br>指定してください...',
                text: pullDownMenuTemplate,
                type: 'info',
                html: true,
                showCancelButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            }
            , function(){
                // setTimeout(function () {
                // 上記で生成したプルダウンメニューでユーザが選択したファイル名を取得
                var chunkDataSelectMenuVal = $('#chunkDataSelectMenu').val();
                // console.log('chunkDataSelectMenuVal: ' + chunkDataSelectMenuVal);
                globalMem.socketIo.emit('chunkDataReq',{requestChunkDataFileName:chunkDataSelectMenuVal});
                // swal.close();
                // }, 1000); // chunkDataSelectMenu DOM の描画を待つ必要があるため，1 秒待つ．
            });
            
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        globalMem.socketIo.on('reqestedChunkData', function(data){ // ロードリクエストをした chunkData がレスポンスされた時
            
            // data.reqestedChunkData にユーザが指定した ChunkData が格納されている．
            // これは stringfy (文字列化) されているので JSON.parse() で JavaScript のオブジェクトに変換する．            
            
            // ロード前にデータ構造をリセット．
            // ロードデータによるデータ構造の再生は chunkDomRenderer で描画完了後に行っていることに注意．
            resetChunkDrawingAreaAndChunkData();
            data.reqestedChunkData = JSON.parse(data.reqestedChunkData);
            
            // globalMem.chunkDomRenderer.createChunkDom メソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
            // for in 文で回し1つずつ描画する．
            for(var chunkId in data.reqestedChunkData.chunkData){
                globalMem.chunkDomRenderer.createChunkDom(data.reqestedChunkData.chunkData[chunkId]);
            }
            
            globalMem.turnNotEditedMode();
                        
            swal({
                title: data.message, 
                type:  data.status,
                timer: 1500,   
                showConfirmButton: false 
            });    
            
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        $(window).unload(function(){
        });     
        
        if(callback) callback();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    constructor = function(){
        // todo: 実行順が原因のバグが起きないか確認．
        initSocketIo(initDomAction);
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return {constructor:constructor}; // public method
};
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
$(function main(){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var cpsc = ChunkPianoSystem_client();
    cpsc.constructor();
});