// 指定されたディレクトリ内の，指定された拡張子のファイルのみのファイル名を配列で返却するモジュール．
// !!!フォルダ内にディレクトリがあると正常に動作しないことに注意!!!
module.exports = (function(){
    'use strict'
    var constructor, getFileNameListAsync, readFileSync, readFilesAsync,
	    fs = require('fs')
    ;    
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // 指定フォルダのファイル一覧を取得... http://blog.panicblanket.com/archives/2465
    // readdir は非同期実行なので次処理は callback で渡す．
    // callback にファイルネームが格納された配列が渡される．
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
    // fs の readFileSync と同様の動作．
    readFileSync = function(filePathRFC){
        var file;
        try{
            file = fs.readFileSync(filePathRFC, 'utf-8');
        }catch(e){
            console.log(e);
        }
        return file;
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // directry path を指定する際，末尾に '/' を付けずに実行しなければならない. 
    // callback にファイルデータが格納された配列が渡される．
    readFilesAsync = function(directryPathRFA, extentionRFA, callback){
        // fileNameList には指定された拡張子を持つファイル名のみが格納されている．
        getFileNameListAsync(directryPathRFA, extentionRFA, function(fNameList){
            
            var fileDataList = [];
            
            for(var file_i in fNameList){
                try{
                    var filePath = String() + directryPathRFA + '/' + fNameList[file_i];
                    fileDataList.push(readFileSync(filePath));
                }catch(e){
                    console.log(e);
                    console.log('dhirectry path の末尾に / が付いている可能性があります．除去してください．');
                }
            }
            callback(fileDataList);
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {getFileNameListAsync:getFileNameListAsync, readFilesAsync:readFilesAsync, readFileSync:readFileSync};
})();