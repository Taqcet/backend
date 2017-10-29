const db = require('../db');
const formidable = require('formidable');
const multer  = require('multer');
const mkdirp = require('mkdirp');
const async = require('async');

const max_number_of_authentications = 5;
/*
* */
const mw = {
	create_transaction_request:(params,callback)=>{

		const initializeTransactionRequest = (params,user, auth, business,callback)=>{
			console.log(params)
			db('currencies')
				.where({currency_name:params.currency})
				.first()
				.then(currency => {
					if(empty(currency))
						return callback(new Error('Currency is not found'));

					var object = {
						transaction_status:0,
						transaction_amount: params.amount,
						transaction_currency:currency.currency_id,
						transaction_business: business.business_id,
						transaction_user: user.user_id,
						transaction_authentication: auth
					};

					db('transactions')
						.returning('transaction_id')
						.insert(object)
						.then(transaction_ids => {
							if(empty(transaction_ids))
								return callback(new Error('Transaction was not Initialized'));
							return callback(null, transaction_ids[0]);
						});
				});
		}
		const getBusiness = (params,user,auth,callback)=>{
			db('businesses')
				.first()
				.then(business => {
				return callback(null,params,user,auth,business);
			});
		}
		const initializeAuthenticationRequest = (params,user,callback)=>{
			var object = {
				authentication_status :0,
				authentication_user:user.user_id
			};
			db('authentications')
				.returning('authentication_id')
				.first()
				.insert(object)
				.then(auths => {
					if(!empty(auths))
					return callback(null,params,user,auths[0]);
				}).catch(err =>{
					console.log(err)
				});
		}
		const getUserFromNationalID = (params,callback)=>{
			db('users')
				.where({nationalid: params.nationalid})
				.first()
				.then(user =>{
					if(empty(user))
						return callback(new Error('User not found'));

					return callback(null,params,user);
				}).catch(err => console.log(err))
		}


		//getUserFromID((err,user) =>{
		//	if(empty(user))
		//		return callback(new Error('User Not Found'));
		//	createAuth(user, (err, authentication_id)=>{
		//		console.log('done')
		//	});
		//})

		async.waterfall(
					[   getUserFromNationalID.bind(null, params),
					    initializeAuthenticationRequest,
						getBusiness,
						initializeTransactionRequest],
		             (err, result)=>{
			             if(err)
			                return callback(err,null)
			             return callback(null,result);
		             });
	},
	check_transaction_authentication:(params,callback)=>{
		db('transactions')
			.leftJoin('currencies', 'currencies.currency_id','transaction_currency')
			.where({transaction_id:params.transaction_id})
			.select('transaction_id','transaction_amount as amount',
			        'transaction_end_date', 'transaction_request_date',
			        'transaction_user as user_id','transaction_status',
			        'currency_name as currency')
			.first()
			.then(trans=>{
				if(empty(trans))
					return callback(null,null);

				if(trans.transaction_status == 1 || trans.transaction_status == 2 || trans.transaction_status == 3)
					return callback(null, trans);

				return callback(null,null)
			})
	},
	cancel_transaction_request:(params,callback)=>{
		db('transactions')
			.where({transaction_id:params.transaction_id})
			.first()
		    .then(g =>{
			    if(g.transaction_status == 0)
				    return db('transactions')
					    .where({transaction_id:params.transaction_id})
					    .update({transaction_status: 2})
					    .returning('transaction_authentication')
					    .then(trans =>{
						    db('authentications')
							    .where({authentication_id: trans[0]})
							    .update({authentication_status: 2, })
							    .then( s => {
								    return callback(null, {done:true, transaction_id: trans[0]})
							    });
					    });
			    else
				    return callback(null, {done:true, transaction_id: params.transaction_id})
	    })


	},

	get_user_pending_transaction:(req,res,next)=>{
		const user = req.user || req.data.user;
		db('transactions')
			.where({transaction_user: user.user_id, transaction_status:0})
			//.leftJoin('authentications', 'users.id', 'authentications.authentication_id')
			.leftJoin('businesses','transactions.transaction_business','businesses.business_id')
			.leftJoin('currencies','transactions.transaction_currency','currencies.currency_id')
			.select('transaction_user', 'transaction_amount', 'currency_name', 'business_name',
			        'transaction_id', 'transaction_authentication', 'transaction_request_date')
			.then(transactions =>{
				var returnedTrans = null;
				if(!empty(transactions))
					returnedTrans = transactions[transactions.length -1];

				if(empty(next))
					return res(null, returnedTrans);
				else{
					req.data.pending_transaction = req.pending_transaction = returnedTrans;
					return next();
				}
			});
	},
	ensure_max_trials_after_error:(req,res,next)=>{
		db('transactions')
			.where({transaction_id:req.transaction_id})
			.first()
			.leftJoin('authentications','authentications.authentication_id','transaction_authentication')
			.then(trans =>{
				var numbOfTrial = trans.authentication_trials + 1;
				//Block Authentication
				//MAKE SURE USER IS BLOCKED FOR A MINUTE OR TWO
				if(numbOfTrial >= max_number_of_authentications){
					db('authentications')
						.where({authentication_id:trans.authentication_id})
						.update({authentication_trials :numbOfTrial, authentication_status: 3, authentication_end_date: new Date()})
						.then( s => {
							db('transactions')
								.where({transaction_id:req.transaction_id})
								.update({transaction_status: 3,  transaction_end_date: new Date()})
								.then(g => {
									return res(null, {
										trials:numbOfTrial,
										remainingTrials:0,
										maxTrialsReached: true
									})
								});
						});
				}
				else
					db('authentications')
						.where({authentication_id:trans.authentication_id})
						.update({ authentication_trials :numbOfTrial})
						.then( s=> {
							return res(null, {
								trials:numbOfTrial,
								remainingTrials:max_number_of_authentications - numbOfTrial,
								maxTrialsReached: false
							})
						});

		});
	},
	complete_transaction:(req,res,next)=>{
		db('transactions')
			.where({transaction_id:req.transaction_id})
			.update({transaction_status:1})
			.returning('transaction_authentication')
			.then(trans =>{
				db('authentications')
					.where({authentication_id:trans[0]})
					.update({authentication_status: 1, authentication_end_date: new Date()})
					.then( s => {
						return res(null, {done:true})
					});
			});
	},
}
module.exports = mw;