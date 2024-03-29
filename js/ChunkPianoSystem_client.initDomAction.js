ChunkPianoSystem_client.initDomAction = function(globalMemCPSCIDA){    
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var initDomAction, setPlayPosition, 
        playPosition = $('#playPosition') // このDOMは複数メソッドで利用するため global に宣言．
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    
    initDomAction = function(callback){
        
        var clientAuthorizer = ChunkPianoSystem_client.authorizeProcessor(globalMemCPSCIDA).clientAuthorizer,
            // todo: clientAuthorizer は globalObj のごく一部しか利用しないので，必要プロパティのみを渡すだけでも良いかもしれない．
            saveChunkButton = $('#saveChunkButton'),
            loadChunkButton = $('#loadChunkButton'),
            displayTexitButton = $('#displayTexitButton'),
            alertText = $('.textInput#alertText'),
            textArea = $('#textArea'),
            practicePointModeSelector = $('#practicePointModeSelector'),
            chunkModeSelector = $('#chunkModeSelector'),
            practicePointMode = $('#practicePointModeSelector option:selected').val(),
            leftPositionButton = $('#leftPositionButton'),
            rightPositionButton = $('#rightPositionButton'),
            isChunkDrawing = false,
            chunkDrawingAreaMouseDowmPosX = 0,
            chunkDrawingAreaMouseDowmPosY = 0,
            saveConfirmModalWindow,
            rejectChunkPracticeMode
        ;
        globalMemCPSCIDA.nowChunkMode = String() + $('#chunkModeSelector option:selected').val();        
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // ユーザ認証モジュール ChunkPianoSystem_client.authorizeProcessorの実行
        if(globalMemCPSCIDA.isAuthorize) clientAuthorizer();
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////        
        // 演奏位置初期化処理
        // noteLinePosition を受け取ってから処理をしなければならないため，
        // callback を利用し サーバから noteLinePosition を受け取ってから下記の処理を行う．
        // todo: 実行順序の管理が大変になってきた... スマートな解決策はないか? 
        globalMemCPSCIDA.reqNoteLinePosition(function(){      
            globalMemCPSCIDA.nowNoteRowCount = 0;
            setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[0].axisX, 
                            globalMemCPSCIDA.noteLinePosition.noteLine[0].axisY
                           )
            ;    
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        saveConfirmModalWindow = function(callback){
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
            }, function (isConfirm){
                if(isConfirm){ // 保存する をクリックした場合
                    // saveChunkButton をクリックすれば．保存モードに移行できる．
                    //
                    globalMemCPSCIDA.isFromLoadChunkButton = true;
                    saveChunkButton.click(); 
                }else{            
                    globalMemCPSCIDA.turnNotEditedMode();
                    // 保存しない をユーザが選択した場合は，意図的に編集モードを未編集に変更し，
                    // loadChunkButton click イベントを再度呼び出す．
                    if(callback) callback();
                }
            });
        };
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // Chunk 描画処理．mousedown 時に描画開始位置を取得し，mouseup 時に描画終了位置を取得する．
        globalMemCPSCIDA.chunkDrawingArea.mousedown(function(e){
            chunkDrawingAreaMouseDowmPosX = parseInt(e.offsetX, 10);
            chunkDrawingAreaMouseDowmPosY = parseInt(e.offsetY, 10);
            isChunkDrawing = true;
        });
        ///////////////////////////////////////////////
        /////////////////////////////////////////////// 
        globalMemCPSCIDA.chunkDrawingArea.mouseup(function(e){

            if(isChunkDrawing){
                var chunkSizeX = 0,
                    chunkSizeY = 0,
                    chunkProperties = {}
                ;        

                chunkSizeX = parseInt(e.offsetX, 10) - chunkDrawingAreaMouseDowmPosX;
                chunkSizeY = parseInt(e.offsetY, 10) - chunkDrawingAreaMouseDowmPosY;

                // todo: globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] (chunkDomRenderer), chunkPropaties (initDomAction) など，
                //       同じ情報もしくはその拡張を複数箇所で定義しており，バグを生みやすい状況にある．
                //       object の ファクトリ関数を定義し，最初から全てのプロパティを定義し，サブクラスでプロパティを拡張しないようにする．
                //       現状ではオブジェクトプロパティを確認するにはプログラムを実行する必要があり，メンテナンス性が低い!!!
                chunkProperties = {
                    left       : chunkDrawingAreaMouseDowmPosX,
                    top        : chunkDrawingAreaMouseDowmPosY,
                    width      : chunkSizeX,
                    height     : chunkSizeY,
                    chunkType  : globalMemCPSCIDA.nowChunkMode,
                    parentChunk: null
                };

                globalMemCPSCIDA.chunkDomRenderer.createChunkDom(chunkProperties);

                globalMemCPSCIDA.isEditedByNewChunk = true;
                isChunkDrawing = false;
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        saveChunkButton.click(function(mode){

            if(Object.keys(globalMemCPSCIDA.chunkDataObj.chunkData).length == 0){ // chunk が一つも描画されていない時は保存処理を行わない．
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
                            globalMemCPSCIDA.chunkDataObj.practiceDay = practiceDay;
                            globalMemCPSCIDA.socketIo.emit('chunkSaveReq', {chunkDataObj:globalMemCPSCIDA.chunkDataObj});                            
                        }else{
                            swal.showInputError('半角数字で練習日を入力してください．');
                        }
                    }
                    
                    // swal 標準 input を無効化．
                    ChunkPianoSystem_client.swalUtil.removeSwalInput();
                };

                swalPromptOptionForPracDayProp = {
                    title: '今日は何日目の練習日ですか?',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!!
                    animation: 'slide-from-top',
                    inputPlaceholder: '半角数字で練習日を入力してください．'                    
                };

                // removeSwalInput で無効化された swal 標準 input を有効化した後，
                // 練習日数入力用 swal を表示．
                ChunkPianoSystem_client.swalUtil.restoreSwalInput();
                swal(swalPromptOptionForPracDayProp, practiceDayChecker);                
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        rejectChunkPracticeMode = function(){
            swal('チャンクで頭出しするには\nチャンクを1つ以上記入する\n必要があります...', '', 'warning');
            practicePointMode = 'notePosition';
            practicePointModeSelector.val('notePosition');
            globalMemCPSCIDA.nowNoteRowCount = 0;
            setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                            globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                           )
            ;  
        };      
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        chunkModeSelector.change(function(){
            globalMemCPSCIDA.nowChunkMode =  $('#chunkModeSelector option:selected').val();
            // console.log('nowChunkMode: ' + globalMemCPSCIDA.nowChunkMode);
        }); 
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        practicePointModeSelector.change(function(){
            
            practicePointMode = $('#practicePointModeSelector option:selected').val();
            
            if(practicePointMode == 'chunk'){
                // chunk モードにもかかわらず chunk の頭出し位置が1つもない，つまりチャンクが描画されていない際は chunkMode を拒否．
                if(globalMemCPSCIDA.chunkHeadLinePositions.length == 0){
                    rejectChunkPracticeMode();
                }else{
                    // 上記条件に合致しない場合は 1つめの chunk の頭出し位置に演奏位置を設定．
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[0];
                    setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.chunkHeadLinePositions[0]].axisX, 
                                    globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.chunkHeadLinePositions[0]].axisY
                                   )
                    ;  
                    
                }
            // 音符列で演奏位置を変更するモードの際は，初期位置は譜面の先頭列とする．
            }else if(practicePointMode == 'notePosition'){
                globalMemCPSCIDA.nowNoteRowCount = 0;
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[0].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[0].axisY
                               )
                ;  
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        leftPositionButton.click(function(){
            
            var isRejectChunkPractice = false;
            
            if(practicePointMode == 'notePosition'){ // 音符列で演奏位置を変更するモードの場合
                if(globalMemCPSCIDA.nowNoteRowCount == 0){
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.noteLinePosition.noteLine.length - 1;
                }else{
                    globalMemCPSCIDA.nowNoteRowCount--;                
                }          
            }else if(practicePointMode == 'chunk'){ // チャンク先頭位置で演奏位置を変更するモードの場合
                
                var chunkHeadLinePositionsNowIndex = globalMemCPSCIDA.chunkHeadLinePositions.indexOf(globalMemCPSCIDA.nowNoteRowCount);                
                
                // 譜面の先頭音符列で leftPositionButton を押された場合は，それ以上左の音符列はないのでチャンク頭出し位置格納配列の末尾の位置に演奏位置を移動する．
                if(chunkHeadLinePositionsNowIndex == 0){
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[globalMemCPSCIDA.chunkHeadLinePositions.length-1];
                // 現在の音符列番号がチャンク頭出し位置格納配列に存在しない場合において，そもそもチャンク頭出し位置格納配列がからの場合は
                // チャンク頭出しモードを拒否する．
                // そうでない場合はチャンク頭出し位置格納配列の先頭の位置に演奏位置を移動．
                // todo: 演奏位置音符列から直近のチャンク頭出し位置を検索するように変更．
                }else if(chunkHeadLinePositionsNowIndex == -1){
                    if(globalMemCPSCIDA.chunkHeadLinePositions.length >0){
                        globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[0];
                    }else{
                        rejectChunkPracticeMode();
                        isRejectChunkPractice = true;
                    }
                // チャンク頭出しモード かつ 演奏中の音符列が譜面の先頭音符列でない場合はチャンク頭出し位置を1つ左に移動する．
                }else{
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[chunkHeadLinePositionsNowIndex-1];
                }
            }
            // チャンクモードを拒否するのはチャンク頭出し位置を格納する配列が空の時であるため，以下の処理はバグる．
            // そのため，rejectChunkPractice を実行した際は以下の処理はスキップする．
            if(!isRejectChunkPractice){ 
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                               )
                ; 
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        rightPositionButton.click(function(){
            
            var isRejectChunkPractice = false;
            
            if(practicePointMode == 'notePosition'){
               
                if(globalMemCPSCIDA.nowNoteRowCount == globalMemCPSCIDA.noteLinePosition.noteLine.length - 1){
                    globalMemCPSCIDA.nowNoteRowCount = 0;
                }else{
                    globalMemCPSCIDA.nowNoteRowCount++;                
                }
            }else if(practicePointMode == 'chunk'){
            
                var chunkHeadLinePositionsNowIndex = globalMemCPSCIDA.chunkHeadLinePositions.indexOf(globalMemCPSCIDA.nowNoteRowCount);
                   
                if(chunkHeadLinePositionsNowIndex == -1 && globalMemCPSCIDA.chunkHeadLinePositions.length == 0){
                    rejectChunkPracticeMode();
                    isRejectChunkPractice = true;
                }else if(chunkHeadLinePositionsNowIndex == globalMemCPSCIDA.chunkHeadLinePositions.length-1){
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[0];
                }else{
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[chunkHeadLinePositionsNowIndex+1];
                }                
            }
            
            if(!isRejectChunkPractice){
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                               )
                ;  
            }
        });        
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        loadChunkButton.click(function(){
            // todo: data で userName をサーバに渡し，その userName のファイルだけを req するようにする．
            // ここではサーバに保存されている ChunkPianoData 名のリストをリクエストしているだけ．
            // リストがレスポンスされた際の処理は globalMemCPSCIDA.socketIo.on の 'chunkFileNameList' 
            // !!!! 保存データの描画処理は globalMemCPSCIDA.socketIo.on の reqestedChunkData に記述されている !!!!

            // chank が編集された際の処理
            // 編集の定義... chank が動かされた，削除された，記入された とき．
            if(globalMemCPSCIDA.isEditedByChunkMovingOrDelete || globalMemCPSCIDA.isEditedByNewChunk || globalMemCPSCIDA.isEditedByAnnotation){ 
                saveConfirmModalWindow(function(){
                    loadChunkButton.click();
                });
            }else{
                
                // ファイル名リスト取得まで時間がかかる場合があるので，読み込み中を通知するモーダルウィンドウを表示．
                // ファイル名リストが取得されると自動で閉じられる．
                ChunkPianoSystem_client.swalUtil.createAutoLoaderSwalWindow({
                    title: 'ファイルリストを\n取得しています...',
                    text : '',
                    type : 'info',
                    showCancelButton   : false,
                    closeOnConfirm     : false,
                    showLoaderOnConfirm: true,
                }, function(){
                    // この callback は loader の表示が完了した際に実行される．
                    // todo: chunkFileName がレスポンスされた際の処理を client.js からここに移す．
                    //       callback を利用して実現．                        
                    globalMemCPSCIDA.socketIo.emit('chunkFileNameReq',{});
                });
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        if(callback) callback();        
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    
    setPlayPosition = function(left, top){
        var playPositionHeight = parseInt(playPosition.css('height'), 10),
            playPositionWidth = parseInt(playPosition.css('width'), 10)
        ;
        
        playPosition.css({
            'top' : (top  - (playPositionHeight / 2)),
            'left': (left - (playPositionWidth  / 2))
        });
    };
    
    return {initDomAction:initDomAction};
};