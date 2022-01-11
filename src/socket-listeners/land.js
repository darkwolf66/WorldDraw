module.exports = function (socket, db) {
    socket.on('landInfo', async (info, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        if(typeof info == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof info.coord == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof info.world != 'string'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        let pos = info.coord;
        let world = info.world;

        const collection = await db.collection('world_lands')
        let land = await collection.findOne({land: "X"+pos.x+"Y"+pos.y, world: world})
        callback(land)
    })
    socket.on('mylands', async (doesnotmatter, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        const collection = await db.collection('world_lands')
        const collectionUsers = await db.collection('users')
        let user = await collectionUsers.findOne({token: socket.token})
        let lands = await collection.find({owner: user.username}).toArray()
        callback(lands)
    })
    socket.on('buyLand', async (land, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        if(typeof land == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof land.coord == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof land.world != 'string'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        let world = land.world;
        land = land.coord;

        let pos;
        try {
            pos = {
                x: parseInt(land.split('Y')[0].replace('X', '')),
                y: parseInt(land.split('Y')[1]),
                world: world
            }
        }catch (e){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }

        const collectionUsers = await db.collection('users')
        const collection = await db.collection('world_lands')
        let user = await collectionUsers.findOne({token: socket.token})
        let landInfo = await collection.findOne({land: land, world: world})

        if(landInfo == null){
            if((user.coins/1000000) >= 0.00001){
                let res = await collectionUsers.updateOne({token: user.token}, { "$inc": { "coins": -(0.1*100) } })
                console.log(res)
                await collection.insertOne({
                    land: land,
                    title: land,
                    world: world,
                    content: "",
                    sell: -1,
                    owner: user.username,
                    x: pos.x,
                    y: pos.y,
                })
            }else{
                return callback({
                    'result': 'error',
                    'msg': 'not_enough_coins'
                })
            }
        }else{
            if(user.username === landInfo.owner){
                return callback({
                    'result': 'error',
                    'msg': 'cant_buy_from_yourself'
                })
            }
            if(landInfo.sell <= 0){
                return callback({
                    'result': 'error',
                    'msg': 'not_for_sale'
                })
            }
            if(user.coins >= landInfo.sell){
                let owner = await collectionUsers.findOne({username: landInfo.owner})
                await collectionUsers.updateOne({token: user.token}, { "$inc": { "coins": -landInfo.sell } })
                await collectionUsers.updateOne({username: owner.username}, { "$inc": { "coins": landInfo.sell } })

                await collection.updateOne({land: land},{
                    title: land,
                    content: "",
                    sell: -1,
                    owner: user.username,
                    x: pos.x,
                    y: pos.y,
                })
            }else{
                return callback({
                    'result': 'error',
                    'msg': 'not_enough_coins'
                })
            }
        }

        callback(land)
    })
    socket.on('buildPoint', async (point, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        if(typeof point == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof point.coord == 'undefined'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof point.world != 'string'){
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        if(typeof point.color != 'string'){
            point.color = "#000000"
        }

        let world = point.world;
        let color = point.color;
        point = point.coord;
        let pointLand = 'X'+(point.x-(point.x%50))+'Y'+(point.y-(point.y%50))

        const collectionUsers = await db.collection('users')
        const collectionWorldLands = await db.collection('world_lands')
        let user = await collectionUsers.findOne({token: socket.token})
        pointLand = await collectionWorldLands.findOne({land: pointLand, world: world, owner: user.username})

        if(pointLand == null){
            return callback({
                'result': 'error',
                'msg': 'not_yours'
            })
        }else{
            const collectionWorldDraws = await db.collection('world_draws')
            point.x = (point.x-(point.x%10));
            point.y = (point.y-(point.y%10));
            console.log(point)
            const worldPoint = await collectionWorldDraws.findOne({x: point.x, y: point.y, world: world})

            if(worldPoint != null){
                console.log(user.coins/1000000)
                if(user.coins/1000000 < 0.000001){
                    return callback({
                        'result': 'error',
                        'msg': 'not_enough_coins'
                    })
                }else{
                    if(worldPoint.color === color){
                        await collectionWorldDraws.deleteOne({x: point.x, y: point.y, world: world})
                        color = '#90bfd0';
                    }else{
                        await collectionWorldDraws.updateOne({x: point.x, y: point.y, world: world}, {'$set': {
                                'color': color
                            }
                        })
                    }
                    await collectionWorldDraws.updateOne({username: user.username}, { "$inc": { "coins": -1 } })
                    return callback({
                        'result': 'success',
                        'point': {
                            x: point.x,
                            y: point.y,
                            world: world,
                            color: color
                        }
                    })
                }
            }else{
                if(user.coins/1000000 < 0.000001){
                    return callback({
                        'result': 'error',
                        'msg': 'not_enough_coins'
                    })
                }else{
                    await collectionWorldDraws.insertOne({ x: point.x, y: point.y, world: world, color:  color, other: null})
                    await collectionUsers.updateOne({username: user.username}, { "$inc": { "coins": -1 } })
                    return callback({
                        'result': 'success',
                        'point': {
                            x: point.x,
                            y: point.y,
                            world: world,
                            color: color
                        }
                    })
                }
            }
        }
    })
}