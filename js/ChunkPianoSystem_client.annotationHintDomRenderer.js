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
        
        // annotationHintDataBase から出力された検索結果オブジェクト hintChunkDataCAHD の例(一部，2016/4/1時点，検索オプションによって異なる): 
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
        // hdb とは annotationHintDataBase を意味する．
        // annotationHintDataBase から出力された検索結果オブジェクト hintChunkDataCAHD を全探索し annotationHintDom を描画．
        for(var hDbLine in hintChunkDataCAHD){ 
            for(var hDbChunkType in hintChunkDataCAHD[hDbLine]){
                for(var hDbUserName in hintChunkDataCAHD[hDbLine][hDbChunkType]){
                    for(var hDbPracticeDay in hintChunkDataCAHD[hDbLine][hDbChunkType][hDbUserName]){
                        for(var hDbChunkData in hintChunkDataCAHD[hDbLine][hDbChunkType][hDbUserName][hDbPracticeDay]){
                            creadAndAppendAnnotationHintTxtDom(
                                hDbUserName + 'さん，' + hDbPracticeDay + '日目', // todo: 練習日数の表示は別domで行う方が良いかもしれない．
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
            top : parentAnnotationDomCAHD[0].clientTop + parentAnnotationDomCAHD[0].clientHeight + MARGIN_Y,
            left: parentAnnotationDomCAHD[0].clientLeft
        });
        
        domUtil.appendDruggAndDropEvent(annotationHintWrapperDom, globalMemCPSAHDR.annotationTextFlame);
        
        globalMemCPSAHDR.annotationTextFlame.append(annotationHintWrapperDom);
        
        autosize($('textarea')); // chunk annotation 入力用 textarea を自動可変に変更．
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    creadAndAppendAnnotationHintTxtDom = function(annotationUserName, innerText, parentDom, parentAnnotationDom){

        var annotationHintListDom = $('<div class="annotationHintList fade"></div>'),
            hintAnnotationUserNameDom = $('<p class="hintAnnotationUserName">' + annotationUserName + '</p>'),
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
        try{
            $('.annotationHintWrapper').remove();
        }catch(e){
            console.log(e);   
            console.error('Error occured in removeAnnotationHintDom.');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{createAnnotationHintDom:createAnnotationHintDom, removeAnnotationHintDom:removeAnnotationHintDom};
};