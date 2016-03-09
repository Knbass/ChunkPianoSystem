//module.exports = (function(){

var CreateAnnotationHintDataBase = function(){
    
    var readFilesAsync = require('./FsUtil.js').readFilesAsync,
        createDataBase,
        fileDataList = []
    ;

    readFilesAsync('../ChunkData', 'json', function(fData){
        fileDataList = fData;
        console.log(fileDataList);
    });
    
    createDataBase = function(){
        
    };
    
    return {createDataBase:createDataBase};
};
    
//})();

(function main(){
    var cahdb = CreateAnnotationHintDataBase();
    
})();