
// chunk 描画，位置計算モジュール．
// createChunkDom: マウスによって入力された chunk を描画するだけでなく，保存された chunkDataObj からチャンクを再描画する際にも利用される．
//                 また，chunkDataObj の生成も本メソッドで行う．
//                 ★ 生成される chunkDataObj の例 (2016/4/1時点)
/*
                        {
                            "userName": "Iwabuchi",
                            "chunkData": {
                                "hardChunk_0": {
                                    "chunkDomId": "hardChunk_0",
                                    "left": 81,
                                    "top": 90,
                                    "width": 159,
                                    "height": 37,
                                    "stringScoreCol": "0",
                                    "chunkMiddleAxisY": 108,
                                    "chunkType": "hard",
                                    "chunkHeadLine": 0,
                                    "chunkTailLine": 4,
                                    "chunkMiddleLine": 2,
                                    "parentChunk": null,
                                    "good": null,
                                    "chunkAnnotationText": "和音が出てきた時に左手がついてこない"
                                }
                            },
                            "practiceDay": "1"
                        }
*/
// todo: chunkData に自身が付与された譜面段番号を持たせる．
// todo: chunkDomDelBtn 描画モジュールを分離．annotationHintDomRenderer でも chunkDomDelBtn 作成処理を行っているので，
//       共通化する．
ChunkPianoSystem_client.chunkDomRenderer = function(globalMemCPSDDR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var domUtil = ChunkPianoSystem_client.utility(),
        createChunkDom, selectChunkDom, getChunkHeadTailMidlleLine, getSortedChunkHeadLine
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /*
        createChunkDom は chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
        for in 文で回し1つずつ描画する．
        
        createChunkDom は 2通りの呼び出され方があり，両者で chunkPropCCD の内容が異なる．
            1. ユーザのマウス操作でチャンクが描画された時.
                この時は
                    {
                        left       : chunkDrawingAreaMouseDowmPosX,
                        top        : chunkDrawingAreaMouseDowmPosY,
                        width      : chunkSizeX,
                        height     : chunkSizeY,
                        chunkType  : globalMemCPSCIDA.nowChunkMode,
                        parentChunk: null
                    }
                という形式のオブジェクトを受け取る．

            2. ユーザがファイル読込ボタンをクリックしロードされた chunkData json (パース済) 
                この時は parse 済 json
                    {
                        hardChunk_0: {
                            chunkDomId : "hardChunk_0",
                            left       : 81,
                            top        : 90,
                            width      : 159,
                            height     : 37,
                            stringScoreCol   : "0",
                            chunkMiddleAxisY : 108,
                            chunkType      : "hard",
                            chunkHeadLine  : 0,
                            chunkTailLine  : 4,
                            chunkMiddleLine: 2,
                            parentChunk : null,
                            good        : null,
                            chunkAnnotationText: "和音が出てきた時に左手がついてこない"
                        }
                    }
                という形式のオブジェクトを受け取る．
        
        ★しかし，どちらの場合でも chunkDataObj は createChunkDom の chunk 描画処理に基づいて再構成される 
          (例えば chunkDomId は再度付与される) 点に留意すること．
    */
    // todo: チャンクを複数に分けて描画した際の link を指定する引数 parentChunk を追加．
    createChunkDom = function(chunkPropCCD){ 
        // Chunk のサイズが 0 の時には Chunk を描画しない．
        if((chunkPropCCD.width  != 0 && chunkPropCCD.width  != null && chunkPropCCD.width  != undefined ) ||
           (chunkPropCCD.height != 0 && chunkPropCCD.height != null && chunkPropCCD.height != undefined )
          ){
            var render, chunkDom, chunkDomId, chunkDomDelBtn; 
            // console.log(globalMemCPSDDR.noteLinePosition);
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            // noteLinePosition が正しく受信されている / されていない で chunk 描画処理の順番を変更する必要がある．
            // そのため，チャンク描画処理を render 関数としてまとめた．
            render = function(){
                // マウスドラッグの x 方向がマイナス方向だった時に正しく描画するための処理．
                if(chunkPropCCD.width < 0){ 
                    chunkPropCCD.left += chunkPropCCD.width;
                    chunkPropCCD.width = Math.abs(chunkPropCCD.width); // Math.abs() は絶対値を返す．
                }
                // マウスドラッグの y 方向がマイナス方向だった時
                if(chunkPropCCD.height < 0){ 
                    chunkPropCCD.top += chunkPropCCD.height;
                    chunkPropCCD.height = Math.abs(chunkPropCCD.height);
                }
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                // chunk dom のテンプレート生成，描画位置情報を css に変換，イベント登録
                // done: pattern チャンク以外の処理を追加 
                // globalMem から該当する chunk の描画数カウント値 を取得し，id として付与．
                // patternChunk の場合，globalMemCPSDDR[chunkPropCCD.chunkType + 'ChunkCount'] は globalMemCPSDDR[patternChunkCount] となる．
                chunkDomId = String() + chunkPropCCD.chunkType + 'Chunk_' + globalMemCPSDDR[chunkPropCCD.chunkType + 'ChunkCount'];
                chunkDom = $('<div class="chunk ' + chunkPropCCD.chunkType + '" id="' + chunkDomId + '"></div>');

                chunkDom.css({ // jQuery で dom の css を変更するときの書法
                    'top'   : chunkPropCCD.top    + 'px',
                    'left'  : chunkPropCCD.left   + 'px',
                    'width' : chunkPropCCD.width  + 'px',
                    'height': chunkPropCCD.height + 'px'
                });
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                chunkDom.mousedown(function(){
                    globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
                });
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                chunkDom.mouseup(function(){
                    // solved: ここにチャンクの頭出し位置を計算する処理，データ構造にその情報を加える処理を追加．
                    //         この処理は DOM 追加時，mouseup 時の両方で行う必要あり．
                    //         mouseup で移動した後の css top, left を反映するのを忘れていた!
                    //         今は生成時の top, left が保持され続けている... 
                    
                    // this は mouseup された chunkDom 要素を指す，
                    // DOM アクセスには時間がかかるので，変数にキャッシュしてアクセス時間を減らす．
                    var mouseupedChunkDom = $(this),
                        mouseupedChunkDomData = globalMemCPSDDR.chunkDataObj.chunkData[mouseupedChunkDom[0].id]
                    ;
                    
                    mouseupedChunkDomData.left = parseInt(mouseupedChunkDom.css('left'), 10);
                    mouseupedChunkDomData.top = parseInt(mouseupedChunkDom.css('top'), 10);
                    
                    // マウスアップ時は再度 chunk の頭出し位置を算出し，chunkHeadLinePositions を再度ソートする．
                    getChunkHeadTailMidlleLine(mouseupedChunkDomData);
                    globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
                    
                    console.log(globalMemCPSDDR.chunkDataObj.chunkData);
                });
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                domUtil.appendDruggAndDropEvent(chunkDom, globalMemCPSDDR.chunkDrawingArea);
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                // chunk 消去ボタンのテンプレート生成，css 計算，イベント付与
                chunkDomDelBtn = $('<div class="chunkDeleteButton" id="' + chunkDomId +'_DeleteButton">' + 
                                        '<p class="chunkDeleteButtonFont">×</p>' + 
                                   '</div>'
                                  )
                ;
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                chunkDomDelBtn.click(function(){
                    var parentChunkDom = $(this).parent(),
                        parentChunkDomId = parentChunkDom[0].id
                    ;
                    parentChunkDom.remove(); // クリックされた chunkDomDelBtn の親要素 == ユーザが消したい chunk dom
                    globalMemCPSDDR.annotationDomRenderer.removeAnnotationDom(parentChunkDomId); // 対応するアノテーションも削除
                    
                    // html の chunkDom の削除と同時に オブジェクトのデータ構造内の該当する chunkDom も削除．
                    // !!!! ChunkDom 関連の実装を拡張する際は，オブジェクトのデータ構造とDOMの状態をバラバラにしないように細心の注意を !!!!
                    delete globalMemCPSDDR.chunkDataObj.chunkData[parentChunkDomId];
                    
                    globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // 編集モードを編集済に変更．別ファイルロード時に保存の確認を行う．
                    // chunk が消された状態で chunk の頭出し位置を更新する．
                    globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
                    console.log(globalMemCPSDDR.chunkDataObj);
                    // annotation hint 表示中に chunk が消去された際は annotationHintDom を削除．
                    globalMemCPSDDR.annotationHintDomRenderer.removeAnnotationHintDom();
                });

                chunkDom.append(chunkDomDelBtn);
            
                // html への chunkDom の追加と同時に オブジェクトのデータ構造にも chunkDom を追加．
                // todo: globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] (domrenderer), chunkPropaties (initDomAction) など，
                //       同じ情報もしくはその拡張を複数箇所で定義しており，バグを生みやすい状況にある．
                //       object の ファクトリ関数を定義し，最初から全てのプロパティを定義し，サブクラスでプロパティを拡張しないようにする．
                //       現状ではオブジェクトプロパティを確認するにはプログラムを実行する必要があり，メンテナンス性が低い!!!
                globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] = {
                    chunkDomId      : chunkDomId,
                    left            : chunkPropCCD.left,
                    top             : chunkPropCCD.top,
                    width           : chunkPropCCD.width,
                    height          : chunkPropCCD.height,
                    stringScoreCol  : null, // 楽譜の何段目の音符列かを格納．オブジェクトのキーに利用するためStringにする，1段目の場合は '1'
                    chunkMiddleAxisY: chunkPropCCD.top + (Math.floor(chunkPropCCD.height / 2)),
                    chunkType       : chunkPropCCD.chunkType, // 本メソッドで拡張したプロパティ．ファクトリ関数で最初から生成するように変更すべし．
                    chunkHeadLine   : null, // getChunkHeadTailMidlleLine は stringScoreCol や chunkMiddleAxisY を利用するのでここではまだ実行してはいけない．
                    chunkTailLine   : null,
                    chunkMiddleLine : null,
                    parentChunk     : chunkPropCCD.parentChunk,  // 本メソッドで拡張したプロパティ．ファクトリ関数で最初から生成するように変更すべし．
                    good            : chunkPropCCD.good == undefined ? null : chunkPropCCD.good, // 三項演算子を利用．
                    chunkAnnotationText : null // annotationDomRenderer モジュールによって定義される．
                };
                // チャンクの中央 y 座標から，譜面の何段目に付与されたチャンクかを判定．
                // todo: これではハードコーディングになっているので修正すべき．
                //       ScoreDataParser で同様の処理を行っているので，そこで譜面段情報を付与するように修正．
                globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId].stringScoreCol = (function(){                    
                    if(globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId].chunkMiddleAxisY <= globalMemCPSDDR.noteLinePosition.middleAxisY){
                        return '0';
                    }else{
                        return '1';
                    }
                })();
                // チャンクの頭出し位置，終了位置，中心位置を計算し，chunkData に格納．
                getChunkHeadTailMidlleLine(globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId]);
                // チャンクのアノテーションテキストは globalMemCPSDDR.chunkDataObj.chunkData で一括に管理する．
                // 以下はアノテーションテキストが存在しない chunkData の処理．
                if(chunkPropCCD.chunkAnnotationText == undefined || chunkPropCCD.chunkAnnotationText == null || 
                   chunkPropCCD.chunkAnnotationText == '' || chunkPropCCD.chunkAnnotationText == false)
                {
                    globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId].chunkAnnotationText = '';
                }else{
                    globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId].chunkAnnotationText = chunkPropCCD.chunkAnnotationText;
                }

                // グローバルメンバの chunkHeadLinePositions にソート済みのチャンク頭出し位置を配列で格納
                // todo : この処理は delete, mouseup の際にも行う必要あり，
                //        それぞれの処理を終えてからこの処理を行うこと!!
                globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
                
                globalMemCPSDDR.chunkDrawingArea.append(chunkDom);
                console.log(globalMemCPSDDR.chunkDataObj);
                
                // 数行前の処理で作成した chunk データをもとにアノテーションを生成．
                globalMemCPSDDR.annotationDomRenderer.createAnnotationDom(globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId]);
                
                // chunk type 毎に個数をカウンティング．
                switch(chunkPropCCD.chunkType){
                    case 'pattern':
                        globalMemCPSDDR.patternChunkCount++;
                        break;
                    case 'phrase':
                        globalMemCPSDDR.phraseChunkCount++;
                        break;
                    case 'hard':
                        globalMemCPSDDR.hardChunkCount++;
                        break;    
                    case 'summary':
                        globalMemCPSDDR.summaryChunkCount++;
                }
            };
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            // noteLinePosition が正しく受信されていない場合，チャンクの頭出し位置を計算できない．
            // その場合は main class の reqNoteLinePosition を呼び出し再受信する．
            if(globalMemCPSDDR.noteLinePosition == null || globalMemCPSDDR.noteLinePosition == undefined){
                globalMemCPSDDR.reqNoteLinePosition(function(){ // reqNoteLinePosition のコールバックは noteLinePosition が受信された際に実行される．
                    // console.log('----- reqNoteLinePositionCallback -----');
                    // console.log(globalMemCPSDDR.noteLinePosition);
                    render();
                });
                return 0; // return しないと render が2度実行されてしまう．
            }
            // chunk 描画時は annotation hint が表示されていると重なってしまうので，chunk 描画前に annotationHintDom を削除する．
            globalMemCPSDDR.annotationHintDomRenderer.removeAnnotationHintDom();
            // console.log(globalMemCPSDDR.noteLinePosition);
            render(); // 上記if文より下で実行すること．実行順序を入れ替えると，noteLinePosition を再受信した際に render が2度実行される．
        }else{
            console.log('createChunkDom; size 0');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // 引数として与えられた chunkDomId の chunk を選択状態(色を変化させる) にする．
    selectChunkDom = function(chunkDomIdSCD){
        $('.chunk').each(function(index, element){
            $(element).removeClass('selected');
        });
        $('#' + chunkDomIdSCD).addClass('selected');
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // chunk の先頭，中央，末尾の該当音符列を検索する．
    ////////////////////////////////////////    ↓ チャンク先頭の音符番号を取得する際は 'head'，末尾であれば 'tail'
    getChunkHeadTailMidlleLine = function(chunkDataGCL){     // チャンクの左辺の位置情報から最近傍の音符列を取得するメソッド.
        
        var getPositionByBruteForceSearch, searchLine, searchStartLine, searchEndLine, 
            noteLine =  globalMemCPSDDR.noteLinePosition.noteLine
        ;
        
        // 2分木探索によるチャンク頭出し音符列の算出
        // getPosition = function(startIndex, endIndex, notePositionArray){
	       // var arrayCenterIndex = null;
        // };
        
        // 力任せ法によるチャンク頭出し音符列の算出
        // todo: チャンク頭出し音符列の算出方法を2分木探索に変更し計算量を減らす．
        // chunlDom の left だけで頭出し位置を計算すると，1段目に付与したチャンクなのに2段目の音符x座標で頭出しされる
        // 可能性がある．そのため，chunkDom のstringScoreColの値を利用し，譜面の n 段目のみを探索するようにしている．
        // ある音符が譜面の何段目かの処理をクライアントで行っているが，この処理はScoreDataParser で一括に行うべきだ．
        getPositionByBruteForceSearch = function(startIndex, endIndex, chunkLeftPosition, notePositionArray, isTail){
            var euclidDistance = 0,
                nearestNotePosition = null
            ;
            for(var i = startIndex; i<= endIndex; i++){
                // console.log(notePositionArray[i]);
                euclidDistance = chunkLeftPosition - notePositionArray[i].axisX;
                
                if(euclidDistance < 0){ // チャンクの左辺 - 音符列の x 座標がマイナスになった瞬間が，チャンク内の左端の音符列
                    nearestNotePosition = i;
                    break;
                }
            }
            
            // 右辺の音符番号は1つ引いた値が正しい音符番号となる．
            if(isTail){
                // todo: チャンクが1音符列分しか囲っていない場合，不正な値になるのを修正．
                //       head と tail が同じときは nearestNotePosition-- をしない．
                if(nearestNotePosition > 0){
                    nearestNotePosition--;
                }
            }
            
            return nearestNotePosition;
        };
        
        // 譜面上段の場合，下段の場合で探索すべき範囲が異なるので，ここで範囲を指定する．
        // 例えば，上段の場合は音符番号の 0~48 までを探索する．下段まで探索すると正しい結果が得られないので注意．
        // n 段目がどこまでの音符番号を含むかは globalMemCPSDDR.noteLinePosition.scoreCol に格納されている．
        // オブジェクトへの参照回数を減らすために，変数に代入する．
        searchStartLine = globalMemCPSDDR.noteLinePosition.scoreCol[chunkDataGCL.stringScoreCol].start;
        searchEndLine   = globalMemCPSDDR.noteLinePosition.scoreCol[chunkDataGCL.stringScoreCol].end;
        // チャンク頭出し位置の算出
        // 頭出し位置はチャンクの左辺なので，left の位置で音符列をサーチする．
        searchLine = parseInt(chunkDataGCL.left, 10);
        chunkDataGCL.chunkHeadLine = +getPositionByBruteForceSearch(searchStartLine, searchEndLine, searchLine, noteLine, false);
        // チャンク終了位置の算出
        // チャンク終了位置はチャンクの右辺なので，left + width の位置で音符列をサーチする．
        searchLine= chunkDataGCL.left + chunkDataGCL.width;
        searchLine = parseInt(searchLine, 10);
        chunkDataGCL.chunkTailLine = +getPositionByBruteForceSearch(searchStartLine, searchEndLine, searchLine, noteLine, true);
        // chunk 中心音符列の算出．
        // これは annotationHintDataBase の作成時にインデックスとして利用する．
        chunkDataGCL.chunkMiddleLine = Math.floor((chunkDataGCL.chunkHeadLine + chunkDataGCL.chunkTailLine) / 2);
        
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // chunkData は全ての chunk の描画情報を格納したオブジェクト．
    // これを
    getSortedChunkHeadLine = function(chunkData){
        
        try{        
            var sortedChunkHeadLine = []; 

            for(var chunk_dom_id in chunkData){
                // css プロパティは勝手に string に変換されている場合があるので　parseInt を忘れずに行う．
                sortedChunkHeadLine.push(parseInt(chunkData[chunk_dom_id].chunkHeadLine, 10));
            }
            // 値を昇順にソート
            sortedChunkHeadLine.sort(function(a,b){
                return a - b;
            });
            console.info(sortedChunkHeadLine);
            return sortedChunkHeadLine;
        }catch(e){
            console.log(e);
            console.error('chunkHeadLine が計算されていない可能性があります．getChunkHeadTailMidlleLine を実行してから本メソッドを実行してください．');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{createChunkDom:createChunkDom, selectChunkDom:selectChunkDom};
};