// UserDataBase の初期化，更新を行うモジュール．
//////////////////////////////////////////////
//////////////////////////////////////////////
// module.exports = (function(){ // node module として利用する際はこちらを有効化
var UserDataBaseProcessor = function(){ // moduleTest の際はこちらを有効化
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var initDataBase, saveDbAsJson, uppdateDataBase_callback,
        extendedFs = require('./ExtendedFs.js'), 
        colors = require('colors'), // 色付きで console.log するモジュール．
        sys = require('sys'),       // node.js の標準入出力モジュール．
        userDataBase = {}
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    saveDbAsJson = function(){
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
    saveDbAsJson();
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {initDataBase:initDataBase};
 }; // moduleTest の際はこちらを有効化
//})();;// node module として利用する際はこちらを有効化


(function moduleTest(){
    var udb = UserDataBaseProcessor();
})();