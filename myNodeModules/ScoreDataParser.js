module.exports = function(fileName){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var fs = require('fs'), 
        constructor, scoreDataJson, getNoteLinePosition, getRawData
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    getNoteLinePosition = function(){
        
        var noteLinePositionObj = {
            noteLine:[],
            upperY:scoreDataJson.scoreRow.upperAxisY,
            lowerY:scoreDataJson.scoreRow.lowerAxisY,
            middleAxisY:null // チャンク先頭位置が上段か下段かの判定に利用
        };
        
        // 譜面の上段，下段の中間の y 座標を取得．チャンクで頭出しする際，上段，下段の判定に利用．
        noteLinePositionObj.middleAxisY = Math.floor(noteLinePositionObj.upperY + 
                                                     ((noteLinePositionObj.lowerY - noteLinePositionObj.upperY) / 2)
                                                     )
        ;
        
        // ScoreData から音符列の x 座標，y 座標のみを抽出．
        // 音符個別の y 座標は取得しない．音符個別の y 座標も取得したい場合は，getRawData を利用すべし．
        for(var noteLine in scoreDataJson.notesCol){
            noteLinePositionObj.noteLine[noteLine] = {
                'axisX':scoreDataJson.notesCol[noteLine].axisX,                                       
                'axisY':scoreDataJson.notesCol[noteLine].axisY}
            ;
        }
        
        return noteLinePositionObj; 
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // ScoreData の生データを返す．
    getRawData = function(){
        return scoreDataJson; 
    };
    // constructor が行うのは json データのロードのみ
    (constructor = function(){
        scoreDataJson = fs.readFileSync('./ScoreData/' + fileName, 'utf-8');
        scoreDataJson = JSON.parse(scoreDataJson);
        // console.log(scoreDataJson);
    })();
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{getNoteLinePosition:getNoteLinePosition, getRawData:getRawData};
};