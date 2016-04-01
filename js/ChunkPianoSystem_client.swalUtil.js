// swal に独自 input form を追加するための utility モジュール．
// 即時実行されるため，明示的にインスタンスを作成しなくて良い．
// removeSwalInput, restoreSwalInput にクセがあるので注意．

// globalObj を必要とせず，全モジュールで利用するようなクライアントモジュールは即時実行して生成した方がスマート．
// 例: swalUtil, utility sなど．
ChunkPianoSystem_client.swalUtil = (function(){    
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var restoreSwalInput,
        removeSwalInput, 
        myFormClassNameOnSwal = null,
        appendMyFormOnSwal, 
        removeMyFormOnSwal,
        createAutoLoaderSwalWindow
    ;
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
        if(myForm){
            myFormClassNameOnSwal = myForm.prop('class');
            $('.sweet-alert fieldset').append(myForm);           
        }else{
            console.error('appendMyFormOnSwal には引数としてswalから除去したい独自フォームの jQuery オブジェクトを渡してください．');
        }
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
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // swal で初期状態から loader を表示しているモーダルウィンドウを表示するメソッド．
    // swal は初期状態から loader を表示しているモーダルウィンドウを表示できない．
    // loader の ok ボタンを jQuery でクリックして擬似的に実現した．
    // swalProp は通常の swal プロパティ．showLoaderOnConfirm: true でなければならないことに注意．
    // loaderCallback には loading が始まった際に行いたい処理を記述した callback 関数を渡す．
    createAutoLoaderSwalWindow = function(swalProp, loaderCallback){
        
        if(swalProp.showLoaderOnConfirm){
            
            // ここの callback は swal の ok ボタンクリック時に実行される処理なので，このメソッドでは利用しない．
            swal(swalProp,function(){});

            // jQuery で swal の ok ボタンをクリックし，showLoaderOnConfirm を初期状態で有効化する．
            // swal モーダルウィンドウが描画されるのに時間がかかるため，500 ms setTimeout している．
            setTimeout(function(){
                $('.sa-button-container .confirm').click();
                // $('.sa-button-container .confirm').click() を実行後，少し setTimeout してから 
                // ユーザの callback を行わないと，callback がクリック完了前に実行されるバグが発生する．
                setTimeout(loaderCallback, 100);
            }, 500);
        }else{
            console.error('createAutoLoaderSwalWindow を利用するには showLoaderOnConfirm: true でなければいけません．');   
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    
    return {removeSwalInput:removeSwalInput, restoreSwalInput:restoreSwalInput, 
            appendMyFormOnSwal:appendMyFormOnSwal, removeMyFormOnSwal:removeMyFormOnSwal, 
            createAutoLoaderSwalWindow:createAutoLoaderSwalWindow
           }
    ;
})();