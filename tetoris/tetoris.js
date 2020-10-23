/**
 * tetoris.js
 * 
 * テトリスソースコード
 */

 //グローバル変数
var mainThread; //ゲームループ用スレッド
var board=[];  //プレイエリア
var player;  //現在プレイヤーが操作しているテトミノ
var translate; //操作ミノの移動先情報
var drop; //ハードドロップ用移動先情報
var groundTime = 0; //接地判定用時間
var gameTime = 0; // フレーム単位でゲーム時間カウント
var nextMinos = [];
var holdedMino; 
var sevenBag = [];
var releaceHoldFlag = false;

 //javascriptのインプット
 var input = {
    up:0,
    down:0,
    left:0,
    right:0,
    z:0,
    x:0,
    c:0,
    v:0,
}
 
//ゲーム用にインプットを取得
 var keys = {
    up:0,
    down:0,
    left:0,
    right:0,
    z:0,
    x:0,
    c:0,
    v:0,
}

//定数定義
const BOARD_SIZE_X = 10;  //プレイエリアのXサイズ
const BOARD_SIZE_Y = 21;  //プレイエリアのYサイズ + 最上段のダミー1段
const MAX_NEXT = 5;  //

//ミノタイプ定義
const TYPE_I = 1;
const TYPE_J = 2;
const TYPE_L = 3;
const TYPE_S = 4;
const TYPE_Z = 5;
const TYPE_T = 6;
const TYPE_O = 7;

//テトリスの形状定義
const M_TETORIS = [
    // ダミー
    {type:0, parts:[{x:0, y:0},{x:0, y:-1},{x:0, y:1},{x:0, y:2}]},
    // I字
    {type:TYPE_I,parts:[{x:0, y:0},{x:-1, y:0},{x:-2, y:0},{x:1, y:0}]},
    // J字
    {type:TYPE_J, parts:[{x:0, y:0},{x:-1, y:-1},{x:-1, y:0},{x:1, y:0}]},
    // L字
    {type:TYPE_L, parts:[{x:0, y:0},{x:-1, y:0},{x:1, y:0},{x:1, y:-1}]}, 
    // S字
    {type:TYPE_S, parts:[{x:0, y:0},{x:1, y:-1},{x:0, y:-1},{x:-1, y:0}]}, 
    // Z字
    {type:TYPE_Z, parts:[{x:0, y:0},{x:-1, y:-1},{x:0, y:-1},{x:1, y:0}]}, 
    // T字
    {type:TYPE_T, parts:[{x:0, y:0},{x:-1, y:0},{x:0, y:-1},{x:1, y:0}]},
    // O字
    {type:TYPE_O, parts:[{x:0, y:0},{x:0, y:1},{x:1, y:0},{x:1, y:1}]},
]

//回転時テトリス座標補正左回転用（右回転はxを-x倍する）
//I字用
const ROTATE_A = [
    [{x:0, y:0}, {x:2,y:0}, {x:-1, y:0},{x:2, y:-1},{x:-1, y:2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:2, y:0},{x:-1, y:-2},{x:2, y:1}],
    [{x:0, y:0}, {x:-2,y:0}, {x:2, y:0},{x:1, y:-2},{x:-2, y:1}],
    [{x:0, y:0}, {x:-2,y:0}, {x:2, y:0},{x:-2, y:-1},{x:1, y:1}]
 ]
//I字以外
const ROTATE_B = [
    [{x:0, y:0}, {x: 1,y:0}, {x: 1, y: 1},{x:0, y:-2},{x: 1, y:-2}],
    [{x:0, y:0}, {x: 1,y:0}, {x: 1, y:-1},{x:0, y: 2},{x: 1, y: 2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:-1, y: 1},{x:0, y:-2},{x:-1, y:-2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:-1, y:-1},{x:0, y: 2},{x:-1, y: 2}],
 ]

 //htmlロード時に自動で呼び出される関数
onload = function(){
    initialize();
}

//ゲームのメインループを起動
//ループ回数は15fps
function run(){
    mainThread = setInterval(main, 1000/15);
}

//メインループの停止
function stop(){
    clearInterval(mainThread);
}

//メインループ
//入力制御→ゲーム内容更新→ゲーム内容描画をループする。
function main(){
    processInput();
    update();
    show();
}

//入力情報をゲーム用に変換する。ゲーム内時間にあわせて入力時間をカウントする。
function processInput(){
    translateMino = copyMino(player);
    keys.up = (keys.up+1) * input.up;
    keys.down = (keys.down+1) * input.down;
    keys.z = (keys.z+1) * input.z;
    keys.x = (keys.x+1) * input.x;
    keys.c = (keys.c+1) * input.c;
    keys.v = (keys.v+1) * input.v;
    keys.right = (keys.right+1) * input.right;
    keys.left = (keys.left+1) * input.left;
}

//毎フレーム実行し、ゲーム内容を更新する。
function update(){
    gameTime++;
    var inputFreq = 2;
    rotate = false;

    //ハードドロップ
    if(keys.c == 1){
        setDropMino(translateMino);
        translate();
        putBlock(player);
        nextMino();
    //落下
    }else if(keys.down % inputFreq == 1  || gameTime % 8== 5){
        translateMino.pos.y++;
        if(checkOverlappedMino(translateMino)){
            putBlock(player);
            nextMino();
        }
    //ホールド
    }else if(keys.v == 1){
        holdMino(player.type);
    }else if(keys.z % inputFreq == 1){
        rotateMino(translateMino, 1);
    //右回転
    }else if(keys.x % inputFreq == 1){
        rotateMino(translateMino, -1);
    //右移動
    }else if(keys.right % inputFreq == 1){
        translateMino.pos.x++;
        if(checkOverlappedMino(translateMino)){
            translateMino = copyMino(player);            
        }
    //左移動
    }else if(keys.left % inputFreq == 1){
        translateMino.pos.x--;
        if(checkOverlappedMino(translateMino)){
            translateMino = copyMino(player);            
        }
    }
    //移動反映
    translate();
    //揃ったラインを削除
    deleteLine();

    //落下地点表示
    drop = copyMino(player);
    setDropMino(drop);
}

//ハードドロップ先を検出
function setDropMino(drop){
    for (var y = drop.pos.y; y < BOARD_SIZE_Y; y++ ){
       drop.pos.y++;
       if(checkOverlappedMino(drop)){
           drop.pos.y--;
           break;
       }
    }
}

//全行を精査し、ラインを消す。
function deleteLine(){
    for(var y = 0; y < BOARD_SIZE_Y; y++){
        var i = 0;
        for(var x = 0; x < BOARD_SIZE_X; x++){
            if(board[y][x] != 0){
                i++;
            }
        }
        if(i == BOARD_SIZE_X){
            deleteBlock(y);
            y--;
        }
    }
}

//プレイミノをホールドする。
//未ホールドであれば次ミノをプレイし、ホールド済みであれば、ホールドとプレイミノを入れ替える
//ホールドを解除したミノは再びホールドできない
function holdMino(type){
    if(releaceHoldFlag){
        return;
    }
    if(holdedMino == null){
        nextMino();
    } else {
        clearHold();
        player = createMino(holdedMino);
        translateMino = copyMino(player);
        releaceHoldFlag = true;
    }
    holdedMino = type;
    var hold = document.getElementById("holdItem");
    var div = createItemMino(type);
    hold.appendChild(div);
}

function clearHold(){
    var hold = document.getElementById("holdItem");
    hold.removeChild(hold.firstChild);
}

//揃ったラインより上のブロックを下げてラインを消す。。
function deleteBlock(y){
    for(;y > 0; y--){
        for(var i = 0; i < BOARD_SIZE_X; i++){
            board[y][i] = board[y - 1][i];
        }
    }
}

//ミノをディープコピーする。
function copyMino(mino){
    var ret = {}
    ret.pos = {
            x: mino.pos.x,
            y: mino.pos.y
    };
    ret.type = mino.type;
    ret.parts = [];
    for(var i = 0; i < mino.parts.length; i++){
        ret.parts[i] = {...mino.parts[i] };
    }
    ret.rotate = mino.rotate;
    return ret;
}

//ミノを回転し、回転時に壁、ブロックに衝突したら補正する。
//補正しきれない場合は回転前に戻す。
function rotateMino(mino, dir){
    //O型は回転の概念がないので消す。
    if(player.type == TYPE_O){
       return;
    }
    mino.rotate = (mino.rotate + dir + 4)%4;
    var parts = mino.parts;
    for (var i = 0; i < parts.length; i++){
        var x = parts[i].x;
        var y = parts[i].y;
        //回転方向にパーツを回転する。
        parts[i].x = y * dir;
        parts[i].y = -x * dir;
    }

    //回転時の座標を補正し補正しきれない場合はもどす。
    if(!collectRotation(translateMino, dir)){
        translateMino = copyMino(player);
    }
}

//ミノの回転で位置を補正する
function collectRotation(mino, rotateDir){
    var rotateCollect;
    //I字のみ異なる補正を利用
    if(player.type == TYPE_I){
       rotateCollect = ROTATE_A;
    }else{
       rotateCollect = ROTATE_B;
    }
    //定数で定義した補正位置で衝突判定を繰り返す
    //衝突判定がないときに補正位置を処理を終了して補正する
    for(var i = 0; i < rotateCollect.length; i++){
        var dx = rotateCollect[mino.rotate][i].x;
        var dy = rotateCollect[mino.rotate][i].y;
        // 
        mino.pos.x += dx * (mino.rotate%2 == 0 ? rotateDir: 1);
        mino.pos.y += dy;
        if (!checkOverlappedMino(mino)){
            return true;
        }
        //補正前に戻す
        mino.pos.x -= dx * (mino.rotate%2 == 0 ? rotateDir: 1);
        mino.pos.y -= dy;
    }
    return false;
}

//ブロックをフィールドに格納する
function putBlock(mino){
    processParts(mino, function(type, x, y){
        board[y][x] = type;
    });
}

//衝突判定（ミノ単位）
function checkOverlappedMino(mino){
    var ret = false;
    processParts(mino, function(type, x, y){
        if(checkOverlappedBlock(x, y)){
           ret = true;
        }
    });
    return ret;
}

function checkOverlappedBlock(x, y){
    return  x < 0 || BOARD_SIZE_X - 1 < x ||
          BOARD_SIZE_Y - 1 < y|| y < 0 ||
             board[y][x] != 0;
}

//ミノパーツ単位実行関数
function processParts(mino, process, arg){
    var x = mino.pos.x;
    var y = mino.pos.y;
    for(var i = 0; i < mino.parts.length; i++){
        var dx = mino.parts[i].x;
        var dy = mino.parts[i].y;
        process(mino.type, x + dx, y + dy, arg);
    }
}

//次のミノをプレイする
//ホールドしているミノがある場合はそれをプレイする
function nextMino(type){
    releaceHoldFlag = false;
    if(type == null){
        type = nextMinos[0];
        queMino();
    }
    player = createMino(type);
    translateMino = copyMino(player);
    if(checkOverlappedMino(player)){
        gameover();
    }
}

function queMino(){
    var type = popBag();
    var firstNext = document.getElementById("next0");
    firstNext.removeChild(firstNext.firstChild);
    for(var i = 0; i < MAX_NEXT - 1 ;i++){
        nextMinos[i] = nextMinos[i + 1];
        var a = document.getElementById("next" + i);
        var b = document.getElementById("next" + (i + 1));
        a.appendChild(b.firstChild);
    }
    nextMinos[MAX_NEXT - 1] = type;
    var lastNext = document.getElementById("next" + (MAX_NEXT - 1));
    var div = createItemMino(type);
    lastNext.appendChild(div);
}

//ゲームオーバ演出とゲーム停止を実行する
function gameover(){
    processAllBlocks(function(x, y){
        if(board[y][x] != 0){
            board[y][x] = 99;
        }
    });
    player.type = 99;
    stop();
}

//ミノを生成する
function createMino(type){
    var mino = {
        type : type,
        parts : [...M_TETORIS[type].parts],
        pos : {x:4, y:1},
        rotate : 0
    };
    return mino;
}

//ランダム生成
function random(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

//移動を確定する
function translate(){
    player.pos.x = translateMino.pos.x;
    player.pos.y = translateMino.pos.y;
    player.rotate = translateMino.rotate;
    for(var i = 0; i < player.parts.length; i++){
        player.parts[i] = {...translateMino.parts[i]};
    }
}

//画面を描画する
function show(){
    showBoard();
    showDrop(drop);
    showMino(player);
}

//ボードを描画する
function showBoard(){
    processAllBlocks(function(x,y){
        var block = getBlockByPos(x, y);
        block.style.borderWidth = "1px";
        block.style.borderColor = "BLACK";
        block.style.background = getColor(board[y][x]);
     });
}

function debug(){
    document.getElementById("info").innerHTML = "rotate:" + player.rotate + " pos:(" + player.pos.x + "," + player.pos.y + ")"; 
}

//ミノを描画する
function showMino(mino){
    processParts(mino, function(type, x, y){
        drawBlock(getBlockByPos(x, y), type);
    });
}

//ハードドロップを描画する
 function showDrop(mino){
    processParts(mino, function(type, x, y){
        var block = getBlockByPos(x, y);
        block.style.borderWidth = "3px";
        block.style.borderColor = getColor(type);
    });
 }

 //ブロックを描画する
 function drawBlock(block, type){
    block.style.borderWidth = "1px";
    block.style.borderColor = "BLACK";
    block.style.background = getColor(type);
 }

 //タイプ罰の色を取得する
function getColor(type){
    switch(type){
        case 0:
           return "grey";
        case 1:
            return "aqua";
        case 2:
            return "#75A9FF";
        case 3:
            return "#FF773E";
        case 4:
            return "lime";
        case 5:
            return "red";
        case 6:
            return "fuchsia";
        case 7:
            return "yellow";
        case 8:
            return "none";
        case 99:
            return "red";
        default:
            return "black";
    }
}

// 
function getBlockByPos(x, y){
    return block = document.getElementById("b_" + x + "_" + y);
}

function initBoard(){
    var main = document.getElementById("board");
    for(var y = 0; y < BOARD_SIZE_Y; y++){
        board[y] = [];
        for(var x = 0; x < BOARD_SIZE_X; x++){
            board[y][x] = 0;
            var block = createBlock();
            block.id = "b_" + x + "_" + y;
            if(y == 0){
                block.style.display = "none";
            }
            main.appendChild(block);
        }
    }
}

function getNextItem(num){
    return document.getElementById("next" + num);
}

function initBag(){
    pushBag();
    pushBag();
}

function pushBag(){
    var minos = [1,2,3,4,5,6,7];
    while(true){
        var r = random(minos.length);
        if(minos[r]){
            sevenBag.push(minos[r]);
            minos.splice(r,1);
        }
        if(minos.length == 0){
            break;
        }
    }
}

function popBag(){
    var ret = sevenBag[0];
    sevenBag.splice(0, 1);
    if(sevenBag.length < 7){
       pushBag();
    }
    return ret;
}

function initNext(){
    for(var i = 0; i < MAX_NEXT; i++){
        var type = popBag();
        nextMinos[i] = type;
        var div = createItemMino(type);
        var item = getNextItem(i);
        item.appendChild(div);
    }
}

function initialize(){
    initBoard();
    initBag();
    initNext();
    nextMino();

    document.addEventListener("keydown",(event)=>{
        if(event.keyCode==38){input.up = 1;}
        if(event.keyCode==40){input.down = 1;}
        if(event.keyCode==39){input.right = 1;}
        if(event.keyCode==37){input.left = 1;}
        if(event.keyCode==90){input.z = 1;}
        if(event.keyCode==88){input.x = 1;}
        if(event.keyCode==67){input.c = 1;}
        if(event.keyCode==86){input.v = 1;}
    })
    document.addEventListener("keyup",(event)=>{
        if(event.keyCode==38){input.up = 0;}
        if(event.keyCode==40){input.down = 0;}
        if(event.keyCode==39){input.right = 0;}
        if(event.keyCode==37){input.left = 0;}
        if(event.keyCode==90){input.z = 0;}
        if(event.keyCode==88){input.x = 0;}
        if(event.keyCode==67){input.c = 0;}
        if(event.keyCode==86){input.v = 0;}
        console.log(event.keyCode);
    })
    run();
}

function processAllBlocks(process){
    for(var y = 1; y < BOARD_SIZE_Y; y++){
        for(var x = 0; x < BOARD_SIZE_X; x++){
            process(x, y);
        }
    }
}

function createBlock(){
    var div = document.createElement("div");
    div.classList.add("block");
    return div;
}

function createItemMino(type){
    var div = document.createElement("div");
    var c, w, h, x, y;
    switch(type){
        case TYPE_I:
            c="mino_4x2";
            w = 4; h = 2;
            x = 2; y = 1;
            break;
        case TYPE_O:
            c="mino_2x2";
            w = 2; h = 2;
            x = 0; y = 0;
            break;
        default:
            c="mino_3x2";
            w = 3; h = 2;
            x = 1; y = 1;
            break;
    }
    div.classList.add(c);
    var blocks = [];
    for(var i = 0; i < w * h; i++){
        var item = document.createElement("div");
        item.classList.add("item_block");
        item.id = "nb_" + (i%w) + "_" + (i/w);
        blocks[i] = item;
        div.appendChild(item);
    }
    var parts = [...M_TETORIS[type].parts];
    for(var i = 0; i < parts.length; i++){
        var px = x + parts[i].x;
        var py = y + parts[i].y;
        drawBlock(blocks[px + py * w], type);
    }
    return div;
}

function onclickStop(){
    console.log("stop");
    stop();
}

function onclickLeft(){
    input.z = true;
    main();
    input.z = false;
}

function onclickRight(){
    input.x = true;
    main();
    input.x = false;
}

function resetGame(){
    processAllBlocks(function(x,y){
        board[y][x] = 0;
    });
    nextMino();
    stop();
    run();
}

function onclickReset(){
    resetGame();
}

function onclickTest(){
    processAllBlocks(function(x,y){
        board[y][x] = 0;
    });
    var value = Number(document.getElementById("test").value); 

    switch(value){
    case 1: 
    board[16] = [0,0,3,4,5,6,7,8,9,10];
    board[17] = [0,0,3,4,5,6,7,8,9,10];
    board[18] = [1,0,0,4,5,6,7,8,9,10];
    board[19] = [1,2,3,4,5,6,7,8,9,10];
    board[20] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(5);
    break;
    case 2: 
    board[16] = [1,2,0,0,5,6,7,8,9,10];
    board[17] = [1,2,0,0,5,6,7,8,9,10];
    board[18] = [1,0,0,4,5,6,7,8,9,10];
    board[19] = [1,2,3,4,5,6,7,8,9,10];
    board[20] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(4);
    break;
    case 3: 
    board[16] = [0,0,1,0,0,0,0,0,0,0];
    board[17] = [1,2,3,4,0,6,7,8,9,10];
    board[18] = [1,2,3,0,0,6,7,8,9,10];
    board[19] = [1,2,3,0,5,6,7,8,9,10];
    board[20] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(5);
    break;
    case 4: 
    board[16] = [0,0,0,0,0,0,0,0,0,0];
    board[17] = [1,2,3,4,0,6,7,8,9,10];
    board[18] = [1,2,3,0,0,6,7,8,9,10];
    board[19] = [1,2,3,0,5,6,7,8,9,10];
    board[20] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(5);
    break;
    }
}