# webpubsub-graphql-subscribe

## Deployment

1. Create an Azure Web PubSub service instance
  Detailed in https://docs.microsoft.com/en-us/azure/azure-web-pubsub/quickstart-serverless?tabs=javascript
2. Use `ngrok` to expose our endpoint to the public internet
  **Notice: make sure your the region of your Azure Web PubSub Service and ngrok are same**. For Example, If your Azure Web PubSub service is located in Asia Pacific (ap), run your ngrok with parameter `--regiohn=ap`.

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

4. Clone this repository

```bash
git clone https://github.com/xingsy97/webpubsub-graphql-subscribe
cd webpubsub-graphql-subscribe
npm run compile
npm run integration
```



## Implementation
