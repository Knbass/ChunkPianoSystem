ChunkPianoSystem_client.annotationHintDomRenderer = function(globalMemCPSAHDR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var createAnnotationHintDom, removeAnnotationHintDom, creadAndAppendAnnotationHintTxtDom;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    createAnnotationHintDom = function(parentAnnotationDomCAHD, hintChunkDataCAHD){ 
        
        var annotationHintWrapperDom, annotationHintInstDom, annotationHintDeleteButtonDom, 
            annotationHintListWrapperDom, annotationHintListDom, hintAnnotationUserNameDom, refBtnDom, annotationHintTxtDom,
            domUtil = ChunkPianoSystem_client.utility(),
            MARGIN_Y = 20 // annotationTextWrapper よりも MARGIN_Y 分 下に annotationHintDom を表示．
        ;
        
        // アノテーション用 dom のtemplate生成．それぞれのDomにイベントを定義する可能生があるので個別に生成．
        // todo: イベントを定義しない dom template は個別でなくまとめて生成する．
        annotationHintWrapperDom = $('<div class="annotationHintWrapper"></div>');
        annotationHintWrapperDom.scroll(function(e){
            e.preventDefault(); // todo: スクロール中は親要素上でのスクロールを禁止．これは正しく動作していない．
        });
        annotationHintInstDom = $('<p class="annotationHintInst">他の学習者は類似する部分に以下の<br>アノテーションを付与しています:</p>');
        annotationHintDeleteButtonDom = $('<div class="annotationHintDeleteButton"><p class="chunkDeleteButtonFont">×</p></div>>');
        annotationHintDeleteButtonDom.click(function(){
            removeAnnotationHintDom(); 
        });
        annotationHintWrapperDom.append(annotationHintInstDom);
        annotationHintWrapperDom.append(annotationHintDeleteButtonDom);
        
        annotationHintListWrapperDom = $('<div class="annotationHintListWrapper"></div>');                
        
        // ↓ for dev & demo
        // todo: サーバから annotation hint をダウンロードし表示するように変更．
        //       サーバで annotation hint db を作成するモジュールを作成．
        //       annotation hint の chunktype を表示するようにする．
        // アノテーションヒントの dom は creadAndAppendAnnotationHintTxtDom で生成する．
        //creadAndAppendAnnotationHintTxtDom('上田', 'コードがずっとA minor なので同じ運指を繰り返すだけで良い．', 
        //                                   annotationHintListWrapperDom, parentAnnotationDomCAHD);
        //creadAndAppendAnnotationHintTxtDom('岩淵', 'スタッカートを意識しながら跳ねるように演奏すると上手くいく．', 
        //                                   annotationHintListWrapperDom, parentAnnotationDomCAHD);
        //creadAndAppendAnnotationHintTxtDom('Okura', 'ここは小指，人差し指，親指で演奏すると鍵盤を見なくても弾けた．', 
        //                                   annotationHintListWrapperDom, parentAnnotationDomCAHD);
        
        // hdb とは annotationHintDataBase を意味する．
        // annotationHintDataBase のキーの従い annotationHintDataBase を探索し annotationHintDom を描画
        for(var hDbLine in hintChunkDataCAHD){ 
            for(var hDbChunkType in hintChunkDataCAHD[hDbLine]){
                for(var hDbUserName in hintChunkDataCAHD[hDbLine][hDbChunkType]){
                    for(var hDbPracticeDay in hintChunkDataCAHD[hDbLine][hDbChunkType][hDbUserName]){
                        for(var hDbChunkData in hintChunkDataCAHD[hDbLine][hDbChunkType][hDbUserName][hDbPracticeDay]){
                            creadAndAppendAnnotationHintTxtDom(
                                hDbUserName, 
                                hintChunkDataCAHD[hDbLine][hDbChunkType][hDbUserName][hDbPracticeDay][hDbChunkData].chunkAnnotationText, 
                                annotationHintListWrapperDom, parentAnnotationDomCAHD
                            );
                        } 
                    }          
                }          
            }  
        }
        
        annotationHintWrapperDom.append(annotationHintListWrapperDom);
            
        // console.info('parentAnnotationDomCAHD[0].clientTop: ' + parentAnnotationDomCAHD[0].clientTop);
        // console.info('parentAnnotationDomCAHD[0].clientHeight: ' + parentAnnotationDomCAHD[0].clientHeight);
        // console.info('parentAnnotationDomCAHD[0].clientLeft: ' + parentAnnotationDomCAHD[0].clientLeft);
        
        // todo: annotationWrapper の clientTop が正しく取得されていないことが原因の, annotationHintWrapperDom 表示位置バグを修正．
        annotationHintWrapperDom.css({
            top: parentAnnotationDomCAHD[0].clientTop + parentAnnotationDomCAHD[0].clientHeight + MARGIN_Y,
            left: parentAnnotationDomCAHD[0].clientLeft
        });
        
        domUtil.appendDruggAndDropEvent(annotationHintWrapperDom, globalMemCPSAHDR.annotationTextFlame);
        
        globalMemCPSAHDR.annotationTextFlame.append(annotationHintWrapperDom);
        
        autosize($('textarea')); // chunk annotation 入力用 textarea を自動可変に変更．
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    
    creadAndAppendAnnotationHintTxtDom = function(annotationUserName, innerText, parentDom, parentAnnotationDom){

        var 
            annotationHintListDom = $('<div class="annotationHintList fade"></div>'),
            hintAnnotationUserNameDom = $('<p class="hintAnnotationUserName">' + annotationUserName + ' さん</p>'),
            annotationHintTxtDom = $('<textarea class="annotationHintTxt" cols="50" rows="2" readonly>' + String() + innerText + '</textarea>'),
            refBtnDom = $('<div class="button refBtn">引用する</div>')
        ;
        
        refBtnDom.click(function(){
            var parentAnnotationHintDom = $(this).parent(),
                // クリックされた refBtnDom が所属する annotation hint div の textarea からヒント文を抽出．
                hintText = parentAnnotationHintDom.children('.annotationHintTxt').val(),
                chunkDomId = null
            ;
            // クリックされた refBtnDom が所属する annotation div の textarea に引用したヒント文 hintText を挿入．
            parentAnnotationDom.children('.annotationTxt').val(hintText);
            // データ構造にも引用を反映する．
            // parentAnnotationDom は id が annotationText_チャンクid となっているので，
            // annotationText_ を除去し chunkData 用のキーに整形． 
            chunkDomId = parentAnnotationDom[0].id;
            chunkDomId = chunkDomId.split('_');
            chunkDomId = String() + chunkDomId[1] + '_' + chunkDomId[2];
            globalMemCPSAHDR.chunkDataObj.chunkData[chunkDomId].chunkAnnotationText = hintText;

            removeAnnotationHintDom();
        });
        
        annotationHintListDom.append(hintAnnotationUserNameDom);
        annotationHintListDom.append(refBtnDom);
        annotationHintListDom.append(annotationHintTxtDom);
        
        parentDom.append(annotationHintListDom);
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    removeAnnotationHintDom = function(){
        $('.annotationHintWrapper').remove();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{createAnnotationHintDom:createAnnotationHintDom, removeAnnotationHintDom:removeAnnotationHintDom};
};