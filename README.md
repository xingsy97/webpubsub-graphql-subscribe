# webpubsub-graphql-subscribe

## Introduction
[Microsoft Azure Web PubSub](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/overview) is a real-time messaging cloud service.
In GraphQL, `subscriptions` are long-lasting GraphQL read operations that can update their result whenever a particular server-side event occurs. And it is usually implemented with WebSocket protocol. 

Firstly, this package helps developers use Microsoft Azure WebPub service to avoid server-side maintenance of WebSocket connections between users clients and GraphQL server caused by `subscriptions` query from clients.

Secondly, this package provides a replacement for `PubSub` using Azure Web PubSub service. [PubSub](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#the-pubsub-class) is an in-memory event-publishing system provided by [Apollo server](https://www.apollographql.com/docs/apollo-server/data/subscriptions/).

## Prepare

1. Create a Microsoft Azure Web PubSub resource instance. Details are [Here](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/quickstart-serverless?tabs=javascript).

2. Use `ngrok` to expose our local endpoint to the public Internet

**Notice**: make sure the region of your Azure Web PubSub resource and the region of ngrok tunnel server are the same. For Example, if your Azure Web PubSub instance is located in Asia Pacific (ap) region , run your ngrok with parameter `--region=ap` as below. [Ngrok documents](https://ngrok.com/docs#global-locations) shows more location settings.
```
ngrok http --region=ap 8888 
```
Then you'll get a forwarding endpoint `http://{ngrok-id}.ngrok.io` like `http://1bff94a2f246.ap.ngrok.io`

3. Set `Event Handler` in Azure Web PubSub service. Go to **Azure portal** -> Find your Web PubSub resource -> **Settings**. Add two new hub settings as below. Replace the {ngrok-id} to yours. 

| Hub Name: graphql_main                         |                    |                                |
| ---------------------------------------------- | ------------------ | ------------------------------ |
| URL Template                                   | User Event Pattern | System Events                  |
| http://{ngrok-id}.ngrok.io/wps-services/main   | *                  | connect,connected,disconnected |


| Hub Name: graphql_pubsub                       |                    |                                |
| ---------------------------------------------- | ------------------ | ------------------------------ |
| URL Template                                   | User Event Pattern | System Events                  |
| http://{ngrok-id}.ngrok.io/wps-services/pubsub | *                  | No system Events is selected   |

## Deploy a demo
1. Clone this repository and install required package
```git
git clone https://github.com/xingsy97/webpubsub-graphql-subscribe
cd webpubsub-graphql-subscribe
npm install
```

2. replace `<web-pubsub-connection-string>` in `demos/demo.js` Line 7 to your own Azure Web PubSub connection string

3. Compile && Run the demo
```bash
npm run compile && npm run demo
```

4. Open your web browser like Google Chrome, visit `http://localhost:4000/graphql`.
Copy the following GraphQL query to the left panel.
```gql
subscription sampleSubscription {
  numberIncremented
}
```
Then click the play button and watch the right pannel.

## Usage
`src/demos/demo-without-webpubsub.ts` is a sample show Subscriptions in Apollo Server without Azure WebPub service. Follow these instructions, we will apply Web Pubsub to this sample.
1. define a variable to store Web PubSub connection string
```javascript
const webpubsub_conn_string = "<webpubsub-connection-string>"
```

2. replace original in-memory event system `PubSub` to our `WpsPubSub` based on Web PubSub.

Old:
```
const pubsub = new PubSub();
```

New: 
```
const pubsub = new WpsPubSub(webpubsub_conn_string);
```

3. use `create_webpubsub_subscribe_server` exported by our package to create a subscription server

Old:
```javascript
SubscriptionServer.create(
  { schema, execute, subscribe },
  { server: httpServer, path: apolloServer.graphqlPath }
);
```

New:

```javascript
await create_webpubsub_subscribe_server(apolloServer, schema, pubsub, webpubsub_conn_string);
```

Now your subscription server inside Apollo Server is based on Azure Web PubSub service. Refer to `src/demos/demo.ts` for complete source code.


## Implementations
- class `WpsWebSocketServer`
  - Original GraphQL subscriptions implementation starts up a WebSocket server which listens to clients and maintains WebSocket connections in server-side. 
  - This class replaces original `WebSocket.Server` and communicate between the server and WebPub service using HTTP protocol.
  - And clients use WebSocket communicates with WebPub service rather than directly communicate with our server by WebSocket.

- class `WpsPubSub`
  - It implements the `PubSubEngine` Interface from the `graphql-subscriptions` package using Azure Web PubSub service.
  - It replaces the original in-memory event system `PubSub` and allows you to connect your subscriptions manager to an Azure Web PubSub service to support multiple subscription manager instances.

