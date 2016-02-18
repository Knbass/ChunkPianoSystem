ChunkPianoSystem_client.initDomAction = function(globalMemCPSCIDA){    
    
    var initDomAction;
    
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
            userNameSetter,
            saveConfirmModalWindow
        ;
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        userNameSetter = function(userNameUNS){

            if(userNameUNS == '' || userNameUNS == null || userNameUNS == undefined){
                swal.showInputError('ユーザ名は必須です!');
            }else{
                globalMemCPSCIDA.chunkDataObj.userName = userNameUNS;
                swal.close();
            }
        };
        swalPromptOptionForUserNameProp = {
            title: 'ユーザ名を入力してください...',
            type: 'input',
            showCancelButton: false,
            closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!!
            animation: 'slide-from-top',
            inputPlaceholder: 'ここにユーザ名を入力'                    
        };
        swal(swalPromptOptionForUserNameProp, userNameSetter);   
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
            }, function (isConfirm){ // 保存する をクリックした場合
                if(isConfirm){
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

                chunkProperties = {
                    left       : chunkDrawingAreaMouseDowmPosX,
                    top        : chunkDrawingAreaMouseDowmPosY,
                    width      : chunkSizeX,
                    height     : chunkSizeY,
                    chunkType  : 'pattern',
                    parentChunk: null
                };

                globalMemCPSCIDA.createChunkDom(chunkProperties);

                globalMemCPSCIDA.isEditedByNewChunk = true;
                globalMemCPSCIDA.isChunkDrawing = false;
            }
        });    
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        saveChunkButton.click(function(mode){

            if(Object.keys(globalMemCPSCIDA.chunkDataObj.chunkData).length == 0){ // chunk が一つも描画されていない時は保存処理を行わない
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
            // todo: data で userName をサーバに渡し，その userName のファイルだけを req するようにする．
            // ここではサーバに保存されている ChunkPianoData 名のリストをリクエストしているだけ．
            // リストがレスポンスされた際の処理は globalMemCPSCIDA.socketIo.on の 'chunkFileNameList' 
            // !!!! 保存データの描画処理は globalMemCPSCIDA.socketIo.on の reqestedChunkData に記述されている !!!!

            // chank が編集された際の処理
            // 編集の定義... chank が動かされた，削除された，記入された とき．
            if(globalMemCPSCIDA.isEditedByChunkMovingOrDelete || globalMemCPSCIDA.isEditedByNewChunk){ 
                saveConfirmModalWindow(function(){
                    loadChunkButton.click();
                });
            }else{
                globalMemCPSCIDA.socketIo.emit('chunkFileNameReq',{});
            }
        });

        if(callback) callback();
    };
    
    return {initDomAction:initDomAction};
};