const db = require('../db');
const users_devices = {
	create_connection:(req,res,next)=>{
		const device_id = req.data.device_id || req.body.device_id || req.query.device_id;
		const user_id = req.data.user_id || req.body.user_id || req.query.user_id;
		db('users_to_devices')
			.insert({device_id, user_id, user_to_device_state:1})
			.returning('user_to_device_id')
			.then(s=>{
				if(!empty(s))
					req.data.user_to_device_id = typeof s == 'object'?s[0]:s;
				return next();
			}).catch(err=> {console.log(err); next(err)});
	},
	disconnect_device:(req,res,next)=>{
		const device_id = req.data.device_id || req.body.device_id || req.query.device_id;
		const query = {device_id:device_id, user_to_device_state:1};
		const set   = {user_to_device_state:0, user_to_device_disconnection_date:new Date()}
		db('users_to_devices')
			.where(query)
			.update(set)
			.then(s=>{
				return next();
			}).catch(err=> {
			console.log(err);
			return next(err)
		});
	},

}
module.exports = users_devices;