const db = require('../db');
const formidable = require('formidable');
const multer  = require('multer');
const mkdirp = require('mkdirp');
const mw = {
	get_user_validation_status:(req,res,next)=>{
		const user = req.user || req.data.user;
		db('validations')
			.where({user_id: user.user_id})
			.first()
			.then(validation=>{
				if(req.user)
					req.user.user_validated = validation.validation_state;

				if(req.data.user)
					req.data.user.user_validated = validation.validation_state;

				if(empty(next))
					return res(validation.validation_state);
				else
					return next();
			});
	},
	initialize:(req,res,next)=>{
		const device_id = req.data.device_id || req.body.device_id || req.query.device_id;
		const user_id = req.data.user_id || req.body.user_id || req.query.user_id;
		const user_to_device_id =  req.data.user_to_device_id || req.body.user_to_device_id || req.query.user_to_device_id;

		db('validations')
			.insert({device_id, user_id, user_to_device_id})
			.returning('validation_id')
			.then(s=>{
				if(!empty(s))
					req.data.validation_id = typeof s == 'object'?s[0]:s;

				return next();
			}).catch(err=> {console.log(err); next(err)});
	},
	save_content:(req,res,next)=>{
		var storage = multer.diskStorage({
             destination: function (req, file, cb){
                 var path='uploads/'+req.user.user_id;
                 mkdirp(path, function(err) {
                     if(err)console.log(err);
                     return cb(null,path);
                 });
             },
             filename: function (req, file, cb){
                 req.file = file;
	             var newFileName = req.user.user_id + '_'+Date.now()+'_'+file.originalname;
	             req.data[file.fieldname] = 'uploads/'+req.user.user_id+'/'+newFileName;
                 cb(null, newFileName);
             }
         });
		return multer({ storage: storage });
	},
	save_to_user:(req,res,next)=>{
		const user = req.user || req.data.user;
		db('validations')
			.where({user_id: user.user_id})
		    .update({
			            validation_picture_1:req.data['validation_picture_1'],
			            validation_picture_2:req.data['validation_picture_2'],
			            validation_video:req.data['validation_video'],
		                validation_token: req.query.validation_token,
		                validation_state:1
		            })
			.then(s => {
				return next();
			});
	},
	receive: (req,res,next)=>{
		console.log('receiving form', req.headers)
		//delete req.headers['content-type']
		//delete req.headers['content-length']
		var form = new formidable.IncomingForm();
		form.maxFieldsSize = 20 * 1024 * 1024;
		form.parse(req, function(err, fields, files){
			const picture_1 = files['validation_picture_1'];
			const picture_2 =  files['validation_picture_2'];
			const video =  files['validation_video'];
			const token =  fields['validation_token'];

			console.log(err, fields,files)

			next();

		});
	},

}
module.exports = mw;