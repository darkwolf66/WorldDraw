module.exports = function (socket, db) {
    socket.on('world', async (world, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        if (typeof world == 'undefined' || typeof world != "string") {
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        world = world.toLowerCase()
        if(world.length > 32 || world.length < 4){
            return callback({
                'result': 'error',
                'msg': 'world_does_not_exists'
            })
        }
        const collection = db.collection('world_draws');
        let world_data = await collection.find({world: world}).toArray();
        callback({
            result: 'sucesss',
            world_data: world_data
        })

    })
    socket.on('worldLands', async (world, callback) => {
        if (typeof callback !== 'function') {
            return false;
        }
        if (typeof world == 'undefined' || typeof world != "string") {
            return callback({
                'result': 'error',
                'msg': 'invalid'
            })
        }
        world = world.toLowerCase()
        if(world.length > 32 || world.length < 4){
            return callback({
                'result': 'error',
                'msg': 'world_does_not_exists'
            })
        }
        const collection = db.collection('world_lands');
        let world_data = await collection.find({world: world}).toArray();
        callback({
            result: 'sucesss',
            world_lands_data: world_data
        })
    })
}