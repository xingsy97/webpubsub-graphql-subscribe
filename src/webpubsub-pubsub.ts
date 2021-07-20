import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { EventEmitter } from 'events';
import { PubSubEngine } from './graphql-pubsub-common/pubsub-engine';
import { WebPubSubEventHandler } from '@azure/web-pubsub-express';
import { LOG , log} from './utils';
import { v4 as uuidv4 } from 'uuid';
import {config} from "../settings";
const WebSocket = require('ws');

export interface PubSubOptions {
	eventEmitter?: EventEmitter;
}

export class WpsPubSub extends PubSubEngine {
	protected ee: EventEmitter;
	private subscriptions: { [key: string]: [string, (...args: any[]) => void] };
	private subIdCounter: number;
	serviceClient: WebPubSubServiceClient;
	wps_userId: string;
	ws: any;
	ackId: number;

	constructor(app: any) {
		super();
		this.subscriptions = {};
		this.subIdCounter = 0;
		
		this.serviceClient = new WebPubSubServiceClient(config.DEFAULT_WPS_CONN_STRING, config.DEFAULT_WPS_PUBSUB_PUB);
		this.wps_userId = `pubsubEngine-${uuidv4()}`;
		this.ws = undefined;
		this.ackId = 1;

		let handler = new WebPubSubEventHandler(config.DEFAULT_WPS_PUBSUB_PUB, ['*'], {
			path: config.DEFAULT_PUBSUB_ENGINE_HANDLER_URL,
			handleConnect: (req, res) => {
				log("handleConnect req.context = ", req.context)
				res.success({groups: ['pubsub-users'],	subprotocol: "json.webpubsub.azure.v1"});
			},

			onConnected: async req => {
				log(`onConnected`);
			}, 

			handleUserEvent: async (req, res) => {
				log("handleUserEvent", req.data);
			  	res.success();
			},

			onDisconnected: async req => {
				log(`[onDisconnected] ${req.context.userId}`);
			}, 
		});
		app.use(handler.getMiddleware());
	}

	public static get_eventName(eventName: string) { return `event-${eventName}`}

	@LOG("[wpsPubSub] initWebSocket")
	public async initWebSocket() {
		let token = await this.serviceClient.getAuthenticationToken({ 
			userId: this.wps_userId, 
			roles: ["webpubsub.joinLeaveGroup", "webpubsub.sendToGroup"]}
		);
		log(`[wps-pubsub-ws-url] = ${token.url.substr(0, 30)} ...`);
		log(`[userId] = ${this.wps_userId}`);
		this.ws = new WebSocket(token.url, "json.webpubsub.azure.v1");
		return new Promise((resolve:any, reject:any) => {
			this.ws.on('open', () => { 
				log('wps-pubsub connected');
				log(`[ end ] [initWebSocket] isOpen = ${this.ws.readyState === WebSocket.OPEN}`);
				resolve();
			});
			this.ws.on('message', (req: any) => {
				req = JSON.parse(req);
				log(`onMessage req = `, req, `req.type = ${req.type}`);
				if (req.type === "message") {
					this.ws.emit(req.group, req.data);
				}
			})
			this.ws.on('error', (err: any) => {
				log(err);
			});
			
		});
	}


	public async publish(eventName: string, payload: any): Promise<void> {
		log(`publish <${eventName}> `, payload, ` ackId= ${this.ackId} isOpen= ${this.ws.readyState === WebSocket.OPEN} `);

		this.ws.send(JSON.stringify({
			type: "sendToGroup",
			group: WpsPubSub.get_eventName(eventName),
			data: payload,
			// ackId: this.ackId
		}));
		this.ackId++;
		// this.serviceClient.group(WpsPubSub.get_eventName(eventName)).sendToAll(payload);
		return Promise.resolve();
	}

	public async subscribe(eventName: string, onMessage: (...args: any[]) => void): Promise<number> {
		log(`subscribe <${eventName}> ackId= ${this.ackId} isOpen= ${this.ws.readyState === WebSocket.OPEN}`);

		this.subIdCounter = this.subIdCounter + 1;
		this.subscriptions[this.subIdCounter] = [eventName, onMessage];
		this.ws.send(JSON.stringify({
			type: "joinGroup",
			group: WpsPubSub.get_eventName(eventName),
			// ackId: this.ackId
		}));
		this.ackId++;
		this.ws.addListener(WpsPubSub.get_eventName(eventName), onMessage);
		return Promise.resolve(this.subIdCounter);
	}

	public unsubscribe(subId: number) {
		const [eventName, onMessage] = this.subscriptions[subId];
		delete this.subscriptions[subId];

		this.ws.send(JSON.stringify({
			type: "leaveGroup",
			group: WpsPubSub.get_eventName(eventName),
		}));
		this.ws.removeListener(WpsPubSub.get_eventName(eventName), onMessage);
	}
}