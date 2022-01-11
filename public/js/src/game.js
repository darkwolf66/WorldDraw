let game;
let socket;
let user;
let world;
let world_name;
let world_lands;
let gui;
let user_lands;

let colorPicker;
let color = "#000";

let worldManager;
$(document).ready(function (){
    socket = io();
    new Auth()
})
class Game{
    constructor(){
        L.show()
        console.log('creating new socket')
        socket = io({
            extraHeaders: {
                token: Cookies.get('worldDrawToken')
            }
        });
        this.freshSideMenu();
        this.startWorld();
        this.gameListeners()
        $('.welcome').hide()
        L.hide()
    }
    startWorld(){
        worldManager = new World();
    }
    gameListeners(){
        $("#world").dblclick((e)=>{
            let clickedXY = WorldHelper.getRelativeCoords(e);
            worldManager.infoLand(clickedXY);
        })
        gui = new Gui();
    }
    freshSideMenu(){
        this.freshUser().then(()=>{
            $('.js-player-name').html(user.username)
            $('.js-player-coins').html('$'+user.coins/1000000)
        })
    }
    freshUser(){
        return new Promise(((resolve, reject) => {
            socket.emit('fresh_user', user.token, (res)=>{
                user = res.user;
                resolve()
            })
        }))
    }
}
class World {
    getLandCoord(coord){
        return {
            x: coord.x-(coord.x%50),
            y: coord.y-(coord.y%50)
        }
    }
    constructor(coordinates = false, grid = false) {
        this.coordinates = coordinates;
        this.grid = grid;
        this.center_x = -(5000-$(window).width()/2);
        this.center_y = -(5000-$(window).height()/2);

        $('#world').css('left', this.center_x)
        $('#world').css('top', this.center_y)
        this.runColorPicker();
        this.updateUserLands();
    }
    freshWorld(){
        world_name = $('#world_name').val().toLowerCase()
        this.startWorld();
        if(this.coordinates){
            this.createLabels();
        }
        this.registerListeners();
        this.getDraw()
    }
    startWorld (){
        this.canvas = document.getElementById('world')
        this.ctx = this.canvas.getContext('2d')
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    registerListeners (){
        //TODO
        /*
        if(parseFloat($('#world').css('left').replace('px')) > 100){
                    $('#world').css('left', 100)
                }
                if(parseFloat($('#world').css('top').replace('px')) > 100){
                    $('#world').css('top', 100)
                }
                $('.y-label-list').css('top', $('#world').css('top'))
                $('.x-label-list').css('left', $('#world').css('left'))
         */
    }
    createLabels(){
        for (let i = 0; i < 10000; i+=100){
            $('.y-label-list').append('<div class="label" style="top: '+i+'px">'+i+'</div>')
            $('.x-label-list').append('<div class="label" style="left: '+i+'px">'+i+'</div>')
        }
        $('.y-label-list').show()
        $('.x-label-list').show()
        $('.x-label-list').css('left', this.center_x)
        $('.y-label-list').css('top', this.center_y)
    }
    getDraw(){
        socket.emit('worldLands', world_name, (world_lands_data)=>{
            world_lands = world_lands_data.world_lands_data;
            for(let i = 0; i < world_lands.length; i++){
                this.drawLand({
                    x: world_lands[i].x,
                    y: world_lands[i].y
                }, "#90bfd0");
            }
            socket.emit('world', world_name, (world_data)=>{
                world = world_data.world_data;
                for(let i = 0; i < world.length; i++){
                    this.drawPoint(world[i]);
                }
            })
        })
    }
    drawPoint(worldPoint){
        this.ctx.fillStyle = worldPoint.color;
        this.ctx.fillRect(worldPoint.x, worldPoint.y, 10, 10);
    }
    drawLand(coords, color='#81ff81'){
        this.ctx.fillStyle = color;
        this.ctx.fillRect(coords.x, coords.y, 50, 50);
    }
    infoLand(clickedXY){
        if(clickedXY.x < 100 || clickedXY.y < 100){
            return;
        }
        let landCoord = this.getLandCoord(clickedXY);
        socket.emit('landInfo', {coord: landCoord, world: world_name}, function (landInfo){
            if(landInfo == null || landInfo.owner != user.username){
                LandGui.startBuyGui(landInfo, {
                    x: landCoord.x,
                    y: landCoord.y
                });
            }else{
                socket.emit('buildPoint', {coord: {x: clickedXY.x, y: clickedXY.y}, world: world_name, color: color}, function (pointInfo){
                    game.freshSideMenu()
                    console.log(pointInfo)
                    worldManager.drawPoint(pointInfo.point);
                })
            }
        })
    }
    updateUserLands(){
        L.show()
        socket.emit('mylands', "",(res)=>{
            L.hide()
            user_lands = res;
            worldManager.freshWorld();
        })
    }
    executeLandBuy(land){
        L.show()
        console.log(land)
        console.log('executingBuyLand')
        socket.emit('buyLand', {
            coord: land,
            world: world_name
        }, (res) => {
            if(res.result == 'error'){
                switch (res.msg){
                    case 'not_enough_coins':
                        swal("You are too poor to buy this! Try something cheaper..", '', 'error')
                        break;
                }
            }
            game.freshSideMenu()
            worldManager.freshWorld();
            L.hide()
        })
    }
    runColorPicker(){
        colorPicker = Pickr.create({
            el: '.colorPicker',
            theme: 'nano',
            inline: true,
            showAlways: true,
        })
    }
}

class Gui {
    constructor() {
        this.registerAllListeners()
    }
    registerAllListeners(){
        LandGui.onStartListeners();
    }
    static cleanGui(){
        $('.land-gui').hide();
        worldManager.freshWorld();
    }
}

let selectedLand;
class LandGui{
    static onStartListeners(){
        $('.land-gui .close').click(()=>{
            $('.land-gui').hide();
            worldManager.freshWorld();
        })
        $('.land-gui .buy .js-buy').click(()=>{
            $('.land-gui').hide();
            worldManager.executeLandBuy($('.land-gui .buy .js-buy').attr('data-land-id'))
        })
    }
    static showGui(){
        $('.land-gui').show()
    }
    static startBuyGui(landInfo, coord){
        selectedLand = landInfo;
        L.show()
        LandGui.showGui()
        $('.land-gui .buy').show()
        worldManager.freshWorld()
        worldManager.drawLand({
            x: coord.x,
            y: coord.y
        })
        let id = 'X'+coord.x+'Y'+coord.y;
        $('.land-gui .buy .js-buy').hide()

        if(landInfo == null){
            $('.land-gui .buy h3').html('Land '+id)
            $('.land-gui .buy .price').html('<h2>Price: $0.00001</h2>')
            $('.land-gui .buy .owner').html('Land Owner: No one bought yet')
            $('.land-gui .buy .content').html('')
            $('.land-gui .buy .js-buy').show()
        }else{
            $('.land-gui .buy h3').html(landInfo.title)
            if(landInfo.sell > 0){
                $('.land-gui .buy .price').html('<h2>Price: $'+landInfo.sell+'</h2>')
                $('.land-gui .buy .js-buy').show()

            }else{
                $('.land-gui .buy .price').html('<h2>Not for Sale</h2>')
            }
            $('.land-gui .buy .owner').html('Land Owner: '+landInfo.owner)
            $('.land-gui .buy .content').html(landInfo.content)
        }
        $('.land-gui .buy .js-buy').attr('data-land-id', id)
        L.hide()
    }
}
class QuickUserGui{
    static fresh(){

    }
}
class Auth {
    constructor(){
        this.authTokenLocked = false;
        this.authButtonLocked = false;
        this.registerButtonLocked = false;
        this.registerListeners();
        if(typeof Cookies.get('worldDrawToken') !== 'undefined'){
            this.auth_token()
        }

    }
    registerListeners(){
        $('#login').submit((e) => {
            e.preventDefault()
            this.auth();
        })
        $('#register').submit((e) => {
            e.preventDefault()
            this.register();
        })
        $('.js-switch-auth-views').click((e) => {
            this.switchToAuthView();
        })
    }
    auth_token(){
        console.log('Auth over token')
        if(this.authTokenLocked){
            return;
        }
        this.authTokenLocked = true;
        L.show()
        socket.emit('auth_login_token', Cookies.get('worldDrawToken'), (res) => {
            if(res.result === 'error'){
                switch (res.msg){
                    case "doest_exist":
                        Cookies.remove('worldDrawToken')
                        break;
                }
                this.authButtonLocked = false;
                L.hide()
                return;
            }
            L.hide()
            console.log('Logado em '+res.user.username)
            Cookies.set('worldDrawToken', res.user.token, {path: '/', expires: 365})
            user = res.user;
            game = new Game()
        })
    }
    auth(){
        if(this.authButtonLocked){
            return;
        }
        this.authButtonLocked = true;
        L.show()
        socket.emit('auth_login', {
            username: $('#username').val(),
            password: $('#password').val(),
        },(res) => {
            console.log(res)
            console.log('passou daki')
            if(res.result === 'error'){
                switch (res.msg){
                    case "doest_exist":
                        swal("User does't exist!", '', 'error')
                        break;
                    case "wrong_password":
                        swal("Wrong password!", '', 'error')
                        break;
                    default:
                }
                this.authButtonLocked = false;
                L.hide()
                return;
            }
            L.hide()
            console.log('Logado em '+res.user.username)
            Cookies.set('worldDrawToken', res.user.token, {path: '/', expires: 365})
            user = res.user;
            new Game()
        })
    }
    register(){
        if(this.registerButtonLocked){
            return;
        }
        this.registerButtonLocked = true;
        L.show()
        if($('#re-password').val() !== $('#re-re-password').val()){
            swal("Passwords does not match!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }
        if($('#re-password').val().length < 8){
            swal("Password must have at least 8 characters!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }
        if($('#re-password').val().length > 16){
            swal("Password can't have more than 16 characters!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }
        if($('#re-username').val().length < 4){
            swal("User must have at least 4 characters!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }
        if($('#re-username').val().length > 16){
            swal("User can't have more than 16 characters!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }
        if(!(/^[0-9a-zA-Z_.-]+$/.test($('#re-username').val()))){
            swal("User can't have special characters!", '', 'error')
            this.registerButtonLocked = false;
            L.hide()
            return;
        }

        socket.emit('auth_register', {
            username: $('#re-username').val(),
            password: $('#re-password').val(),
        },(res) => {
            if(res.result === 'error'){
                switch (res.msg){
                    case "already_exist":
                        swal("User already exist!", '', 'error')
                }
                this.registerButtonLocked = false;
                L.hide()
                return;
            }
            user = res.user;
            Cookies.set('worldDrawToken', user.token, {path: '/', expires: 365})
            L.hide()
            world_name = 'earth';
            game = new Game()
        })
    }
    switchToAuthView(){
        if($('.js-login-view').css('display') != 'none'){
            $('.js-login-view').hide()
            $('.js-register-view').show()
        }else{
            $('.js-register-view').hide()
            $('.js-login-view').show()
        }
    }
}

class L {
    static show(){
        $('.loading').show()
    }
    static hide(){
        $('.loading').css('display', 'none')
    }
}

class WorldHelper {
    static getRelativeCoords(event) {
        return { x: event.offsetX || event.layerX, y: event.offsetY || event.layerY };
    }
}

