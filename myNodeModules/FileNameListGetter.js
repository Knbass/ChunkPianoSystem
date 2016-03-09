// 指定されたディレクトリ内の，指定された拡張子のファイルのみのファイル名を配列で返却するモジュール．
// !!!フォルダ内にディレクトリがあると正常に動作しないことに注意!!!
module.exports = (function(){
    'use strict'
    var constructor, getFileNameListAsync,
	    fs = require('fs')
    ;    
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // 指定フォルダのファイル一覧を取得... http://blog.panicblanket.com/archives/2465
    // readdir は非同期実行なので次処理は callback で渡す．
    getFileNameListAsync = function(directryPath, extention, callback){
        fs.readdir(directryPath, function(err, files){
            if (err) throw err; 
    
            var fileNameList = [];

            for(var files_i in files){ // files_i には指定されたディレクトリのファイルネームが格納されている．
                fileNameList.push(files[files_i]);
            }
            
            for (var fileNameList_i in fileNameList){

                var fileExtention, extactedFileNameList; // 指定された拡張子以外のファイルを除去したファイル名リスト

                // ファイル名から拡張子を抽出
                fileExtention = fileNameList[fileNameList_i].split('.');
                fileExtention = fileExtention[fileExtention.length - 1];
                
                if(fileExtention != extention){
                    fileNameList.splice( fileNameList_i , 1 ) ;
                }                
            }
            
            callback(fileNameList);
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {getFileNameListAsync:getFileNameListAsync};
})();
