var ChunkPianoSystem_client = function(){
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var constructor, initDomAction, createChunkDom, initSocketIo,
        resetChunkDrawingAreaAndChunkData, turnNotEditedMode,
        chunkDrawingArea = $('#chunkDrawingArea'), // 複数メソッドで利用するので，クラス内グローバルで宣言
        socketIo, 
        patternChunkCount = 0,
        phraseChunkCount = 0,
        hardChunkCount = 0,
        isFromLoadChunkButton = false,
        isEditedByChunkMovingOrDelete = false, 
        isEditedByNewChunk = false,
        // todo: 保存データから chunk を再描画するには 保存時に patternChunkCount も保存し，再描画時に復元しなければいけない．
        //       復元時は patternChunkCount の最大値を計算し，新しい Chunk の id を最大値よりも大きい値にする．
        domUtil = ChunkPianoSystem_client.utility(),
        chunkDataObj = {
            userName:null,
            chunkData:{},
            practiceDay:null
        }
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // このメソッドは chunkDataObj の chunkData のみを初期化する
    // チャンクのカウントもリセットするので注意... 
    resetChunkDrawingAreaAndChunkData = function(){
        chunkDataObj.chunkData = {};
        patternChunkCount = 0;
        phraseChunkCount = 0;
        hardChunkCount = 0;
        chunkDrawingArea.empty();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    turnNotEditedMode = function(){                        
        isEditedByChunkMovingOrDelete = false;
        isEditedByNewChunk = false;
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // todo: チャンクを複数に分けて描画した際の link を指定する引数 parentChunk を追加
    // このメソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
    // for in 文で回し1つずつ描画する．
    createChunkDom = function(chunkPropCCD){ 
        // Chunk のサイズが 0 の時には Chunk を描画しない．
        if((chunkPropCCD.width  != 0 && chunkPropCCD.width  != null && chunkPropCCD.width  != undefined ) ||
           (chunkPropCCD.height != 0 && chunkPropCCD.height != null && chunkPropCCD.height != undefined )
          ){
    
            var chunkDom, chunkDomId, chunkDomDelBtn; 
            
            // マウスドラッグの x 方向がマイナス方向だった時に正しく描画するための処理．
            if(chunkPropCCD.width < 0){ 
                chunkPropCCD.left += chunkPropCCD.width;
                chunkPropCCD.width = Math.abs(chunkPropCCD.width); // Math.abs() は絶対値を返す．
            }
            // マウスドラッグの y 方向がマイナス方向だった時
            if(chunkPropCCD.height < 0){ 
                chunkPropCCD.top += chunkPropCCD.height;
                chunkPropCCD.height = Math.abs(chunkPropCCD.height);
            }

            chunkDomId = String() + chunkPropCCD.chunkType + 'Chunk_' + patternChunkCount;
            chunkDom = $('<div class="chunk pattern" id="' + chunkDomId + '"></div>');

            chunkDom.css({ // jQuery で dom の css を変更するときの書法
                'top'   : chunkPropCCD.top    + 'px',
                'left'  : chunkPropCCD.left   + 'px',
                'width' : chunkPropCCD.width  + 'px',
                'height': chunkPropCCD.height + 'px'
            });

            domUtil.appendDruggAndDropEvent(chunkDom, chunkDrawingArea);
            
            chunkDomDelBtn = $('<div class="chunkDeleteButton" id="' + chunkDomId +'_DeleteButton">' + 
                                    '<p class="chunkDeleteButtonFont">×</p>' + 
                               '</div>'
                              )
            ;
            
            chunkDomDelBtn.click(function(){
                var parentChunkDom = $(this).parent(),
                    parentChunkDomId = parentChunkDom[0].id
                ;
                parentChunkDom.remove();
                // html の chunkDom の削除と同時に オブジェクトのデータ構造にも chunkDom を削除．
                delete chunkDataObj.chunkData[parentChunkDomId];
                isEditedByChunkMovingOrDelete = true;
                console.log(chunkDataObj);
            });
            
            chunkDom.mousedown(function(){
                isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
            });
            
            chunkDom.append(chunkDomDelBtn);
            // html への chunkDom の追加と同時に オブジェクトのデータ構造にも chunkDom を追加．
            chunkDataObj.chunkData[chunkDomId] = {
                left       : chunkPropCCD.left,
                top        : chunkPropCCD.top,
                width      : chunkPropCCD.width,
                height     : chunkPropCCD.height,
                chunkType  : chunkPropCCD.chunkType,
				parentChunk: null
            };
            console.log(chunkDataObj);
            
            chunkDrawingArea.append(chunkDom);

            if(chunkPropCCD.chunkType == 'pattern'){
                patternChunkCount++; // todo: phraseChunk, hardChunk 描画時のカウンティング処理を追加
            }
        }else{
            console.log('something wrong!!!');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    initSocketIo = function(){
        
        // socketIo = io.connect('http://127.0.0.1:3001');
        socketIo = io.connect();
        
        socketIo.on('connect', function () { 
            socketIo.emit('conected', {data:0});
        });
        
        socketIo.on('disconnect', function(client){            
	    });
        
        socketIo.on('chunkDataSaveRes', function(data){
            
            var isFromLoadChunkButtonProcessing,
                WAIT_TIME = 2000
            ;
            
            isFromLoadChunkButtonProcessing = function(){
                // loadChunkButton を押し，保存するを選択．正しい練習日数を記入し，保存をクリックした際に呼ばれる処理
                if(isFromLoadChunkButton){ 
                    // todo: 通信エラー時に isFromLoadChunkButton を false にできない可能性がある．
                    //       ユーザがブラウザをリロードすれば解決するが...
                    isFromLoadChunkButton = false; // これを行わないと，保存処理を行うたびにロード処理のモーダルウィンドウも表示される
                    console.error('シャブババア');
                    socketIo.emit('chunkFileNameReq',{});
                }
            };
            
            // セーブが完了したら，編集モードを未編集にする． 
            turnNotEditedMode();
            
            setTimeout(isFromLoadChunkButtonProcessing, (WAIT_TIME + 500));

            swal({   
                title: data.message, 
                type: data.status, timer: WAIT_TIME, 
                showConfirmButton: false }
                )
            ;

        });
        
        socketIo.on('chunkFileNameList', function(data){

            // console.log(data.fileNameList);
            
            var pullDownMenuTemplate = '<select class="pullDownMenu" id="chunkDataSelectMenu">'
            
            
            // todo: プルダウンメニューに ChunkPianoData や .json を描画する必要は無いので，split して消去
            for(var i in data.fileNameList){ //  i をインデックスとして data.fileNameList の長さ分 for 文を実行
                pullDownMenuTemplate += '<option value ="' + data.fileNameList[i] + '">' + data.fileNameList[i] + '</option>';
            }
            
            pullDownMenuTemplate += '</select>';
            
            swal({
                title: '読み込むチャンクデータを<br>指定してください!',
                text: pullDownMenuTemplate,
                type: 'info',
                html: true,
                showCancelButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            }, function(){
                setTimeout(function () {
                    // 上記で生成したプルダウンメニューでユーザが選択したファイル名を取得
                    var chunkDataSelectMenuVal = $('#chunkDataSelectMenu').val();
                    console.log('chunkDataSelectMenuVal: ' + chunkDataSelectMenuVal);
                    
                    socketIo.emit('chunkDataReq',{requestChunkDataFileName:chunkDataSelectMenuVal});
                    // swal.close();
                }, 1000); // chunkDataSelectMenu DOM の描画を待つ必要があるため，1.5 秒待つ．
            }); 
            
        });
        
        socketIo.on('reqestedChunkData', function(data){ // ロードリクエストをした chunkData がレスポンスされた時
            
            // data.reqestedChunkData にユーザが指定した ChunkData が格納されている．
            // これは stringfy (文字列化) されているので JSON.parse() で JavaScript のオブジェクトに変換する．
            
            resetChunkDrawingAreaAndChunkData();
            data.reqestedChunkData = JSON.parse(data.reqestedChunkData);
            
            // createChunkDom メソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
            // for in 文で回し1つずつ描画する．
            for(var chunkId in data.reqestedChunkData.chunkData){
                createChunkDom(data.reqestedChunkData.chunkData[chunkId]);
            }
            
            turnNotEditedMode();
            
            // 解決済todo: 保存データから chunk を再描画するには 保存時に patternChunkCount も保存し，再描画時に復元しなければいけない．
            //       復元時は patternChunkCount の最大値を計算し，新しい Chunk の id を最大値よりも大きい値にする．
            // !!!! ロードしたチャンクは createChunkDom で描画した際に chunkDataObj に格納される．
            // ChunkData のロード時に createChunkDom によって，chunkData に格納されている順番で id が再度付与されている
            // そのため，上記 todo の作業は必要なし
            // データロード後，チャンクの位置を変えずデータを上書きした場合は，チャンクの情報は変わらずに，id のみが再度付与される．
            // 
            // 動作例... 
            //1. 新規チャンクを描画            
            //	patternChunk_0: Object
            //	patternChunk_1: Object
            //	patternChunk_2: Object
            //	patternChunk_3: Object
            //2.  patternChunk_1 を削除し，データを保存
            //3.  2 のデータをロード
            //	patternChunk_0: Object
            //	patternChunk_1: Object
            //	patternChunk_2: Object
            //	# ロード時に createChunkDom メソッドによってデータの登場順に id が再度付与される
            
            // todo: 既に Chunk が描画されている時に ChunkData をロードした際の処理を記述
            //       isChunkRenderd == true の時は ロード前に保存するのを確認し，
            //       一旦 チャンクを全て消去 ( jQuery の empty() を利用)
            //       (重要) chunkDataObj.chunkData も空にする．
            //       isChunkRenderd == false の時は 何もしなくて ok 
            
            swal(data.message, '', data.status);
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        $(window).unload(function(){
        });        
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    initDomAction = function(callback){
        var upperFrame = $('#upperFrame'),        
            saveChunkButton = $('#saveChunkButton'),
            loadChunkButton = $('#loadChunkButton'),
            displayTexitButton = $('#displayTexitButton'),
            alertText = $('.textInput#alertText'),
            textArea = $('#textArea'),
            beforeColor = '',
            isChunkDrawing = false,
            chunkDrawingAreaMouseDowmPosX = 0,
            chunkDrawingAreaMouseDowmPosY = 0,
            swalPromptOptionForUserNameProp,
            userNameSetter
        ;
                
        userNameSetter = function(userNameUNS){
            
            if(userNameUNS == '' || userNameUNS == null || userNameUNS == undefined){
                swal.showInputError('ユーザ名は必須です!');
            }else{
                chunkDataObj.userName = userNameUNS;
                swal.close();
            }
        };
        
        swalPromptOptionForUserNameProp = {
            title: 'ユーザ名を入力してください!',
            type: 'input',
            showCancelButton: false,
            closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!!
            animation: 'slide-from-top',
            inputPlaceholder: 'ここにユーザ名を入力'                    
        };

        swal(swalPromptOptionForUserNameProp, userNameSetter);   
        
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // Chunk 描画処理．mousedown 時に描画開始位置を取得し，mouseup 時に描画終了位置を取得する．
        chunkDrawingArea.mousedown(function(e){
            chunkDrawingAreaMouseDowmPosX = parseInt(e.offsetX, 10);
            chunkDrawingAreaMouseDowmPosY = parseInt(e.offsetY, 10);
            isChunkDrawing = true;
        });
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        chunkDrawingArea.mouseup(function(e){
            
            if(isChunkDrawing){
                var chunkSizeX = 0,
                    chunkSizeY = 0,
                    chunkProperties = {}
                ;        

                chunkSizeX = parseInt(e.offsetX, 10) - chunkDrawingAreaMouseDowmPosX;
                chunkSizeY = parseInt(e.offsetY, 10) - chunkDrawingAreaMouseDowmPosY;
                
                chunkProperties = {
                    left       : chunkDrawingAreaMouseDowmPosX,
                    top        : chunkDrawingAreaMouseDowmPosY,
                    width      : chunkSizeX,
                    height     : chunkSizeY,
                    chunkType  : 'pattern',
                    parentChunk: null
                };
                
                createChunkDom(chunkProperties);
                
                isEditedByNewChunk = true;
                isChunkDrawing = false;
            }
        });    
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        saveChunkButton.click(function(mode){
            
            if(Object.keys(chunkDataObj.chunkData).length == 0){ // chunk が一つも描画されていない時は保存処理を行わない
                swal('保存するにはチャンクを\n1つ以上記入してください!', '', 'warning');
            }else{
                var practiceDayChecker, swalPromptOptionForPracDayProp; 
                
                practiceDayChecker = function(practiceDay){
                    
                    if(practiceDay == 0 || practiceDay == undefined || practiceDay == null){                        
                        swal.showInputError('半角数字で練習日を入力してください．');
                    }else{
                        // 001 のように不要な 0 が含まれている数値から 0 を除去
                        practiceDay += String();
                        practiceDay.replace(new RegExp('^0+'),'');
                        practiceDay = parseInt(practiceDay, 10);
                        practiceDay += String();
                        
                        // todo: 半角英数字 + 大文字でも処理を通過するバグを修正
                        if(practiceDay.match(/^[0-9]+$/)){ // 練習日数の入力が正しい，つまり入力値が半角数字の時
                            // todo: 既に存在しているファイル名の際に，上書きするか確認. 
                            // todo: ファイルネームにメタデータをパース可能な状態で付与しているので，この処理は意味がないかもしれない．
                            chunkDataObj.practiceDay = practiceDay;

                            // todo: chunkDataObj と chunkDrawingArea をリセット
                            // 上記処理のメソッド refreshChunkDataObjAndChunkDrawingArea を作成                            
                            socketIo.emit('chunkSaveReq', {chunkDataObj:chunkDataObj});                            
                        }else{
                            swal.showInputError('半角数字で練習日を入力してください．');
                        }
                    }
                };
                
                swalPromptOptionForPracDayProp = {
                    title: '今日は何日目の練習日ですか?',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!!
                    animation: 'slide-from-top',
                    inputPlaceholder: '半角数字で練習日を入力してください．'                    
                };
                
                swal(swalPromptOptionForPracDayProp, practiceDayChecker);                
            }
        });
        
        loadChunkButton.click(function(){
            // console.log('fileLoadButton');
            
            // todo: data で userName をサーバに渡し，その userName のファイルだけを req するようにする．
            // ここではサーバに保存されている ChunkPianoData 名のリストをリクエストしているだけ．
            // リストがレスポンスされた際の処理は socketIo.on の 'chunkFileNameList' 
            // !!!! 保存データの描画処理は socketIo.on の reqestedChunkData に記述されている !!!!
                        
            // chank が編集された際の処理
            // 編集の定義... chank が動かされた，削除された，記入された とき．
            if(isEditedByChunkMovingOrDelete || isEditedByNewChunk){ 
            
                swal({
                    title: '変更を保存しますか?',
                    type: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#26642d',
                    confirmButtonText: '保存する',
                    cancelButtonColor: '#7c0c0c',
                    cancelButtonText: '保存しない',
                    closeOnConfirm: false,
                    closeOnCancel: false
                }, function (isConfirm){ // 保存する をクリックした場合
                    if(isConfirm){
                        // saveChunkButton をクリックすれば．保存モードに移行できる．
                        //
                        isFromLoadChunkButton = true;
                        saveChunkButton.click(); 
                    }else{
                        // todo: chunkDataObj と chunkDrawingArea をリセット
                        // 上記処理のメソッド refreshChunkDataObjAndChunkDrawingArea を作成
            
                        turnNotEditedMode();
                        // 保存しない をユーザが選択した場合は，意図的に編集モードを未編集に変更し，
                        // loadChunkButton click イベントを再度呼び出す．
                        loadChunkButton.click();
                    }
                });
                
                //saveChunkButton.click();
            }else{
                socketIo.emit('chunkFileNameReq',{});
            }
        });
        
        if(callback) callback();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    constructor = function(){
        initDomAction(initSocketIo);
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return {constructor:constructor}; // public method
};
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
// todo: 別の js ファイルに分離
ChunkPianoSystem_client.utility = function(){
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    var appendDruggAndDropEvent, removeDruggAndDropEvent, getElementPosition;
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    appendDruggAndDropEvent = function(elementADADE, parentElement){

        var draggableArea = parentElement,
            elementMouseOffsetX, elementMouseOffsetY,
            isOnMouse = false
        ;
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////  
        elementADADE.mousedown(function(){
            
            var elementPosition;

            isOnMouse = true; 
            
            elementPosition = getElementPosition(elementADADE);
            
            elementMouseOffsetX = event.pageX - elementPosition.offsetLeft;
            elementMouseOffsetY = event.pageY - elementPosition.offsetTop;            
        })
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////        
        draggableArea.mousemove(function(){
            if(isOnMouse){
                elementADADE.css({'left':event.pageX - elementMouseOffsetX,
                                   'top':event.pageY - elementMouseOffsetY
                                  });
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////        
        draggableArea.mouseup(function(){
            isOnMouse = false;
        });
        
    };
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    // private. 引数... 適用するエレメント
    removeDruggAndDropEvent = function(elementADADE){
        
        try{            
            elementADADE
                .unbind('mousedown')
                .unbind('mouseup')
            ;
            
        }catch(e){
        }
        
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    getElementPosition = function(elementGEO){
        
        var offset = elementGEO.offset(),
            position = elementGEO.position(),
            elementProp = {
                offsetTop:null,
                offsetLeft:null,
                positionTop:null,
                positionLeft:null,
                width:null,
                height:null
            }
        ;
        
        elementProp.offsetTop = offset.top;
        elementProp.offsetLeft = offset.left;
        elementProp.offsetTop = position.top,
        elementProp.offsetLeft = position.left,
        elementProp.width = elementGEO.width(),
        elementProp.height = elementGEO.height();
        
        return elementProp;
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    return {appendDruggAndDropEvent:appendDruggAndDropEvent, 
            removeDruggAndDropEvent:appendDruggAndDropEvent,
            getElementPosition:getElementPosition
           }
    ;
};
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
$(function main(){
    var hh = ChunkPianoSystem_client();
    hh.constructor();
});