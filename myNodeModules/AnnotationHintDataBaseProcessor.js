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
        chunkDataWithFileNameList = [], 
        annotationHintDataBase = {
            
        }
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // todo: noteLinePosition から全音符番号を取得し，annotationHintDataBase を初期化．
    // todo: クライアントサイドで chunkDom に自身が所属する譜面行番号を付与する処理を行う． 
    (initAnnotationHintDataBase = function(){
        var noteLinePosition = scoreDataParser.getNoteLinePosition();        
        noteLinePosition = JSON.stringify(noteLinePosition);
    })();
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    annotationHintDataBaseFactory = function(chunkDataWithFileName){
        console.log(chunkDataWithFileName);
    };
    // todo: annotationHintDataBase の設計を考える．summaryChunk はどうする? 
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
            annotationHintDataBaseFactory(chunkDataWithFileNameList[0]);
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {createDataBase:createDataBase};
};
//})();

(function main(){
    var createDataBase = AnnotationHintDataBaseProcessor().createDataBase;
    createDataBase();
})();