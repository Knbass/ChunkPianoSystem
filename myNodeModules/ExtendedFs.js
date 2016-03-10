// fs を継承し拡張した ExtendedFs モジュール．
module.exports = (function(){
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var constructor, getFileNameListAsync, readFileSync, readFilesAsync,
	    ExtendedFs = require('fs')
    ;    
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // 指定されたディレクトリ内の指定された拡張子のファイルを配列に格納し返却．
    // 指定フォルダのファイル一覧を取得... http://blog.panicblanket.com/archives/2465
    // readdir は非同期実行なので次処理は callback で渡す．
    // callback にファイルネームが格納された配列が渡される．
    // !!! フォルダ内にディレクトリがあると正常に動作しないことに注意 !!!
    ExtendedFs.getFileNameListAsync = function(directryPath, extention, callback){
        
        ExtendedFs.readdir(directryPath, function(err, files){
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
    // [{'ファイル名':ファイルデータ}, {'ファイル名':ファイルデータ}...] を返却する．
    // directry path を指定する際，末尾に '/' を付けずに実行しなければならない. 
    // callback にファイルデータが格納された配列が渡される．
    ExtendedFs.readFilesAsync = function(directryPathRFA, extentionRFA, callback){
        // fileNameList には指定された拡張子を持つファイル名のみが格納されている．
        ExtendedFs.getFileNameListAsync(directryPathRFA, extentionRFA, function(fNameList){
            
            var fileDataList = [];
            
            for(var file_i in fNameList){
                try{
                    var filePath = String() + directryPathRFA + '/' + fNameList[file_i];
                    fileDataList.push({
                        'fileName':fNameList[file_i],
                        'file':ExtendedFs.readFileSync(filePath)
                    });
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
    return ExtendedFs;
})();