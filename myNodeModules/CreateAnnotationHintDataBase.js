//module.exports = (function(){

var CreateAnnotationHintDataBase = function(){
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var extendedFs = require('./ExtendedFs.js'),
        createDataBase, parseChunkDataJson, annotationHintDataBaseFactory, 
        fileDataList = [], 
        annotationHintDataBase={
            
        }
    ;
    
    annotationHintDataBaseFactory = function(){
        
    };
    
    // todo: annotationHintDataBase の設計を考える．summaryChunk はどうする? 
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    createDataBase = function(){
        extendedFs.readFilesAsync('../ChunkData', 'json', function(fData){
            
            fileDataList = fData;
            
            // fileDataList は [{'ファイル名':ファイルデータ}, {'ファイル名':ファイルデータ}...] を返却する．
            for(var file_i in fileDataList){
                fileDataList[file_i].file = JSON.parse(fileDataList[file_i].file);
            }
            
            console.log(fileDataList);
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