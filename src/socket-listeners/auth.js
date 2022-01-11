let crypto = require('crypto');

module.exports = function (socket, db) {
    socket.on('fresh_user', async (token, callback) => {
        if(typeof callback !== 'function'){
            return false;
        }

        if(typeof token == 'undefined' || typeof token != "string" || token.length > 600){
            return callback({
                'result': 'error',
                'msg': 'invalid_token'
            })
        }
        const collection = db.collection('users');

        const user_count = await collection.find({token: token});

        const count = await user_count.count();
        if(count <= 0){
            return callback({
                'result': 'error',
                'msg': 'doest_exist'
            });
        }

        let user = await collection.findOne({token: token});

        return callback({
            'result': 'success',
            'user': {
                username: user.username,
                token: user.token,
                coins: user.coins,
            }
        });

    })

    socket.on('auth_login', async (msg, callback) => {
        if(typeof callback !== 'function'){
            return false;
        }
        if(typeof msg == 'undefined' || typeof msg.password != "string" || typeof msg.username != "string" || msg.username.length > 20 || msg.password.length > 20){
            return callback({
                'result': 'error',
                'msg': 'there_is_something_wrong'
            })
        }

        const collection = db.collection('users');

        const user_count = await collection.find({username: msg.username});

        const count = await user_count.count();
        if(count <= 0){
            return callback({
                'result': 'error',
                'msg': 'doest_exist'
            });
        }

        let user = await collection.findOne({username: msg.username});

        let password = crypto.createHash('sha256').update(user.salt+msg.password).digest('hex');

        if(password !== user.password){
            return callback({
                'result': 'error',
                'msg': 'wrong_password'
            });
        }

        return callback({
            'result': 'success',
            'user': {
                username: msg.username,
                token: user.token,
                coins: user.coins,
            }
        });
    });

    socket.on('auth_login_token', async (token, callback) => {
        if(typeof callback !== 'function'){
            return false;
        }


        if(typeof token == 'undefined' || typeof token != "string" || token.length > 600){
            return callback({
                'result': 'error',
                'msg': 'invalid_token'
            })
        }

        const collection = db.collection('users');

        const user_count = await collection.find({token: token});

        const count = await user_count.count();
        if(count <= 0){
            return callback({
                'result': 'error',
                'msg': 'doest_exist'
            });
        }

        let user = await collection.findOne({token: token});

        return callback({
            'result': 'success',
            'user': {
                username: user.username,
                token: user.token,
                coins: user.coins,
            }
        });
    })
    socket.on('auth_register', async (msg, callback) => {
        if(typeof callback !== 'function'){
            return false;
        }

        if(typeof msg == 'undefined' || typeof msg.password != "string" || typeof msg.username != "string"){
            return callback({
                'result': 'error',
                'msg': 'r_invalid'
            })
        }

        if(msg.password.length < 8 || msg.password.length > 16){
            return callback({
                'result': 'error',
                'msg': 'password_size'
            });
        }

        if(msg.username.length < 4 || msg.username.length > 16){
            return callback({
                'result': 'error',
                'msg': 'username_size'
            });
        }
        if(!(/^[0-9a-zA-Z_.-]+$/.test(msg.username))){
            return callback({
                'result': 'error',
                'msg': 'username_special_chars'
            });
        }

        const collection = db.collection('users');

        const result = await collection.find({username: msg.username});
        const count = await result.count();
        if(count > 0){
            return callback({
                'result': 'error',
                'msg': 'already_exist'
            });
        }
        let salt = crypto.randomBytes(16).toString('hex');
        let password = crypto.createHash('sha256').update(salt+msg.password).digest('hex');
        let token = crypto.randomBytes(256).toString('hex');
        collection.insertOne({
            username: msg.username,
            password: password,
            salt: salt,
            token: token,
            coins: 0,
        })
        return callback({
            'result': 'success',
            'user': {
                username: msg.username,
                token: token,
                coins: 0,
            }
        });
    });
}