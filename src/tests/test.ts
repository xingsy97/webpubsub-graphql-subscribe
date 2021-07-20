// libs
import WpsWebSocketServer from '../WpsWebSocketServer'
import {WpsPubSub} from '../webpubsub-pubsub'
import {config} from "../../settings"
const {ApolloServer, gql } = require('apollo-server');
const express = require('express');

// global variable
const app = express();
const pubsub = new WpsPubSub(app);	// const pubsub = new PubSub();
let currentNumber = 0;

// Schema definition
const typeDefs = gql`
	type Query { currentNumber: Int }
	type Subscription { numberIncremented: Int }
`;

// Resolver map
const resolvers = {
	Query: {
		currentNumber() { return currentNumber; }
	},
	Subscription: {
		numberIncremented: {
			subscribe: () => pubsub.asyncIterator(['NUMBER_INCREMENTED']),    // subscribe: asyncIterator([<event-name-1>, ...])
		},
	}
};

function incrementNumber() {
	currentNumber++;
	pubsub.publish('NUMBER_INCREMENTED', { numberIncremented: currentNumber });     // publish: publish(<event-name>, <event-data>)
	setTimeout(incrementNumber, 1000);
}

async function main() {
	const apolloServer = new ApolloServer({typeDefs, resolvers,});

	var wpsServer = new WpsWebSocketServer(config.DEFAULT_WPS_HTTP_PORT, config.DEFAULT_WPS_CONN_STRING, config.DEFAULT_WPS_MAIN_PUB, app);
	let wps_endpoint_url = await wpsServer.getWebSocketUrl();
	
	apolloServer.subscriptionsPath = wps_endpoint_url;
	apolloServer.installSubscriptionHandlers(wpsServer);
	await pubsub.initWebSocket();
	// apolloServer.
	apolloServer.listen().then(({url:any}:any) => {
		console.log(`🚀 Subscription endpoint ready at Azure WebPubSub Service`) 
		console.log('🚀 Query at studio.apollographql.com/dev')
	});

	incrementNumber();
}


main()
