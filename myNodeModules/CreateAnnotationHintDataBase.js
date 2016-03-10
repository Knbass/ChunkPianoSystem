//module.exports = (function(){
var CreateAnnotationHintDataBase = function(){
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var extendedFs = require('./ExtendedFs.js'),
        createDataBase, parseChunkDataJson, annotationHintDataBaseFactory, 
        chunkDataWithFileNameList = [], 
        annotationHintDataBase = {
            
        }
    ;
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
    return {createDataBase:createDataBase};
};
    
//})();

(function main(){
    var createDataBase = CreateAnnotationHintDataBase().createDataBase;
    createDataBase();
})();