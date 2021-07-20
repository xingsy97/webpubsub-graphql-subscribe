import {config} from "../settings";
var DEBUG = config.DEBUG;

export function log(...args: any){
	console.log(new Date(), ...args);	
}

export function LOG(log_msg: string = "") {
	return function (target:any, propertyKey:any, descriptor: PropertyDescriptor) {
		var originalMethod = descriptor.value;
		log_msg = log_msg.length > 0 ? log_msg : propertyKey;
		// console.log(`functionName=${propertyKey}   desc=${JSON.stringify(descriptor)}  `);
		
		descriptor.value = function(...args: any[]) {
			if (DEBUG) {
				log(`[begin] ${log_msg}`);
				console.log('args = ', args)
			}
			let result = originalMethod.apply(this, args);
			if (DEBUG) {
				log(`[ end ] ${log_msg}`);
			}
			return result;
		};

		return descriptor;
	}
}


