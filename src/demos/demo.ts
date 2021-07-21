// Modified From https://github.com/apollographql/docs-examples/blob/7105d77acfc67d6cb4097cc27a7956051ec0c1b5/server-subscriptions-as3/index.js
import WpsWebSocketServer from '../WpsWebSocketServer'
import {WpsPubSub} from '../webpubsub-pubsub'
import {config} from "../../settings"
import {ApolloServer, gql} from "apollo-server"
const express = require('express');

const app = express();

// replace original `const pubsub = new PubSub();`
const pubsub = new WpsPubSub();	

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

/**
 * use Azure Web PubSub service to handle GraphQL subscriptions query in Apollo server
 */
async function applyWpsToApolloServer(apolloServer: ApolloServer) {
	// create WpsWebSocketServer, set the `subscriptionsPath`
	// use `installSubscriptionHandlers` to make `wpsServer` handle GraphQL subsciption query
	var wpsServer = new WpsWebSocketServer(config.DEFAULT_WPS_HTTP_PORT, config.DEFAULT_WPS_CONN_STRING, config.DEFAULT_WPS_MAIN_PUB, app);
	apolloServer.subscriptionsPath = await wpsServer.getWebSocketUrl();
	apolloServer.installSubscriptionHandlers(wpsServer);

	await pubsub.initWebSocket();
}

async function main() {
	const apolloServer = new ApolloServer({typeDefs, resolvers,});
	await applyWpsToApolloServer(apolloServer)	
	
	apolloServer.listen().then(({url:any}:any) => {
		console.log(`🚀 Visit http://localhost:4000`) 
		console.log(`🚀 Subscription endpoint ready at Azure WebPubSub Service`) 
		console.log('🚀 Query at studio.apollographql.com/dev')
	});

	incrementNumber();
}

main()