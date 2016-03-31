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
        
        var upperFrame = $('#upperFrame'),        
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
            beforeColor = '',
            isChunkDrawing = false,
            chunkDrawingAreaMouseDowmPosX = 0,
            chunkDrawingAreaMouseDowmPosY = 0,
            authorizationFrameTemplate,
            swalPromptOptionForUserNameProp,
            defaultUserName = null,
            defaultUserPassword = null,
            userNameSetter,
            saveConfirmModalWindow,
            rejectChunkPracticeMode,
            restoreSwalInput,
            removeSwalInput,
            myFormClassNameOnSwal = null,
            appendMyFormOnSwal, 
            removeMyFormOnSwal
        ;
        globalMemCPSCIDA.nowChunkMode = String() + $('#chunkModeSelector option:selected').val();        
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////                
        // swal の標準 input を無効化する．
        // 無効化された swal 標準 input は removeSwalInput を実行しないと有効化されないことに注意．
        // 原因は swal の css で swal モーダルウィンドウ内の input にスタイルが定義されているためと思われる．
        removeSwalInput = function(){
            $('.sweet-alert fieldset .sa-input-error, .sweet-alert fieldset input').css({
                'display':'none'
            });
        };
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////        
        // swal の標準 input を有効化する．
        // 有効化された swal 標準 input は removeSwalInput を実行しないと無効化されないことに注意．
        // 原因は swal の css で swal モーダルウィンドウ内の input にスタイルが定義されているためと思われる．
        restoreSwalInput = function(){
            $('.sweet-alert fieldset .sa-input-error,  .sweet-alert fieldset input').css({
                'display':'block'
            }); 
        };
        // todo: 独自フォーム挿入後でも swal を type:input 以外で実行すると swal 標準 input を表示しないように修正．
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // swal に独自フォームを埋め込むためのメソッド．引数 myForm は jQuery で作成した独自フォーム．
        // 独自フォームを埋め込みたい swal を実行した直後に呼び出す．
        // swal では独自 input 要素を表示できないため，.sweet-alert fieldset に jQuery で無理やり独自フォーム Myform を埋め込む．
        appendMyFormOnSwal = function(myForm){
            // myForm のクラス名が変更された際に removeMyFormOnSwal できるように，
            // myForm のクラス名を myFormClassNameOnSwal にキャッシュする．
            myFormClassNameOnSwal = myForm.prop('class');
            $('.sweet-alert fieldset').append(myForm);           
        };
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // appendMyFormOnSwal で swal に挿入された 独自フォームを削除する．
        removeMyFormOnSwal = function(){
            if(myFormClassNameOnSwal != null){
                $('.' + myFormClassNameOnSwal).remove();
                myFormClassNameOnSwal = null;
            }
        };
        // ユーザ認証処理．
        // ユーザ認証用フォームを生成．
        (function authorizationFrameTemplateGenerator(){
            var authorizationFrame = $('<div class="authorizationFrame"></div>'),
                userNameInput = $('<input type="text" id="userNameInput" maxlength="30" placeholder="ユーザ名"/>'),
                br = $('<br>'),
                userPasswordInput = $('<input type="password" id="userPasswordInput" maxlength="30" placeholder="パスワード"/>')
            ;
            
            // 一度 userName, userPassword を入力している場合, 次回以降は localStorage に保存されている. 
            // userName，userPassword をデフォルトで入力する．
            try{
                defaultUserName = localStorage.getItem('chunkPianoSystem_userName');
                defaultUserPassword = localStorage.getItem('chunkPianoSystem_userPassword');
                
                if(defaultUserName == null || defaultUserName == undefined){
                    defaultUserName = '';
                }
                if(defaultUserPassword == null || defaultUserPassword == undefined){
                    defaultUserPassword = '';
                }
                
                userNameInput.val(defaultUserName);
                userPasswordInput.val(defaultUserPassword);
                
            }catch(e){
                console.log(e);
            }
            
            authorizationFrame.append(userNameInput)    
                              .append(br)
                              .append(userPasswordInput)
            ;
            
            authorizationFrameTemplate = authorizationFrame;
        })();
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // ユーザ認証処理．
        swal({
            title: 'ユーザ認証',
            text : '',
            type : 'input',
            allowEscapeKey   :false,
            showCancelButton : true,            
            confirmButtonText: 'ログイン',   
            cancelButtonText : '新規アカウント作成',
            closeOnConfirm   : false,   
            closeOnCancel    : false,
            showLoaderOnConfirm: true,
        }
        , function(isCreateNewAccount){ 

            var userNameInputVal     = String() + $('#userNameInput').val(),
                userPasswordInputVal = String() + $('#userPasswordInput').val()
            ;            
            // todo: swal input では isCreateNewAccount を正しく受け取れていない．
            //       そのため，新規アカウント作成，ログインボタンのどちらをクリックしても認証処理が行われてしまう．
            //       このバグを修正すること．
            if(!isCreateNewAccount){ // ユーザがログインボタンをクリックした時の処理．
                // ユーザ名，パスワードのバリデーション処理．
                // ユーザ名，パスワードが共に入力されていない場合
                if(
                    (userNameInputVal == '' || userNameInputVal == null || userNameInputVal == undefined) &&
                    (userPasswordInputVal == '' || userPasswordInputVal == null || userPasswordInputVal == undefined)
                ){
                    swal.showInputError('ユーザ名とパスワードを入力してください．'); 
                // ユーザ名が入力されていない場合
                }else if(userNameInputVal == '' || userNameInputVal == null || userNameInputVal == undefined){
                   swal.showInputError('ユーザ名を入力してください．'); 
                // パスワードが入力されていない場合
                }else if(userPasswordInputVal == '' || userPasswordInputVal == null || userPasswordInputVal == undefined){
                   swal.showInputError('パスワードを入力してください．'); 
                // ユーザ名，パスワードが共に入力されている場合
                }else{
                    // console.log('userNameInput: ' + userNameInputVal); 
                    // console.log('userPasswordInput: ' + userPasswordInputVal); 
                    // 認証用ユーザ名，パスワードをサーバに送信．
                    // サーバの UserDataBaseProcessor で処理するため，{'userName':'KensukeS', 'userPassword':'12345'} といった形式をとる．
                    // callback はサーバから認証結果を受け取った際に実行される．
                    globalMemCPSCIDA.reqAuthorization({'userName':userNameInputVal, 'userPassword':userPasswordInputVal}, function(authorizationResult){
                        // console.info(authorizationResult);
                        
                        if(authorizationResult.status == 'success'){ // 認証成功時   
                            
                            // ユーザネームを設定．
                            // これを行わないと「いいね!」の処理が正しく行われない．
                            globalMemCPSCIDA.chunkDataObj.userName = userNameInputVal;
                            
                            // 一度 認証に成功した場合, 次回以降は localStorage に保存する．
                            localStorage.setItem('chunkPianoSystem_userName', userNameInputVal);
                            localStorage.setItem('chunkPianoSystem_userPassword', userPasswordInputVal);
                            
                            // swal から authorizationFrameTemplateGenerator で作成した独自フォームを除去し                            
                            // appendMyFormOnSwal で無効化された swal 標準 input を有効化する．
                            // removeMyFormOnSwal は appendMyFormOnSwal 実行時に行っているのでここで行う必要はない．
                            removeMyFormOnSwal();

                            // 認証成功ウィンドウを表示．
                            // 新規 swal 実行で 認証モーダルウィンドウは自動で閉じられるので，
                            // swal.close(); を実行する必要はない．
                            swal({
                                title: authorizationResult.message, 
                                type : authorizationResult.status, 
                                timer: 1500, 
                                showConfirmButton: false 
                            });
                            
                        }else if(authorizationResult.status == 'error'){ // 認証成功時
                            swal.showInputError(authorizationResult.message); // authorizationResult.message 認証失敗メッセージ．
                        }
                        
                    });
                }
            }else{ // ユーザが新規アカウント作成ボタンをクリックした時．
                console.log('新規アカウント作成');
                swal.close(); // todo: 新規アカウント作成処理の実装．
            }
        });        
        // ユーザ認証 swal には 独自フォームを埋め込みたいので，通常の swal (type:input) 表示後に swal の標準 input を無効化し，
        // appendMyFormOnSwal を実行．
        removeSwalInput();
        appendMyFormOnSwal(authorizationFrameTemplate);        
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
                    removeSwalInput();
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
                restoreSwalInput();
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
                // swal('ファイルリストを\n取得しています...', '', 'info'); // showLoaderOnConfirm を利用しない場合．
                swal({
                    title: 'ファイルリストを\n取得しています...',
                    text : '',
                    type : 'info',
                    showCancelButton   : false,
                    closeOnConfirm     : false,
                    showLoaderOnConfirm: true,
                },function(){});
                
                // jQuery で swal の ok ボタンをクリックし，showLoaderOnConfirm を初期状態で有効化する．
                setTimeout(function(){
                    $('.sa-button-container .confirm').click();

                    // $('.sa-button-container .confirm').click() を実行後，少し setTimeout してから chunkFileNameReq を行い，
                    // ファイル選択モーダルウィンドウの ok ボタンがクリックされてしまうのを防ぐ．
                    setTimeout(function(){
                        // todo: chunkFileName がレスポンスされた際の処理を client.js からここに移す．
                        //       callback を利用して実現．                        
                        globalMemCPSCIDA.socketIo.emit('chunkFileNameReq',{});
                    }, 100);
                }, 500);
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