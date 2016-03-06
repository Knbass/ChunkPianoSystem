ChunkPianoSystem_client.annotationDomRenderer = function(globalMemCPSADR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var createAnnotationDom, removeAnnotationDom, selectAnnotationDom, selectGoodBtnDom, calcGoodCount;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    createAnnotationDom = function(annotationPropCAD){ 
        
        var annotationTxtWrapperDom, annotationChunkIdDom, goodBtnDom, hintBtnDom, annotationTxtDom
        
        // アノテーション用 dom のtemplate生成．それぞれのDomにイベントを定義する可能生があるので個別に生成．
        // todo: イベントを定義しない dom template は個別でなくまとめて生成する．
        annotationTxtWrapperDom = $('<div class="annotationTxtWrapper fade" id="annotationText_' + annotationPropCAD.chunkDomId + '"></div>');
        annotationChunkIdDom = $('<p class="annotationChunkId">' + annotationPropCAD.chunkDomId + '</p>');
        goodBtnDom = $('<div class="button goodBtn">いいね! ' + calcGoodCount(annotationPropCAD) + '</div>');
        // 自分がいいね! を押したアノテーションのいいね!ボタンの色を変更．
        (function(){
            try{
                var goodIndex = annotationPropCAD.good.indexOf(String() + globalMemCPSADR.chunkDataObj.userName);
                if(goodIndex == -1){ // ユーザがいいね!をしていない場合
                    selectGoodBtnDom(goodBtnDom, false); // いいね!ボタンを非選択状態に変更．
                }else{
                    selectGoodBtnDom(goodBtnDom, true); // いいね!ボタンを選択状態に変更．
                }
            }catch(e){
                console.info('chunkData に good プロパティがない可能性があります．');
            }
        })();
        hintBtnDom = $('<div class="button hintBtn">ヒント</div>');
        annotationTxtDom = $('<textarea class="annotationTxt" cols="50" rows="2" placeholder="ここにチャンクへのコメントを入力"></textarea>');
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // いいね! ボタンの動作．いいね回数の計算，ユーザチェック処理を行う．
        goodBtnDom.click(function(e){
            
            e.stopPropagation(); // 親要素へのイベントはブリングを禁止．
            
            // いいね! ボタンの親要素から，対応するチャンクの id を抽出．
            var parentAnnotationDom = $(this).parent(),
                parentAnnotationDomId = parentAnnotationDom[0].id,
                splitedParentAnnotationDomId = parentAnnotationDomId.split('_'),
                chunkData = null
            ;
            splitedParentAnnotationDomId = String() + splitedParentAnnotationDomId[1] + '_' + splitedParentAnnotationDomId[2];
            chunkData = globalMemCPSADR.chunkDataObj.chunkData[splitedParentAnnotationDomId];
            
            if(chunkData.good == undefined || chunkData.good == null){ // いいね!データが存在しないチャンクの場合
                chunkData.good = [globalMemCPSADR.chunkDataObj.userName];
                selectGoodBtnDom($(this), true); // いいね!ボタンを選択状態に変更．
            }else{                
                // 該当するアノテーションについて，ユーザのいいね!があるかをチェック．
                var goodIndex = chunkData.good.indexOf(String() + globalMemCPSADR.chunkDataObj.userName);
                if(goodIndex == -1){ // ユーザがいいね!をしていない場合
                    chunkData.good.push(globalMemCPSADR.chunkDataObj.userName);
                    selectGoodBtnDom($(this), true); // いいね!ボタンを選択状態に変更．
                }else{
                    chunkData.good.splice( goodIndex , 1);
                    selectGoodBtnDom($(this), false); // いいね!ボタンを非選択状態に変更．
                }
            }
            $(this).text('いいね! ' + calcGoodCount(chunkData)); // いいね! ボタンに いいね! のカウント値を付与．
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        annotationTxtDom.val(annotationPropCAD.chunkAnnotationText);
        annotationTxtDom.click(function(e){
            e.stopPropagation(); // 親要素へのイベントはブリングを禁止． 
        });
        annotationTxtDom.change(function(){
            
            globalMemCPSADR.isEditedByAnnotation = true;
            
            if($(this).val() == '' || $(this).val() == null || $(this).val() == false){
                globalMemCPSADR.chunkDataObj.chunkData[annotationPropCAD.chunkDomId].chunkAnnotationText = '';
            }else{
                globalMemCPSADR.chunkDataObj.chunkData[annotationPropCAD.chunkDomId].chunkAnnotationText = $(this).val();
            }
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        annotationTxtWrapperDom.append(annotationChunkIdDom);
        annotationTxtWrapperDom.append(goodBtnDom);
        annotationTxtWrapperDom.append(hintBtnDom);
        annotationTxtWrapperDom.append(annotationTxtDom);
        
        annotationTxtWrapperDom.click(function(){
            // click され選択状態にある annotationTxtWrapperDom は selected クラスを持っている．
            // これを利用しスイッチング処理を行う．
            if($(this).hasClass('selected')){
                selectAnnotationDom(''); // 選択状態にある annotationTxtWrapperDom がクリックされた際はその要素の選択状態を解除する．
                globalMemCPSADR.chunkDomRenderer.selectChunkDom('');
            }else{
                var splitedAnnotationDomId = String() + $(this)[0].id;
                splitedAnnotationDomId = splitedAnnotationDomId.split('_');
                splitedAnnotationDomId = String() + splitedAnnotationDomId[1] + '_' + splitedAnnotationDomId[2];
                
                selectAnnotationDom($(this)[0].id);
                globalMemCPSADR.chunkDomRenderer.selectChunkDom(splitedAnnotationDomId);
            }
        });
        
        globalMemCPSADR.annotationTextFlame.append(annotationTxtWrapperDom);
        autosize($('textarea')); // chunk annotation 入力用 textarea を自動可変に変更．
    };
    // ↓ for debug
    // for(var i=0; i<10; i++){ createAnnotationDom();}
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // 引数に '' を受け取った際は 全ての annotationDom の選択状態を解除する．
    selectAnnotationDom = function(annotationTxtWrapperDomIdSAD){
        $('.annotationTxtWrapper').each(function(index, element){
            $(element).removeClass('selected');
        });
        $('#' + annotationTxtWrapperDomIdSAD).addClass('selected');
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    selectGoodBtnDom = function(goodBtnDomSGBD, isSelected){
        if(isSelected){
            goodBtnDomSGBD.addClass('selected');
        }else{
            goodBtnDomSGBD.removeClass('selected');
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    removeAnnotationDom = function(chunkDomIdRAD){
        $('#annotationText_' + chunkDomIdRAD).remove();
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    calcGoodCount = function(annotationPropCGC){
        if(annotationPropCGC.good == undefined || annotationPropCGC.good == null){
            return '0000';
        }else{
            var goodCount = 0;
            
            for(var good_i in annotationPropCGC.good){ // annotationPropCGC.good はユーザ名の配列
                goodCount++;
            }
            
            if(goodCount < 10){
                goodCount = '000' + goodCount;
            }else if (goodCount < 100){
                goodCount = '00' + goodCount;
            }else if (goodCount < 1000){
                goodCount = '0' + goodCount;
            }

            return String() + goodCount;
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    return{createAnnotationDom:createAnnotationDom, removeAnnotationDom:removeAnnotationDom, selectAnnotationDom:selectAnnotationDom};
};