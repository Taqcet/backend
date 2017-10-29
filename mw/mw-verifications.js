const db = require('../db');
const formidable = require('formidable');
const multer  = require('multer');
const mkdirp = require('mkdirp');
const mw = {
	get_user_verification_status:(req,res,next)=>{
		const user = req.user || req.data.user;
		db('users')
			.where({user_id: user.user_id})
			.first()
			.then(user=>{
				if(empty(next))
					return res(user.user_verified);
				else{
					req.data.verification_state = req.verification_state = user.user_verified;
					return next();
				}
			});
	},
}
module.exports = mw;