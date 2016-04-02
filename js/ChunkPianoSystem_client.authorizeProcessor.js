// ユーザ認証用モジュール．
// ユーザの新規登録処理も行う．
ChunkPianoSystem_client.authorizeProcessor = function(globalMemCPSCP){    
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var userNameSetter, clientAuthorizer, 
        myFormClassNameOnSwal = null,
        authorizationFrameTemplate,
        defaultUserName = null,
        defaultUserPassword = null,
        userNameSetter
    ;    
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // ユーザ認証用フォームを生成．
    (function (){
        var authorizationFrame = $('<div class="authorizationFrame"></div>'),
            userNameInput = $('<input type="text" id="userNameInput" maxlength="30" placeholder="ユーザ名を入力..."/>'),
            br = $('<br>'),
            userPasswordInput = $('<input type="password" id="userPasswordInput" maxlength="30" placeholder="パスワードを入力..."/>')
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
    clientAuthorizer = function(){
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
                // ユーザ名，パスワードが共に入力されている場合.
                }else{
                    // console.log('userNameInput: ' + userNameInputVal); 
                    // console.log('userPasswordInput: ' + userPasswordInputVal);
                    
                    // 認証用ユーザ名，パスワードをサーバに送信．
                    // サーバの UserDataBaseProcessor で処理するため，{'userName':'KensukeS', 'userPassword':'12345'} といった形式をとる．
                    // callback はサーバから認証結果を受け取った際に実行される．
                    globalMemCPSCP.reqAuthorization({'userName':userNameInputVal, 'userPassword':userPasswordInputVal}, function(authorizationResult){
                        // console.info(authorizationResult);

                        if(authorizationResult.status == 'success'){ // 認証成功時   

                            // ユーザネームを設定．
                            // これを行わないと「いいね!」の処理が正しく行われない．
                            globalMemCPSCP.chunkDataObj.userName = userNameInputVal;

                            // 一度 認証に成功した場合, 次回以降は localStorage に保存する．
                            localStorage.setItem('chunkPianoSystem_userName', userNameInputVal);
                            localStorage.setItem('chunkPianoSystem_userPassword', userPasswordInputVal);

                            // swal から authorizationFrameTemplateGenerator で作成した独自フォームを除去.
                            // ここで ChunkPianoSystem_client.swalUtil.restoreSwalInput(); を実行すると
                            // 全ての mordal window で input が表示されてしまうので実行しない．
                            // input を表示する swal を表示したい時に実行する．
                            ChunkPianoSystem_client.swalUtil.removeMyFormOnSwal();
                            
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
        ChunkPianoSystem_client.swalUtil.removeSwalInput();
        ChunkPianoSystem_client.swalUtil.appendMyFormOnSwal(authorizationFrameTemplate);  
    };

    return {clientAuthorizer:clientAuthorizer};
};