ChunkPianoSystem_client.domRenderer = function(globalMemCPSDDR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var domUtil = ChunkPianoSystem_client.utility(),
        createChunkDom, getChunkHeadLine
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // todo: チャンクを複数に分けて描画した際の link を指定する引数 parentChunk を追加
    // このメソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
    // for in 文で回し1つずつ描画する．
    createChunkDom = function(chunkPropCCD){ 
        // Chunk のサイズが 0 の時には Chunk を描画しない．
        if((chunkPropCCD.width  != 0 && chunkPropCCD.width  != null && chunkPropCCD.width  != undefined ) ||
           (chunkPropCCD.height != 0 && chunkPropCCD.height != null && chunkPropCCD.height != undefined )
          ){

            var render, chunkDom, chunkDomId, chunkDomDelBtn; 
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
                chunkDomId = String() + chunkPropCCD.chunkType + 'Chunk_' + globalMemCPSDDR.patternChunkCount;
                chunkDom = $('<div class="chunk pattern" id="' + chunkDomId + '"></div>');

                chunkDom.css({ // jQuery で dom の css を変更するときの書法
                    'top'   : chunkPropCCD.top    + 'px',
                    'left'  : chunkPropCCD.left   + 'px',
                    'width' : chunkPropCCD.width  + 'px',
                    'height': chunkPropCCD.height + 'px'
                });

                chunkDom.mousedown(function(){
                    globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
                });
                
                domUtil.appendDruggAndDropEvent(chunkDom, globalMemCPSDDR.chunkDrawingArea);
                ///////////////////////////////////////////////
                ///////////////////////////////////////////////
                // chunk 消去ボタンのテンプレート生成，css 計算，イベント付与
                chunkDomDelBtn = $('<div class="chunkDeleteButton" id="' + chunkDomId +'_DeleteButton">' + 
                                        '<p class="chunkDeleteButtonFont">×</p>' + 
                                   '</div>'
                                  )
                ;

                chunkDomDelBtn.click(function(){
                    var parentChunkDom = $(this).parent(),
                        parentChunkDomId = parentChunkDom[0].id
                    ;
                    parentChunkDom.remove(); // クリックされた chunkDomDelBtn の親要素 == ユーザが消したい chunk dom
                    // html の chunkDom の削除と同時に オブジェクトのデータ構造内の該当する chunkDom も削除．
                    // !!!! ChunkDom 関連の実装を拡張する際は，オブジェクトのデータ構造とDOMの状態をバラバラにしないように細心の注意を !!!!
                    delete globalMemCPSDDR.chunkDataObj.chunkData[parentChunkDomId];
                    globalMemCPSDDR.isEditedByChunkMovingOrDelete = true;
                    console.log(globalMemCPSDDR.chunkDataObj);
                });

                chunkDom.append(chunkDomDelBtn);
                // html への chunkDom の追加と同時に オブジェクトのデータ構造にも chunkDom を追加．
                globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] = {
                    left       : chunkPropCCD.left,
                    top        : chunkPropCCD.top,
                    width      : chunkPropCCD.width,
                    height     : chunkPropCCD.height,
                    chunkType  : chunkPropCCD.chunkType,
                    parentChunk: null
                };
                
                globalMemCPSDDR.chunkDrawingArea.append(chunkDom);
                console.log(globalMemCPSDDR.chunkDataObj);
                
                if(chunkPropCCD.chunkType == 'pattern'){
                    globalMemCPSDDR.patternChunkCount++; // todo: phraseChunk, hardChunk 描画時のカウンティング処理を追加
                }
            };          
            ///////////////////////////////////////////////
            ///////////////////////////////////////////////
            // noteLinePosition が正しく受信されていない場合，チャンクの頭出し位置を計算できない．
            // その場合は main class の reqNoteLinePosition を呼び出し再受信する．
            if(globalMemCPSDDR.noteLinePosition == null || globalMemCPSDDR.noteLinePosition == undefined){
                globalMemCPSDDR.reqNoteLinePosition(function(){
                    // console.log('----- reqNoteLinePositionCallback -----');
                    // console.log(globalMemCPSDDR.noteLinePosition);
                    render();
                });
                return 0; // return しないと render が2度実行されてしまう．
            }
            // console.log(globalMemCPSDDR.noteLinePosition);
            render(); // 上記if文より下で実行すること．実行順序を入れ替えると，noteLinePosition を再受信した際に render が2度実行される．
        }else{
            console.log('createChunkDom; size 0');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    getChunkHeadLine = function(){     // チャンクの左辺の位置情報から最近傍の音符列を取得するメソッド.
        
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{createChunkDom:createChunkDom};
};