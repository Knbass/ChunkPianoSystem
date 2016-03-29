// UserDataBase の初期化，更新を行うモジュール．
//////////////////////////////////////////////
//////////////////////////////////////////////
// module.exports = (function(){ // node module として利用する際はこちらを有効化
var UserDataBaseProcessor = function(){ // moduleTest の際はこちらを有効化
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var constructor, initDataBase, loadDataBase, saveDataBaseAsJson, addUserData, removeUserData,
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
    saveDataBaseAsJson = function(callback){
        var strinfiedUserDataBase = JSON.stringify(userDataBase);

        extendedFs.writeFile('../UserDataBase.json', strinfiedUserDataBase, function(err){
           if(err){
               console.log(err);
           }else{
               if(callback) callback();
               sys.puts('UserDataBase updated.' .green);
           }
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // json 形式の userDataBase を読み込みパースする．
    loadDataBase = function(callback){
        try{
            // userDataBase = extendedFs.readFileSync('./UserDataBase.json', 'utf-8');
            userDataBase = extendedFs.readFileSync('../UserDataBase.json', 'utf-8'); // moduleTest 時のファイルパス
            userDataBase = JSON.parse(userDataBase);
            if(callback) callback();
            sys.puts('UserDataBase loaded.'.green);
            // console.log(userDataBase);
        }catch(e){
            console.log(e);
            initDataBase();
            sys.puts('Error occured in loadDataBase.'.red);
            sys.puts('UserDataBase が構成されていない可能性があります.'.red);
            sys.puts('initDataBase を実行し UserDataBase を構成し直しました'.green);
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // userData は {'userName':'userName', 'userPassword':'userPassword'} という形式を取る．
    // userName が既に存在している場合は false を return. 
    addUserData = function(userData){
        // userName が既に存在している場合は false を return. 
        if(userDataBase.hasOwnProperty(userData.userName) == true){
            sys.puts(String() + userData.userName + ' is already exists.'.red);
            return false;
        }else{
            // 新たな userData を database に追加．
            userDataBase[userData.userName] = userData.userPassword;
            // 最新の userDataBase はメモリ内で構成されているため，最新の database を saveDataBaseAsJson で
            // 保存してから loadDataBase する必要はない．
            saveDataBaseAsJson(); 
            
            sys.puts('added userData to UserDataBase.'.green);
            console.log(userDataBase);
            return true;
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // 削除したいユーザ名を string の userName で引数として与え削除．　
    // 削除対象のキーが存在しない場合は false を return. 
    removeUserData = function(userName){
        // userName が既に存在している場合は false を return. 
        if(userDataBase.hasOwnProperty(userName) == true){
            delete userDataBase[userName];
            // 最新の userDataBase はメモリ内で構成されているため，最新の database を saveDataBaseAsJson で
            // 保存してから loadDataBase する必要はない．
            saveDataBaseAsJson(); 
            
            sys.puts(String() + userName + ' removed.'.green);
            console.log(userDataBase);
            return true;
        }else{
            sys.puts(String() + userName + ' not exsist.'.red);
            return false;
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    (constructor = function(){
        // 初期化時に UserDataBase.json をメモリに読込．
        loadDataBase();
        console.log(userDataBase);
    })();
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // initDataBase は moduleTest での実行が主なため，private とした．
    return {addUserData:addUserData, removeUserData:removeUserData};
}; // moduleTest の際はこちらを有効化
// })();;// node module として利用する際はこちらを有効化

(function moduleTest(){
    var udb = UserDataBaseProcessor();
    
    udb.addUserData({'userName':'KensukeS', 'userPassword':'12345'});
    udb.addUserData({'userName':'KentaroUeda', 'userPassword':'12345'});
    //udb.removeUserData('KentaroUeda');
})();