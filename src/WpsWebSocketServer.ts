const express = require('express');
import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { WebPubSubEventHandler } from "@azure/web-pubsub-express";
import { EventEmitter } from "events";
import {LOG, log} from "./utils"
import WebSocket = require("ws");
import { config } from "../settings";

class VirtualWebSocketServer extends WebSocket.Server{
	ee:EventEmitter = new EventEmitter();
	protocol: string = "graphql-ws";
	readyState: number;

	constructor() {
		super({port: undefined, noServer: true});
		this.readyState = WebSocket.OPEN;
	}

	on(eventName: string, callback: any) {
		this.ee.addListener(eventName, callback);
		return this;
	}
}


class SubWpsWebSocketServer extends VirtualWebSocketServer{
	serviceClient: WebPubSubServiceClient;
	connectionId: string;

	constructor(serviceClient: WebPubSubServiceClient, connectionId: string) {
		super();
		this.serviceClient = serviceClient;
		this.connectionId = connectionId;
	}

	@LOG("[on] [SubWsServer]")
	on(eventName: string, callback: any) { return super.on(eventName, callback); }

	@LOG("[send] [SubWsServer]")
	send(data: any) { this.serviceClient.sendToConnection(this.connectionId, JSON.parse(data)); }
}


class WpsWebSocketServer extends VirtualWebSocketServer {
	app: any;
	connectionId_to_ws: { [key:string]: SubWpsWebSocketServer } = {};
	serviceClient: WebPubSubServiceClient;

	constructor(wps_http_port: number, wps_conn_string: string, hub_name: string, express_server: any){
		super();
		this.serviceClient = new WebPubSubServiceClient(wps_conn_string, hub_name);
		this.readyState = WebSocket.CLOSED;
		this.app = express_server ? express_server : express();

		let handler = new WebPubSubEventHandler(hub_name, ['*'], {
			path: config.DEFAULT_WPS_MAIN_HANDLER_URL,
			handleConnect: (req, res) => {
				let connectionId = req.context.connectionId;
				log(`[begin] handleConnect`);
				this.connectionId_to_ws[connectionId] = new SubWpsWebSocketServer(this.serviceClient, connectionId);
				this.ee.emit("connection", this.connectionId_to_ws[connectionId], req);
				res.success({
					groups: ['users'],	// join into <groups>
					subprotocol: "graphql-ws"
				});
				this.readyState = WebSocket.OPEN;
				log(`[ end ] handleConnect`);
			},

			onConnected: async req => {
				log(`[onConnected] ${req.context.userId}`);
			}, 

			handleUserEvent: async (req, res) => {
				log(`[begin] handleUserEvent = ${req.context.eventName}`);
				if (req.context.eventName === 'message') {	// connection ? message ? 
					this.connectionId_to_ws[req.context.connectionId].ee.emit("message", req.data);
			  	}
			  	res.success();
				log(`[ end ] handleUserEvent = ${req.context.eventName}`);
			},

			onDisconnected: async req => {
				log(`[onDisconnected] ${req.context.userId}`);
				if (req.context.connectionId in Object.keys(this.connectionId_to_ws))
					this.connectionId_to_ws[req.context.connectionId].readyState = WebSocket.CLOSED;
			}, 
		});
		this.app.use(handler.getMiddleware());
		this.app.get('/', (req:any, res:any) => { res.send("hello world!"); });
		this.app.listen(wps_http_port, () => log(`Internal HTTP Server started at ${wps_http_port}`));
	}

	@LOG("[on] [WpsWsServer]")
	on(eventName: string, callback: any) { return super.on(eventName, callback); }
	
	async getWebSocketUrl(id:string ="apol") {
		let token = await this.serviceClient.getAuthenticationToken({ userId: id });
		return token.url;
	}

}

export default WpsWebSocketServer;