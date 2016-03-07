ChunkPianoSystem_client.annotationHintDomRenderer = function(globalMemCPSAHDR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var createAnnotationHintDom, removeAnnotationHintDom, creadAndAppendAnnotationHintTxtDom;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    createAnnotationHintDom = function(parentAnnotationDomCAHD, chunkDataCAHD){ 
        
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
        creadAndAppendAnnotationHintTxtDom('上田', 'コードがずっとA minor なので同じ運指を繰り返すだけで良い．', annotationHintListWrapperDom);
        creadAndAppendAnnotationHintTxtDom('岩淵', 'スタッカートを意識しながら跳ねるように演奏すると上手くいく．', annotationHintListWrapperDom);
        creadAndAppendAnnotationHintTxtDom('Okura', 'ここは小指，人差し指，親指で演奏すると鍵盤を見なくても弾けた．', annotationHintListWrapperDom);
        creadAndAppendAnnotationHintTxtDom('Kobayashi', '同じ運指の連続で左手は簡単．右手に意識を集中する．', annotationHintListWrapperDom);
        creadAndAppendAnnotationHintTxtDom('Mito', '最後の部分だけ左手のパターンが変わるので要注意!', annotationHintListWrapperDom);
        
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
    creadAndAppendAnnotationHintTxtDom = function(annotationUserName, innerText, parentDom){

        var 
            annotationHintListDom = $('<div class="annotationHintList fade"></div>'),
            hintAnnotationUserNameDom = $('<p class="hintAnnotationUserName">' + annotationUserName + ' さん</p>'),
            annotationHintTxtDom = $('<textarea class="annotationHintTxt" cols="50" rows="2" readonly>' + String() + innerText + '</textarea>'),
            refBtnDom = $('<div class="button refBtn">引用する</div>')
        ;
        
        refBtnDom.click(function(){
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