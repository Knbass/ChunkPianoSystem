// AnnotationHintDataBase の初期化，更新を行うモジュール．
// このモジュールは json を db として利用しているため，loadDataBase または uppdateDataBase で
// db をメモリに読み出してから利用すること．
// ★ UserDataBase の例 (2016/4/1時点，一部のみ切出)
/*
        {
            "0": { // 音符列番号
                "patternChunk": {}, // chunk の種類毎に chunk を格納
                "phraseChunk": {},
                "hardChunk": {},
                "summaryChunk": {
                    "Iwabuchi": { // ユーザ名
                        "1": {    // 練習日
                            "summaryChunk_0": { // クライアント再度で生成される chunkDataObj.chunkData
                                "chunkDomId": "summaryChunk_0",
                                "left": 1103,
                                "top": 592,
                                "width": 118,
                                "height": 21,
                                "stringScoreCol": "1",
                                "chunkMiddleAxisY": 575,
                                "chunkType": "summary",
                                "chunkHeadLine": 0,
                                "chunkTailLine": 0,
                                "chunkMiddleLine": 0,
                                "parentChunk": null,
                                "good": null,
                                "chunkAnnotationText": "今日の目標としてまず少しでも進めるように考えていた。"
                            }
                        }
                    }
                }
            }
         }
 */
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
        uppdateDataBase, loadDataBase, parseChunkDataJson, initAnnotationHintDataBase, saveDataBaseAsJson, search,
        colors = require('colors'), // 色付きで console.log するモジュール．
        sys = require('sys'),       // node.js の標準入出力モジュール．
        annotationHintDataBase = {},
        // noteLinePosition の scoreCol(音符列の何段目までが譜面の何段目に格納されているかの情報を格納) の中から，
        // 最後尾の譜面段の最後尾の音符列を取り出す．つまり，音符列の最大値を取得する．
        // noteLineLength は複数のメソッドで利用するため，モジュールグローバルスコープで宣言．
        noteLinePosition = scoreDataParser.getNoteLinePosition(),
        noteLineLength = parseInt(noteLinePosition.scoreCol[String() + Object.keys(noteLinePosition.scoreCol).length - 1].end, 10)
    ;
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // todo: noteLinePosition から全音符番号を取得し，annotationHintDataBase を初期化．
    // todo: クライアントサイドで chunkDom に自身が所属する譜面行番号を付与する処理を行う． 
    initAnnotationHintDataBase = function(){
        for(var annoHintDB_noteLine_i = 0; annoHintDB_noteLine_i <= noteLineLength; annoHintDB_noteLine_i++){
            annotationHintDataBase[String() + annoHintDB_noteLine_i] = {
                patternChunk:{}, // 後で変数を利用してオブジェクトキーを追加するので null で初期化してはいけない．
                phraseChunk :{}, // null では annotationHintDataBase[chunkMiddleLine][chunkType][userName] == ~~ のようにキーを追加できない．
                hardChunk   :{},
                summaryChunk:{}
            };
        }
        // console.log(annotationHintDataBase);
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // annotationHintDataBase を更新しメモリ上に展開する．
    // 更新に失敗した際は loadDataBase で annotationHintDataBase をメモリ上に展開する．
    uppdateDataBase = function(callback){
        
        var bootUpWithLoadDataBase;
        // uppdateDataBase でerror が発生した際は loadDataBase で annotationHintDataBase をメモリ上に展開．
        // ここでバグが発生しても，annotationHint データベース更新が不能になる以外のトラブルを
        // 起こさない(フォールトトレラント)．
        bootUpWithLoadDataBase = function(){
            loadDataBase(callback);
            sys.puts('ChunkData フォルダの json ファイルの取得に失敗しました．'.red);
            sys.puts('代わりに loadDataBase で起動します...'.red);
        };
        
        initAnnotationHintDataBase(); // AnnotationHintDataBase の雛形を生成してからデータベースを構成．

        // extendedFs.readFilesAsync('../ChunkData', 'json', function(chunkData){  // moduleTest 時のファイルパス
        extendedFs.readFilesAsync('./ChunkData', 'json', function(chunkData, isError){
            // readFilesAsync は [{'ファイル名':ファイルデータ}, {'ファイル名':ファイルデータ}...] を返却する．
            // (1) まず，ファイルを1つずつ読み込む. 
            if(isError){
                if(callback) bootUpWithLoadDataBase(callback);                    
            }else{
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
                            if(callback) bootUpWithLoadDataBase(callback);    
                            console.log(e);
                            sys.puts('chunkData個別処理でエラー．annotationHintDataBase を更新できません．'.red);
                            break;
                        }
                    }catch(e){
                        if(callback) bootUpWithLoadDataBase(callback);
                        console.log(e);
                        sys.puts('chunkData全体処理でエラー．annotationHintDataBase を更新できません．'.red);
                        break;
                    }

                }
                // console.log(chunkData);           

                // 最新の annotationHintDataBase はメモリ内で構成されているため，最新の database を saveDataBaseAsJson で
                // 保存してから loadDataBase する必要はない．
                if(callback) saveDataBaseAsJson(callback);
            }
        });
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // AnnotationHintDataBase の検索用メソッド．
    // 引数 chunkData 内のチャンク中央の音符列番号 chunkMiddleLine などをキーに関連するアノテーションを検索．
    // 引数 option はクライアントの ChunkPianoSystem_client.annotationDomRenderer.js で指定された検索オプション．
    // option の例...
    /*
        annotationHintSearchOption = { // サーバで annotationHint をサーチする際のオプション
           patternChunk:true,    // patternChunk をサーチ対象に入れるか否か．
           phraseChunk :true,
           hardChunk   :true,
           summaryChunk:true,
           margin      :5,       // chunk の chunkMiddleLine から +- いくつまで検索対象に入れるか．
           order       :'normal' // todo: 何を優先して検索するかを指定して検索できるようにする．normal はdbのインデックス順にそのまま返却するモード．
        }
    */
    search = function(chunkData, option){
        try{        
            var searchRangeMin = chunkData.chunkMiddleLine - option.margin, // チャンクの中央音符列位置を基に検索範囲を計算.
                searchRangeMax = chunkData.chunkMiddleLine + option.margin,
                searchResult = {},
                tmp_searchedNoteLine
            ;
            // console.log(annotationHintDataBase);
            
            // searchRangeMin が 0 以下の場合は検索不可なので 0 に修正
            if(searchRangeMin < 0){
                searchRangeMin = 0;
            }
            // TurcoScore の場合は searchRangeMax が 82 以上の場合は検索不可なので 82 に修正．        
            if(searchRangeMax > noteLineLength){
                searchRangeMax = noteLineLength;   
            }

            // console.log(chunkData);
            // console.log(option);
            // console.log('searchRangeMin: ' + searchRangeMin);
            // console.log('searchRangeMax: ' + searchRangeMax);      

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
            // 条件に適合する検索結果が無い場合は {} が return される．
            // console.log(searchResult);
            return searchResult;
        }catch(e){
            sys.puts('Error occured in AnnotationHintDataBaseProcessor.search'.red);
            return 'error'; // 検索操作中に error が発生した際は server に文字列を返却し伝達．
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    saveDataBaseAsJson = function(callback){
        var strinfiedAnnotationHintDataBase = JSON.stringify(annotationHintDataBase);
        // extendedFs.writeFile('../AnnotationHintDataBase.json', strinfiedAnnotationHintDataBase, function(err){ // moduleTest 時のファイルパス
        extendedFs.writeFile('./AnnotationHintDataBase.json', strinfiedAnnotationHintDataBase, function(err){
           if(err){
               console.log(err);
           }else{
               if(callback) callback();
               sys.puts('AnnotationHintDataBase updated.'.green);
           }
        });  
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    // uppdateDataBase をせずに，既に構成されている AnnotationHintDataBase.json をロードする．
    // AnnotationHintDataBase が肥大化し構成に時間がかかる場合は loadDataBase を利用し，
    // uppdateDataBase は一定時間毎に行うようにする．
    loadDataBase = function(callback){
        try{
            annotationHintDataBase = extendedFs.readFileSync('./AnnotationHintDataBase.json', 'utf-8');
            // annotationHintDataBase = extendedFs.readFileSync('../UserDataBase.json', 'utf-8'); // moduleTest 時のファイルパス
            annotationHintDataBase = JSON.parse(annotationHintDataBase);
            if(callback) callback();
            sys.puts('AnnotationHintDataBase loaded.'.green);
        }catch(e){
            if(callback) callback();
            console.log(e);
            sys.puts('Error occured in loadDataBase.'.red);
            sys.puts('AnnotationHintDataBase が構成されていない可能性があります.'.red);
            sys.puts('uppdateDataBase で起動してください．'.red);
            // ここで updateDataBase で起動するようにすると，updateDataBase で error が発生した際に
            // loadDataBase が起動するようになっているので，無限ループに陥る可能性がある．
            // そのため，loadDataBase が失敗した際は AnnotationHintDataBase のメモリ展開を行わず
            // 機能を低下させ server を実行する．
        }
    };
    //////////////////////////////////////////////
    //////////////////////////////////////////////
    return {loadDataBase:loadDataBase, uppdateDataBase:uppdateDataBase, search:search};
// }; // moduleTest の際はこちらを有効化.
})(); // node module として利用する際はこちらを有効化. 
//////////////////////////////////////////////
//////////////////////////////////////////////
/*
(function moduleTest(){
    var ahdbp = AnnotationHintDataBaseProcessor();
    ahdbp.uppdateDataBase();
})();
*/