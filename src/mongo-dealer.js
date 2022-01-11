class MongoDealer {
    constructor(client) {
        this.client = client
    }
    connect() {
        console.log('Requesting MongoDealer Connection')
        return this.client
            .connect()
            .then(() => new Promise((resolve, reject) => {
                resolve(this.client);
            }))
    }

    isConnected() {
        return !!this.client && !!this.client.topology && this.client.topology.isConnected()
    }

    ifNotConnectedConnect() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                resolve(this.connect())
            } else {
                resolve();
            }
        })
    }
}

module.exports = MongoDealer