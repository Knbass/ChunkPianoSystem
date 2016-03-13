// AnnotationHintDataBase の初期化，更新を行うモジュール．
// このモジュールは状態を持つため， constructor で初期化してから
// 利用すること．
// todo: 現在はデータベースを利用していないため，AnnotationHintDataBase のサイズが大きくなるにつれて，
//       メモリを圧迫し処理できなくなる．
//       最終的には mongoDbに移行すること．

// module.exports = (function(){
var AnnotationHintDataBaseProcessor = function(){
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var extendedFs = require('./ExtendedFs.js'),
        scoreDataParser = require('./ScoreDataParser.js')('../ScoreData/TurcoScore.json'),
        createDataBase, parseChunkDataJson, annotationHintDataBaseFactory, initAnnotationHintDataBase,
        saveDbAsJson, 
        chunkDataWithFileNameList = [], 
        annotationHintDataBase = {
            
        }
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // todo: noteLinePosition から全音符番号を取得し，annotationHintDataBase を初期化．
    // todo: クライアントサイドで chunkDom に自身が所属する譜面行番号を付与する処理を行う． 
    (initAnnotationHintDataBase = function(){
        var noteLinePosition = scoreDataParser.getNoteLinePosition(), 
            noteLineLength = 0
        ;
        // noteLinePosition の scoreCol(音符列の何段目までが譜面の何段目に格納されているかの情報を格納) の中から，
        // 最後尾の譜面段の最後尾の音符列を取り出す．
        // つまり，音符列の最大値を取得している．
        noteLineLength = parseInt(noteLinePosition.scoreCol[String() + Object.keys(noteLinePosition.scoreCol).length - 1].end, 10);
        
        for(var annoHintDB_noteLine_i = 0; annoHintDB_noteLine_i <= noteLineLength; annoHintDB_noteLine_i++){
            annotationHintDataBase[String() + annoHintDB_noteLine_i] = null;
        }        
        console.log(annotationHintDataBase);
    })();
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    annotationHintDataBaseFactory = function(chunkDataWithFileName){
        console.log(chunkDataWithFileName);
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////    
    saveDbAsJson = function(){
        
        var strinfiedAnnotationHintDataBase = JSON.stringify(annotationHintDataBase);
        extendedFs.writeFile('AnnotationHintDataBase.json', strinfiedAnnotationHintDataBase, function(err){
           if(err){
               console.log(err);
           }else{
               console.log('data has written!');
           }
        });
        
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    createDataBase = function(){
        extendedFs.readFilesAsync('../ChunkData', 'json', function(cData){
            chunkDataWithFileNameList = cData;
            // chunkDataWithFileName は [{'ファイル名':ファイルデータ}, {'ファイル名':ファイルデータ}...] を返却する．
            for(var file_i in chunkDataWithFileNameList){
                chunkDataWithFileNameList[file_i].file = JSON.parse(chunkDataWithFileNameList[file_i].file);
            }
            // console.log(chunkDataWithFileNameList);
            // annotationHintDataBaseFactory(chunkDataWithFileNameList[0]);
        });
    };    
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {createDataBase:createDataBase, saveDbAsJson:saveDbAsJson};
};
//})();

(function moduleTest(){
    var ahdbp = AnnotationHintDataBaseProcessor();
    ahdbp.createDataBase();
    // ahdbp.saveDbAsJson();
})();