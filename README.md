# webpubsub-graphql-subscribe

## Introduction
[Azure WebPub](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/overview) is a real-time messaging cloud service.
In GraphQL, subscriptions are long-lasting GraphQL read operations that can update their result whenever a particular server-side event occurs. And it is usually implements with WebSocket protocol. 

This package helps developers use Microsoft Azure WebPub service to avoid the maintainence of WebSocket connections caused by GraphQL subscriptions.
Besides it provides a replacement for the in-memory event-publishing system [PubSub](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#the-pubsub-class) provided by [Apollo server](https://www.apollographql.com/docs/apollo-server/data/subscriptions/) using Azure WebPub.

## Demo Deployment

1. Create an Azure Web PubSub service instance. Details are [Here](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/quickstart-serverless?tabs=javascript).

2. Use `ngrok` to expose our local endpoint to the public Internet

**Notice**: make sure the region of your Azure Web PubSub resource and the region of ngrok are the same. For Example, If your Azure Web PubSub resource is located in Asia Pacific (ap) region , run your ngrok with parameter `--region=ap` as below.
```
ngrok http --region=ap 8888 
```
Then you'll get a forwarding endpoint `http://{ngrok-id}.ngrok.io` like `http://1bff94a2f246.ap.ngrok.io`

3. Set `Event Handler` in Azure Web PubSub service. Go to **Azure portal** -> Find your Web PubSub resource -> **Settings**. Add  two new hub settings mapping as below. Replace the {ngrok-id} to yours.

| Hub Name: | graphql_main                                   |                    |                                |
| --------- | ---------------------------------------------- | ------------------ | ------------------------------ |
|           | URL Template                                   | User Event Pattern | System Events                  |
|           | http://{ngrok-id}.ngrok.io/wps-services/main   | *                  | connect,connected,disconnected |
| Hub Name: | graphql_pubsub                                 |                    |                                |
|           | URL Template                                   | User Event Pattern | System Events                  |
|           | http://{ngrok-id}.ngrok.io/wps-services/pubsub | *                  | connect,connected,disconnected |

4. Clone this repository
```bash
git clone https://github.com/xingsy97/webpubsub-graphql-subscribe
cd webpubsub-graphql-subscribe
```

5. Rename file `example-settings.js` to `settings.js` and replace `<web-pubsub-connection-string>` to your own Azure Web PubSub connection string.

6. Compile && run the demo
```bash
npm run compile
npm run integration
```
7. Open your web browser like Chorme, visit `http://localhost:4000`.
Copy the following GraphQL query to the left panel and click the play button.
```gql
subscription sampleSubscription {
  numberIncremented
}
```

## Implementation
...