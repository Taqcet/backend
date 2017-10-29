const db = require('../db');

const devices = {
	find:(req,res,next)=>{
		var id = req.data.device_id || req.body.device_id || req.query.device_id;
		const unique_id = req.data.device_unique_id || req.body.device_unique_id || req.query.device_unique_id;
		const pattern = id? {device_id:id}: unique_id?{device_unique_id:unique_id} :null;
		if(empty(pattern))
			return next();
		db('devices').where(pattern).then(s=>{
			req.data.devices = !empty(s)?s:null;
			return next()
		})
	},
	register:(req,res,next)=>{
		var d = req.data.device || req.body.device;
		d.device_type = d.isMobile? 'mobile':d.isTablet?'tablet':'desktop';
		d.device_platform =  d.platform;
		d.device_version = d.version;
		d.device_state = 0;
		delete d.isMobile;
		delete d.isTablet;
		delete d.platform;
		delete d.version;

		const handle_find= s=>{
			if(empty(s))
			  return db('devices').insert(d)
				.returning('device_id').into('devices');
			else
               return s.device_id;
		};
		const handle_register = f=>{
			try{
				req.data.user_id = req.data.user.user_id;
				req.data.device_id = typeof f == 'object'? f[0]:f;
				console.log(req.data.user_id, req.data.device_id);
			}
			catch(err){
				console.log(err);
			}
			return next();
		};
		db('devices').where({device_unique_id: d.device_unique_id})
			.first()
			.then(handle_find)
			.then(handle_register)
			.catch(err=>{
				console.log(err)
				return next(err);
			})
	},
	refresh_state:(req,res,next)=>{
		const device_id = req.data.device_id || req.body.device_id || req.query.device_id;
		console.log('refreshing state', device_id)
		if(empty(device_id))
			return next();
		db('users_to_devices')
			.where({device_id:device_id, user_to_device_state:1})
			.then(d=>{
				var state = empty(d)?0:1;
				return db('devices').where({device_id:device_id}).update({device_state:state})
			})
			.then(s=>{
				return next();
			})
			.catch(err=>{
				console.log(err);
				return next(err)
			})
	},
};

module.exports = devices;