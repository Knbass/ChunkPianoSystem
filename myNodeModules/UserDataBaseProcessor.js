// UserDataBase の初期化，更新を行うモジュール．
//////////////////////////////////////////////
//////////////////////////////////////////////
// module.exports = (function(){ // node module として利用する際はこちらを有効化
var UserDataBaseProcessor = function(){ // moduleTest の際はこちらを有効化
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var constructor, initDataBase, loadDataBase, saveDataBaseAsJson, uppdateDataBase_callback,
        extendedFs = require('./ExtendedFs.js'), 
        colors = require('colors'), // 色付きで console.log するモジュール．
        sys = require('sys'),       // node.js の標準入出力モジュール．
        userDataBase = {}
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    initDataBase = function(){ 
        userDataBase = {'dummyUserName':'dummyUserPassword'}; // テンプレート用のダミーデータ．
        saveDataBaseAsJson(); 
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    saveDataBaseAsJson = function(){
        var strinfiedUserDataBase = JSON.stringify(userDataBase);

        extendedFs.writeFile('../UserDataBase.json', strinfiedUserDataBase, function(err){
           if(err){
               console.log(err);
           }else{
               if(uppdateDataBase_callback != null) uppdateDataBase_callback();
               sys.puts('UserDataBase updated.' .green);
           }
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    loadDataBase = function(callback){
        try{
            // userDataBase = extendedFs.readFileSync('./UserDataBase.json', 'utf-8');
            userDataBase = extendedFs.readFileSync('../UserDataBase.json', 'utf-8'); // moduleTest 時のファイルパス
            userDataBase = JSON.parse(userDataBase);
            if(callback != null || callback != undefined) callback();
            sys.puts('UserDataBase loaded.'.green);
            console.log(userDataBase);
        }catch(e){
            console.log(e);
            sys.puts('Error occured in loadDataBase.'.red);
            sys.puts('UserDataBase が構成されていない可能性があります.'.red);
            sys.puts('initDataBase を実行し UserDataBase を構成してください．'.red);
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    (constructor = function(){
        loadDataBase();
    })();
    //////////////////////////////////////////////
    //////////////////////////////////////////////    
    return {initDataBase:initDataBase};
}; // moduleTest の際はこちらを有効化
// })();;// node module として利用する際はこちらを有効化

(function moduleTest(){
    var udb = UserDataBaseProcessor();
})();