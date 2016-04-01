ChunkPianoSystem_client.annotationDomRenderer = function(globalMemCPSADR){ 
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var createAnnotationDom, removeAnnotationDom, selectAnnotationDom, selectGoodBtnDom, calcGoodCount;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    createAnnotationDom = function(annotationPropCAD){ 
        
        var annotationTxtWrapperDom, annotationChunkIdDom, goodBtnDom, hintBtnDom, annotationTxtDom;
        
        // アノテーション用 dom のtemplate生成．それぞれのDomにイベントを定義する可能生があるので個別に生成．
        // todo: イベントを定義しない dom template は個別でなくまとめて生成する．
        annotationTxtWrapperDom = $('<div class="annotationTxtWrapper fade" id="annotationText_' + annotationPropCAD.chunkDomId + '"></div>');
        // 日本語のチャンク名 japaneseChunkName を生成し，アノテーションのタイトルとする．
        (function(){
            var splitedChunkDomId = annotationPropCAD.chunkDomId,
                japaneseChunkName = null
            ;
            splitedChunkDomId = splitedChunkDomId.split('_');
            
            switch(splitedChunkDomId[0]){
                case 'patternChunk':
                    japaneseChunkName = 'パターンチャンク';
                    break;
                case 'phraseChunk':
                    japaneseChunkName = 'フレーズチャンク';
                    break;
                case 'hardChunk':
                    japaneseChunkName = '高難度チャンク';
                    break;
                case 'summaryChunk':
                    japaneseChunkName = '練習振り返りまとめ';
                    break;
            }
            japaneseChunkName = String() + japaneseChunkName + ' ' + splitedChunkDomId[1];
            
            annotationChunkIdDom = $('<p class="annotationChunkId">' + japaneseChunkName + '</p>');
            annotationChunkIdDom.addClass(annotationPropCAD.chunkType);
        })();
        goodBtnDom = $('<div class="button goodBtn">いいね! ' + calcGoodCount(annotationPropCAD) + '</div>');
        
        // 自分がいいね! を押したアノテーションのいいね!ボタンの色を変更．
        // 名前空間の汚染を防ぐために即時実行関数で実行．
        (function(){
            try{ // chunkData に good プロパティがない場合に indexOf でバグが発生するのを catch．
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
                    // ユーザがいいね!をしている状態で いいね!をクリックした際は，いいね! を解除．
                    chunkData.good.splice( goodIndex , 1); // いいね!をしたユーザ名リストからユーザ名を削除
                    selectGoodBtnDom($(this), false); // いいね!ボタンを非選択状態に変更．
                }
            }
            $(this).text('いいね! ' + calcGoodCount(chunkData)); // いいね! ボタンに いいね! のカウント値を付与．
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        // アノテーション内容を textarea に挿入．undefined や null の際の '' への置き換えは chunkDomRenderer が既に行っている．
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
        hintBtnDom.click(function(e){
            // ヒント ボタンの親要素から，対応するチャンクの id を抽出．
            // todo: この処理は何度も書かれているので関数化すべし．
            var parentAnnotationDom = $(this).parent(),
                parentAnnotationDomId = parentAnnotationDom[0].id,
                splitedParentAnnotationDomId = parentAnnotationDomId.split('_'),
                chunkData = null,
                annotationHintSearchOption = { // サーバで annotationHint をサーチする際のオプション
                    patternChunk:true, // patternChunk をサーチ対象に入れるか否か．
                    phraseChunk :true,
                    hardChunk   :true,
                    summaryChunk:true,
                    margin      :3,    // chunk の chunkMiddleLine から +- いくつまで検索対象に入れるか．
                    order       :'normal' // todo: 何を優先して検索するかを指定して検索できるようにする．normal はdbのインデックス順にそのまま返却するモード．
                }
            ;
            splitedParentAnnotationDomId = String() + splitedParentAnnotationDomId[1] + '_' + splitedParentAnnotationDomId[2];
            // ↑ は例えば patternChunk_0 のようになる．
            chunkData = globalMemCPSADR.chunkDataObj.chunkData[splitedParentAnnotationDomId];
            // 念のため，chunkData にも id 情報を持たせておく．
            if(chunkData.chunkDomId == undefined || chunkData.chunkDomId == null){
                chunkData.chunkDomId = splitedParentAnnotationDomId;
            }
            
            chunkData.userName = globalMemCPSADR.chunkDataObj.userName;
            
            // ユーザが指定した検索オプションに基づき，サーバに Annotation Hint をリクエストする.
            // callback は Annotation Hint が受信された際に実行される．
            globalMemCPSADR.reqAnnotationHint(chunkData, annotationHintSearchOption, function(status, hintChunkData){
                if(status == 'error'){
                    console.error('error occured in reqAnnotationHint');
                }else{
                    // console.log(hintChunkData);
                    globalMemCPSADR.annotationHintDomRenderer.createAnnotationHintDom(parentAnnotationDom, hintChunkData);
                }
            });
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