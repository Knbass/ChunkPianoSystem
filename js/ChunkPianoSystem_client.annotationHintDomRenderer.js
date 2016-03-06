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
        annotationHintInstDom = $('<p class="annotationHintInst">他の学習者は類似する部分に以下の<br>アノテーションを付与しています:</p>');
        annotationHintDeleteButtonDom = $('<div class="annotationHintDeleteButton"><p class="chunkDeleteButtonFont">×</p></div>>');
        annotationHintDeleteButtonDom.click(function(){
            removeAnnotationHintDom(); 
        });
        annotationHintWrapperDom.append(annotationHintInstDom);
        annotationHintWrapperDom.append(annotationHintDeleteButtonDom);
        
        annotationHintListWrapperDom = $('<div class="annotationHintListWrapper"></div>');                
        
        // ↓ for dev
        // アノテーションヒントの dom は creadAndAppendAnnotationHintTxtDom で生成する．
        for(var i = 0; i<10; i++){
            creadAndAppendAnnotationHintTxtDom('Unknown', 'testtesttesttessttesttesttesttesttesttesttesttesttesttesttest', annotationHintListWrapperDom);
        }
        
        annotationHintWrapperDom.append(annotationHintListWrapperDom);
            
        console.info('parentAnnotationDomCAHD[0].clientTop: ' + parentAnnotationDomCAHD[0].clientTop);
        console.info('parentAnnotationDomCAHD[0].clientHeight: ' + parentAnnotationDomCAHD[0].clientHeight);
        console.info('parentAnnotationDomCAHD[0].clientLeft: ' + parentAnnotationDomCAHD[0].clientLeft);
        
        
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