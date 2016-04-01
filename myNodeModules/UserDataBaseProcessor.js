// UserDataBase の初期化，更新を行うモジュール．
// ★ UserDataBase の例  (2016/4/1時点，一部のみ切出)
/*
    {   "dummyUserName":"dummyUserPassword",
        "TanakaTaro"   :"12345",
        "TanakaMinami" :"54321"
    }
*/
//////////////////////////////////////////////
//////////////////////////////////////////////
module.exports = (function(){ // node module として利用する際はこちらを有効化
// var UserDataBaseProcessor = function(){ // moduleTest の際はこちらを有効化
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var constructor, initDataBase, loadDataBase, saveDataBaseAsJson, isUserExist, 
        addUserData, removeUserData, authorize,
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

        extendedFs.writeFile('./UserDataBase.json', strinfiedUserDataBase, function(err){     // server 実行時のファイルパス
        // extendedFs.writeFile('../UserDataBase.json', strinfiedUserDataBase, function(err){ // moduleTest 時のファイルパス
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
            userDataBase = extendedFs.readFileSync('./UserDataBase.json', 'utf-8');     // server 実行時のファイルパス
            // userDataBase = extendedFs.readFileSync('../UserDataBase.json', 'utf-8'); // moduleTest 時のファイルパス
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
    // userName が既に存在している場合は true, そうでない場合は false を return. 
    isUserExist = function(userName){ 
        return userDataBase.hasOwnProperty(userName) ? true : false;
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // userData は {'userName':'userName', 'userPassword':'userPassword'} という形式を取る．
    // userName が既に存在している場合は false を return. 
    addUserData = function(userData){
        if(isUserExist(userData.userName)){
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
        if(isUserExist(userName) == true){
            delete userDataBase[userName];
            // 最新の userDataBase はメモリ内で構成されているため，最新の database を saveDataBaseAsJson で
            // 保存してから loadDataBase する必要はない．
            saveDataBaseAsJson(); 
            
            sys.puts(String() + userName + ' is removed.'.green);
            console.log(userDataBase);
            return true;
        }else{
            sys.puts(String() + userName + ' is not exsist.'.red);
            return false;
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // ユーザ認証メソッド．
    // userData は {'userName':'userName', 'userPassword':'userPassword'} という形式を取る．
    // userName が既に存在している場合は false を return. 
    authorize = function(userData){
        if(isUserExist(userData.userName) == true){
            if(userData.userPassword == userDataBase[userData.userName]){
                sys.puts(String() + userData.userName + ' is authorized.'.green);                        
                return 'authorized'; 
            }else{
                sys.puts('incorrect user password.'.red);
                sys.puts(String() + userData.userName + ' is not authorized.'.red);
                return 'incorrectUserPassword';
            }
        }else{
            sys.puts(String() + userData.userName + ' is not exsist.'.red);
            return 'userNotExist'; 
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
    return {addUserData:addUserData, removeUserData:removeUserData, authorize:authorize};
// }; // moduleTest の際はこちらを有効化
})(); // node module として利用する際はこちらを有効化．
//////////////////////////////////////////////
//////////////////////////////////////////////
/*
(function moduleTest(){
    var udb = UserDataBaseProcessor();
    
    // ユーザデータ追加テスト
    // console.log(udb.addUserData({'userName':'KensukeS', 'userPassword':'12345'}));
    // console.log(udb.addUserData({'userName':'KentaroUeda', 'userPassword':'12345'}));
    // console.log(udb.addUserData({'userName':'K.Ueda', 'userPassword':'12345'}));
    
    // ユーザデータ削除テスト
    // console.log(udb.removeUserData('KentaroUeda'));
    // console.log(udb.removeUserData('KensukeS'));
    
    // ユーザデータ認証テスト
    console.log(udb.authorize({'userName':'KensukeS', 'userPassword':'12345'}));
    // console.log(udb.authorize({'userName':'Ken', 'userPassword':'12345'}));
    console.log(udb.authorize({'userName':'KensukeS', 'userPassword':'1'}));
})();
*/