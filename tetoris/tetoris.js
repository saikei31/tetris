
var mainThread;
var board=[];
var player;
var translate;
var drop;
var groundTime = 0;
var gameTime = 0;
var fall;
var rotate;
var collectY;

var input = {
    up:0,
    down:0,
    left:0,
    right:0,
    z:0,
    x:0,
    c:0,
}

var keys = {
    up:0,
    down:0,
    left:0,
    right:0,
    z:0,
    x:0,
    c:0,
}
const BOARD_SIZE_X = 10;
const BOARD_SIZE_Y = 21;
const M_TETORIS = [
    {type:0, parts:[{x:0, y:0},{x:0, y:-1},{x:0, y:1},{x:0, y:2}]},
    // I
    {type:1,parts:[{x:0, y:0},{x:-1, y:0},{x:-2, y:0},{x:1, y:0}]},
    // J
    {type:2, parts:[{x:0, y:0},{x:-1, y:-1},{x:-1, y:0},{x:1, y:0}]},
    // L
    {type:3, parts:[{x:0, y:0},{x:-1, y:0},{x:1, y:0},{x:1, y:-1}]}, 
    // S
    {type:4, parts:[{x:0, y:0},{x:1, y:-1},{x:0, y:-1},{x:-1, y:0}]}, 
    // Z
    {type:5, parts:[{x:0, y:0},{x:-1, y:-1},{x:0, y:-1},{x:1, y:0}]}, 
    // T
    {type:6, parts:[{x:0, y:0},{x:-1, y:0},{x:0, y:-1},{x:1, y:0}]},
    // O
    {type:7, parts:[{x:0, y:0},{x:0, y:1},{x:1, y:0},{x:1, y:1}]},
]

//補正左回転（右回転はxを-x倍）
const ROTATE_A = [
    [{x:0, y:0}, {x:2,y:0}, {x:-1, y:0},{x:2, y:-1},{x:-1, y:2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:2, y:0},{x:-1, y:-2},{x:2, y:1}],
    [{x:0, y:0}, {x:-2,y:0}, {x:2, y:0},{x:1, y:-2},{x:-2, y:1}],
    [{x:0, y:0}, {x:-2,y:0}, {x:2, y:0},{x:-2, y:-1},{x:1, y:1}]
 ]

const ROTATE_B = [
    [{x:0, y:0}, {x: 1,y:0}, {x: 1, y: 1},{x:0, y:-2},{x: 1, y:-2}],
    [{x:0, y:0}, {x: 1,y:0}, {x: 1, y:-1},{x:0, y: 2},{x: 1, y: 2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:-1, y: 1},{x:0, y:-2},{x:-1, y:-2}],
    [{x:0, y:0}, {x:-1,y:0}, {x:-1, y:-1},{x:0, y: 2},{x:-1, y: 2}],
 ]

onload = function(){
    initialize();
}

function run(){
    mainThread = setInterval(main, 1000/60);
}

function stop(){
    clearInterval(mainThread);
}

function main(){
    processInput();
    update();
    show();
}

function processInput(){
    gameTime++;
    if(player == null){
        nextMino();
    }
    translateMino = copyMino(player);
    keys.up = (keys.up+1) * input.up;
    keys.down = (keys.down+1) * input.down;
    keys.z = (keys.z+1) * input.z;
    keys.x = (keys.x+1) * input.x;
    keys.c = (keys.c+1) * input.c;
    keys.right = (keys.right+1) * input.right;
    keys.left = (keys.left+1) * input.left;
}

function update(){
    var inputFreq = 10;
    rotate = false;
    if(keys.c % inputFreq == 1){
        setDropMino(translateMino);
        translate();
        putBlock(player);
        nextMino();
    }else if(keys.down % inputFreq == 1  || gameTime % 30 == 40){
        translateMino.pos.y++;
        if(checkOverlappedMino(translateMino)){
            putBlock(player);
            nextMino();
        }
    }else if(keys.z % inputFreq == 1){
        rotateMino(translateMino, 1);
    }else if(keys.x % inputFreq == 1){
        rotateMino(translateMino, -1);
    }else if(keys.right % inputFreq == 1){
        translateMino.pos.x++;
        if(checkOverlappedMino(translateMino)){
            translateMino = copyMino(player);            
        }
    }else if(keys.left % inputFreq == 1){
        translateMino.pos.x--;
        if(checkOverlappedMino(translateMino)){
            translateMino = copyMino(player);            
        }
    }

    translate();
    deleteLine();

    //落下地点表示
    drop = copyMino(player);
    setDropMino(drop);
}

function setDropMino(drop){
    for (var y = drop.pos.y; y < BOARD_SIZE_Y; y++ ){
       drop.pos.y++;
       if(checkOverlappedMino(drop)){
           drop.pos.y--;
           break;
       }
    }
}

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

function deleteBlock(y){
    for(;y > 0; y--){
        for(var i = 0; i < BOARD_SIZE_X; i++){
            board[y][i] = board[y - 1][i];
        }
    }
}

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

function rotateMino(mino, dir){
    if(player.type == 7){
       return;
    }
    mino.rotate = (mino.rotate + dir + 4)%4;
    var parts = mino.parts;
    for (var i = 0; i < parts.length; i++){
        var x = parts[i].x;
        var y = parts[i].y;
        parts[i].x = y * dir;
        parts[i].y = -x * dir;
    }
    if(!collectMino(translateMino, dir)){
        translateMino = copyMino(player);
    }
}


function collectMino(mino, rotate){
    var rotateCollect;
    if(player.type == 1){
       rotateCollect = ROTATE_A;
    }else{
       rotateCollect = ROTATE_B;
    }
    for(var i = 0; i < rotateCollect.length; i++){
        var dx = rotateCollect[mino.rotate][i].x;
        var dy = rotateCollect[mino.rotate][i].y;
        mino.pos.x += dx * (mino.rotate%2 == 0 ? -1: 1);
        mino.pos.y += dy;
        if (!checkOverlappedMino(mino)){
            return true;
        }
        mino.pos.x -= dx * (mino.rotate%2 == 0 ? -1: 1);
        mino.pos.y -= dy;
    }
    return false;
}

function putBlock(mino){
    processParts(mino, function(type, x, y){
        board[y][x] = type;
    });
}

function checkOverlappedMino(mino){
    var ret = false;
    processParts(mino, function(type, x, y){
        if(checkOverlappedBlock(x, y)){
           ret = true;
        }
    });
    return ret;
}

function processParts(mino, process, arg){
    var x = mino.pos.x;
    var y = mino.pos.y;
    for(var i = 0; i < mino.parts.length; i++){
        var dx = mino.parts[i].x;
        var dy = mino.parts[i].y;
        process(mino.type, x + dx, y + dy, arg);
    }
}

function checkOverlappedBlock(x, y){
    return  x < 0 || BOARD_SIZE_X - 1 < x ||
          BOARD_SIZE_Y - 1 < y|| y < 0 ||
             board[y][x] != 0;
}

function nextMino(type){
    if(type == null){
        type = random(7) + 1;
    }
    player = createMino(type);
    translateMino = copyMino(player);
    if(checkOverlappedMino(player)){
        gameover();
    }
}

function gameover(){
    processAllBlocks(function(x, y){
        if(board[y][x] != 0){
            board[y][x] = 99;
        }
    });
    player.type = 99;
    stop();
}

function createMino(type){
    var mino = {
        type : type,
        parts : [...M_TETORIS[type].parts],
        pos : {x:4, y:1},
        rotate : 0
    };
    return mino;
}

function random(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function translate(){
    player.pos.x = translateMino.pos.x;
    player.pos.y = translateMino.pos.y;
    player.rotate = translateMino.rotate;
    for(var i = 0; i < player.parts.length; i++){
        player.parts[i] = {...translateMino.parts[i]};
    }
}


function show(){
    showBoard();
    showDrop(drop);
    showMino(player);

    debug();
}

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

function showMino(mino){
    processParts(mino, function(type, x, y){
        var block = getBlockByPos(x, y);
        block.style.borderWidth = "1px";
        block.style.borderColor = "BLACK";
        block.style.background = getColor(type);
    });
 }

 function showDrop(mino){
    processParts(mino, function(type, x, y){
        var block = getBlockByPos(x, y);
        block.style.borderWidth = "3px";
        block.style.borderColor = getColor(type);
    });
 }

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
        case 99:
            return "red";
        default:
            return "black";
    }
}

function getBlockByPos(x, y){
    return block = document.getElementById("b_" + x + "_" + y);
}

function initialize(){
    var main = document.getElementById("main");
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
    document.addEventListener("keydown",(event)=>{
        if(event.keyCode==38){input.up = 1;}
        if(event.keyCode==40){input.down = 1;}
        if(event.keyCode==39){input.right = 1;}
        if(event.keyCode==37){input.left = 1;}
        if(event.keyCode==90){input.z = 1;}
        if(event.keyCode==88){input.x = 1;}
        if(event.keyCode==67){input.c = 1;}
    })
    document.addEventListener("keyup",(event)=>{
        if(event.keyCode==38){input.up = 0;}
        if(event.keyCode==40){input.down = 0;}
        if(event.keyCode==39){input.right = 0;}
        if(event.keyCode==37){input.left = 0;}
        if(event.keyCode==90){input.z = 0;}
        if(event.keyCode==88){input.x = 0;}
        if(event.keyCode==67){input.c = 0;}
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
    nextMino(5);
    break;
    case 2: 
    board[16] = [1,2,0,0,5,6,7,8,9,10];
    board[17] = [1,2,0,0,5,6,7,8,9,10];
    board[18] = [1,0,0,4,5,6,7,8,9,10];
    board[19] = [1,2,3,4,5,6,7,8,9,10];
    nextMino(4);
    break;
    case 3: 
    board[16] = [0,0,1,0,0,0,0,0,0,0];
    board[17] = [1,2,3,4,0,6,7,8,9,10];
    board[18] = [1,2,3,0,0,6,7,8,9,10];
    board[19] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(5);
    break;
    case 4: 
    board[16] = [0,0,0,0,0,0,0,0,0,0];
    board[17] = [1,2,3,4,0,6,7,8,9,10];
    board[18] = [1,2,3,0,0,6,7,8,9,10];
    board[19] = [1,2,3,0,5,6,7,8,9,10];
    nextMino(5);
    break;
    }
}