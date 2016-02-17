ChunkPianoSystem_client.domRenderer = function(globalMemCPSDDR){ 
    
    var domUtil = ChunkPianoSystem_client.utility(),
        createChunkDom
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

            var chunkDom, chunkDomId, chunkDomDelBtn; 

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

            chunkDomId = String() + chunkPropCCD.chunkType + 'Chunk_' + globalMemCPSDDR.patternChunkCount;
            chunkDom = $('<div class="chunk pattern" id="' + chunkDomId + '"></div>');

            chunkDom.css({ // jQuery で dom の css を変更するときの書法
                'top'   : chunkPropCCD.top    + 'px',
                'left'  : chunkPropCCD.left   + 'px',
                'width' : chunkPropCCD.width  + 'px',
                'height': chunkPropCCD.height + 'px'
            });

            domUtil.appendDruggAndDropEvent(chunkDom, globalMemCPSDDR.chunkDrawingArea);

            chunkDomDelBtn = $('<div class="chunkDeleteButton" id="' + chunkDomId +'_DeleteButton">' + 
                                    '<p class="chunkDeleteButtonFont">×</p>' + 
                               '</div>'
                              )
            ;

            chunkDomDelBtn.click(function(){
                var parentChunkDom = $(this).parent(),
                    parentChunkDomId = parentChunkDom[0].id
                ;
                parentChunkDom.remove();
                // html の chunkDom の削除と同時に オブジェクトのデータ構造にも chunkDom を削除．
                delete globalMemCPSDDR.chunkDataObj.chunkData[parentChunkDomId];
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true;
                console.log(globalMemCPSDDR.chunkDataObj);
            });

            chunkDom.mousedown(function(){
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
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
            console.log(globalMemCPSDDR.chunkDataObj);

            globalMemCPSDDR.chunkDrawingArea.append(chunkDom);

            if(chunkPropCCD.chunkType == 'pattern'){
                globalMemCPSDDR.patternChunkCount++; // todo: phraseChunk, hardChunk 描画時のカウンティング処理を追加
            }
        }else{
            console.log('createChunkDom; size 0');
        }
    };
    
    return{createChunkDom:createChunkDom};
};