// AnnotationHintDataBase の初期化，更新を行うモジュール．
// このモジュールは状態を持つため， constructor で初期化してから
// 利用すること．
// todo: 現在はデータベースを利用していないため，AnnotationHintDataBase のサイズが大きくなるにつれて，
//       メモリを圧迫し処理できなくなる．
//       最終的には mongoDbに移行すること．
//////////////////////////////////////////////
//////////////////////////////////////////////
module.exports = (function(){ // node module として利用する際はこちらを有効化
// var AnnotationHintDataBaseProcessor = function(){ // // moduleTest の際はこちらを有効化
    'use strict'
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    var extendedFs = require('./ExtendedFs.js'),
        scoreDataParser = require('./ScoreDataParser.js')('./ScoreData/TurcoScore.json'),
        // scoreDataParser = require('./ScoreDataParser.js')('./ScoreData/TurcoScore.json'),
        uppdateDataBase, parseChunkDataJson, initAnnotationHintDataBase, saveDbAsJson, search,
        annotationHintDataBase = {},
        uppdateDataBase_callback = null,
        noteLineLength = 0
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // todo: noteLinePosition から全音符番号を取得し，annotationHintDataBase を初期化．
    // todo: クライアントサイドで chunkDom に自身が所属する譜面行番号を付与する処理を行う． 
    (initAnnotationHintDataBase = function(){
        var noteLinePosition = scoreDataParser.getNoteLinePosition();
        // noteLinePosition の scoreCol(音符列の何段目までが譜面の何段目に格納されているかの情報を格納) の中から，
        // 最後尾の譜面段の最後尾の音符列を取り出す．
        // つまり，音符列の最大値を取得している．
        noteLineLength = parseInt(noteLinePosition.scoreCol[String() + Object.keys(noteLinePosition.scoreCol).length - 1].end, 10);
        
        for(var annoHintDB_noteLine_i = 0; annoHintDB_noteLine_i <= noteLineLength; annoHintDB_noteLine_i++){
            annotationHintDataBase[String() + annoHintDB_noteLine_i] = {
                patternChunk:{}, // 後で変数を利用してオブジェクトキーを追加するので null で初期化してはいけない．
                phraseChunk :{}, // null では annotationHintDataBase[chunkMiddleLine][chunkType][userName] == ~~ のようにキーを追加できない．
                hardChunk   :{},
                summaryChunk:{}
            };
        }
        // console.log(annotationHintDataBase);
    })();
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    uppdateDataBase = function(callback){
        // server モジュールから呼び出すメソッドのため，念入りに try-catch する．
        // ここでバグが発生しても，annotationHint データベース更新が不能になる以外のトラブルを
        // 起こさない(フォールトトレラント設計)．
        try{
            
            if(callback != undefined) uppdateDataBase_callback = callback;
            
            // extendedFs.readFilesAsync('../ChunkData', 'json', function(chunkData){ // moduleTest の時
            extendedFs.readFilesAsync('./ChunkData', 'json', function(chunkData){
                // readFilesAsync は [{'ファイル名':ファイルデータ}, {'ファイル名':ファイルデータ}...] を返却する．
                // (1) まず，ファイルを1つずつ読み込む．
                for(var file_i in chunkData){

                    try{
                        var userName, // userName, practiceDay は chunkData を parse した後に格納すること．
                            practiceDay
                        ;
                        chunkData[file_i].file = JSON.parse(chunkData[file_i].file);
                        userName = chunkData[file_i].file.userName;
                        // practiceDay は annotationHintDataBase のインデックスに利用するため文字列化する．
                        practiceDay = String() + chunkData[file_i].file.practiceDay;

                        // (2) ファイル内のchunkData を1つずつ読み込み，データベースに格納．
                        try{
                            for(var chunkData_i in chunkData[file_i].file.chunkData){
                                // chunkMiddleLine は chunk の中心位置と対応する音符列番号．これを annotation hint のインデックスとする．
                                // オブジェクトアクセスを減らすために変数に格納．
                                // オブジェクトのキーにするため文字列化．
                                var chunkMiddleLine = String() + chunkData[file_i].file.chunkData[chunkData_i].chunkMiddleLine,
                                    // chunkData obj の chunkType は hard や pattern のようになっているので，'Chunk' を末尾に連結．
                                    chunkType = String() + chunkData[file_i].file.chunkData[chunkData_i].chunkType + 'Chunk',
                                    objTemplate
                                ;

                                // annotationHintDataBase[chunkMiddleLine][chunkType] 以降のデータが undefined の場合は，
                                // キー毎にオブジェクトを定義し初期化する．これを行わないと annotationHintDataBase[chunkMiddleLine][chunkType] 以降の
                                // キーを  annotationHintDataBase[chunkMiddleLine][chunkType][userName][practiceDay][chunkData_i] = ~~ のように追加できない
                                if(annotationHintDataBase[chunkMiddleLine][chunkType][userName] == undefined){
                                    annotationHintDataBase[chunkMiddleLine][chunkType][userName] = {};
                                    annotationHintDataBase[chunkMiddleLine][chunkType][userName][practiceDay] = {};
                                    annotationHintDataBase[chunkMiddleLine][chunkType][userName][practiceDay][chunkData_i] =
                                        chunkData[file_i].file.chunkData[chunkData_i]
                                    ;
                                }

                            }
                        }catch(e){
                            console.log(e);
                            console.log('chunkData個別処理でエラー．annotationHintDataBase を更新できません．');
                        }
                    }catch(e){
                        console.log(e);
                        console.log('chunkData全体処理でエラー．annotationHintDataBase を更新できません．');
                    }

                }
            // console.log(chunkData);           
            saveDbAsJson();
        });
        }catch(e){
            console.log(e);
            console.log('readFilesAsyncでエラー．annotationHintDataBase を更新できません．');
        }  
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    search = function(chunkData, option){
        try{        
            var searchRangeMin = chunkData.chunkMiddleLine - option.margin,
                searchRangeMax = chunkData.chunkMiddleLine + option.margin,
                searchResult = {},
                tmp_searchedNoteLine
            ;

            // searchRangeMin が 0 以下の場合は検索不可なので 0 に修正
            if(searchRangeMin < 0){
                searchRangeMin = 0;
            }
            // TurcoScore の場合は searchRangeMax が 82 以上の場合は検索不可なので 82 に修正．        
            if(searchRangeMax > noteLineLength){
                searchRangeMax = noteLineLength;   
            }

            console.log(chunkData);
            console.log(option);
            console.log('searchRangeMin: ' + searchRangeMin);
            console.log('searchRangeMax: ' + searchRangeMax);      


            for(var searchRenge = searchRangeMin; searchRenge <= searchRangeMax; searchRenge++){
                // console.log();
                tmp_searchedNoteLine = annotationHintDataBase[String() + searchRenge];

                if(option.patternChunk){
                    if(Object.keys(tmp_searchedNoteLine.patternChunk).length != 0){
                        // 検索オプションで patternChunk が有効化され，該当音列 の annotationHintDataBase の patternChunk が空でない時は
                        // 検索結果に当該データを格納する．
                        // phraseChunk, hardChunk, summaryChunk についても同様の処理を行っている．
                        // todo: 類似処理が反復されているので関数化する． 
                        searchResult[String() + searchRenge] = {};
                        searchResult[String() + searchRenge]['patternChunk'] = tmp_searchedNoteLine.patternChunk;
                    }
                }
                if(option.phraseChunk){
                    if(Object.keys(tmp_searchedNoteLine.phraseChunk).length != 0){
                        searchResult[String() + searchRenge] = {};
                        searchResult[String() + searchRenge]['phraseChunk'] = tmp_searchedNoteLine.phraseChunk;
                    }
                }           
                if(option.hardChunk){
                    if(Object.keys(tmp_searchedNoteLine.hardChunk).length != 0){
                        searchResult[String() + searchRenge] = {};
                        searchResult[String() + searchRenge]['hardChunk'] = tmp_searchedNoteLine.hardChunk;
                    }
                }
                if(option.summaryChunk){
                    if(Object.keys(tmp_searchedNoteLine.summaryChunk).length != 0){
                        searchResult[String() + searchRenge] = {};
                        searchResult[String() + searchRenge]['summaryChunk'] = tmp_searchedNoteLine.summaryChunk;
                    }
                }
            }
            // console.log(searchResult);
            return searchResult;
        }catch(e){
            console.log('Error occured in AnnotationHintDataBaseProcessor.search');
            return 'error'; // 検索操作中に error が発生した際は server に文字列を返却し伝達．
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    saveDbAsJson = function(){
        var strinfiedAnnotationHintDataBase = JSON.stringify(annotationHintDataBase);
        // extendedFs.writeFile('../AnnotationHintDataBase.json', strinfiedAnnotationHintDataBase, function(err){
        extendedFs.writeFile('./AnnotationHintDataBase.json', strinfiedAnnotationHintDataBase, function(err){
           if(err){
               console.log(err);
           }else{
               if(uppdateDataBase_callback != null) uppdateDataBase_callback();
               console.log('////////////////////////////////');
               console.log('AnnotationHintDataBase updated.');
               console.log('////////////////////////////////');
           }
        });  
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {uppdateDataBase:uppdateDataBase, search:search};
// }; // moduleTest の際はこちらを有効化
})();;// node module として利用する際はこちらを有効化

/*
(function moduleTest(){
    var ahdbp = AnnotationHintDataBaseProcessor();
    ahdbp.uppdateDataBase();
})();
*/