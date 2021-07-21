import {config} from "../settings";
var DEBUG = config.DEBUG;

export function log(...args: any){
	if (DEBUG)
		console.log(new Date(), ...args);	
}

// a method decorator
export function LOG(log_msg: string = "") {
	return function (target:any, propertyKey:any, descriptor: PropertyDescriptor) {
		var originalMethod = descriptor.value;
		log_msg = log_msg.length > 0 ? log_msg : propertyKey;
		// console.log(`functionName=${propertyKey}   desc=${JSON.stringify(descriptor)}  `);
		
		descriptor.value = function(...args: any[]) {
			log(`[begin] ${log_msg}`);
			log('args = ', args)
			let result = originalMethod.apply(this, args);
			log(`[ end ] ${log_msg}`);
			return result;
		};

		return descriptor;
	}
}


