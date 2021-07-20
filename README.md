# webpubsub-graphql-subscribe

## Introduction
A typescript package helps developers use Microsoft Azure WebPub service in GraphQL subscription query and replace the in-memory event-publishing system [PubSub](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#the-pubsub-class) provided by [Apollo server](https://www.apollographql.com/docs/apollo-server/data/subscriptions/) with Azure WebPub.

## Deployment

1. Create an Azure Web PubSub service instance. Here is the [detail](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/quickstart-serverless?tabs=javascript).
2. Use `ngrok` to expose our endpoint to the public internet
  **Notice: make sure your the region of your Microsfot Azure Web PubSub service and ngrok are the same**. For Example, If your Azure Web PubSub service is located in Asia Pacific (ap), run your ngrok with parameter `--region=ap`.

```
ngrok http --region=ap 8888 
```

Then you'll get a forwarding endpoint `http://{ngrok-id}.ngrok.io` like `http://1bff94a2f246.ap.ngrok.io -> http://localhost:8888`

3. Set `Event Handler` in Azure Web PubSub service. Go to **Azure portal** -> Find your Web PubSub resource -> **Settings**. Add  two new hub settings mapping as below. Replace the {ngrok-id} to yours.

| Hub Name: | graphql_main                                   |                    |                                |
| --------- | ---------------------------------------------- | ------------------ | ------------------------------ |
|           | URL Template                                   | User Event Pattern | System Events                  |
|           | http://{ngrok-id}.ngrok.io/wps-services/main   | *                  | connect,connected,disconnected |
| Hub Name: | graphql_pubsub                                 |                    |                                |
|           | URL Template                                   | User Event Pattern | System Events                  |
|           | http://{ngrok-id}.ngrok.io/wps-services/pubsub | *                  | connect,connected,disconnected |

4. Clone this repository, compile && run the demo

```bash
git clone https://github.com/xingsy97/webpubsub-graphql-subscribe
cd webpubsub-graphql-subscribe
npm run compile
npm run integration
```

5. Open your web browser like Chorme, visit `http://localhost:4000`
Copy the following GraphQL query to the left panel and click the play button.
```gql
subscription sampleSubscription {
  numberIncremented
}
```

## Implementation
...