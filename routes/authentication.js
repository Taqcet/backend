var express = require('express');
var router = express.Router();
const authentications = require('../mw/mw-authentications');
const users = require('../mw/mw-users');

/* Status codes
	0 => pending
	1 => accepted
	2 => canceled by user
	3 => rejected due to too many wrong authentication
	4 => rejected due to credit check
. */



router.ws('/watch', function(ws, req) {
	var user = req.user;
	ws.on('message', function(msg) {
		var parsedMsg = JSON.parse(msg);
		console.log(parsedMsg);
		switch (parsedMsg.status){
			case 'get-pending-transaction':
				return authentications.get_user_pending_transaction({user:user}, (err,transaction) =>{
					if(!empty(transaction)){
						ws.send(JSON.stringify({
							    status: 'received-pending-transaction',
		                        transaction:transaction
                        }));
					}
				});
				break;
			case 'authenticate-transaction':
				return users.check_pin(Object.assign(parsedMsg,{user:user}), (err, valid) =>{
					if(valid){
						authentications.complete_transaction(Object.assign(parsedMsg,{user:user}), (err, trial) =>{
							ws.send(JSON.stringify({status: 'authenticate-transaction-success'}));
						});
					}
					else{
						authentications.ensure_max_trials_after_error(Object.assign(parsedMsg,{user:user}), (err, trial) =>{
							ws.send(JSON.stringify({   status: 'authenticate-transaction-error',
								                       trials:trial.numberOfTrials,
													   remainingTrials: trial.remainingTrials,
								                       maxTrialsReached:trial.maxTrialsReached}));

						});
					}

				});
				break;
		}


	});
});


router.ws('/checkout', function(ws, req) {
	var user = req.user;
	ws.on('message', function(msg) {
		var parsedMsg = JSON.parse(msg);
		parsedMsg = Object.assign(parsedMsg,{user:user});

		switch (parsedMsg.status){
			case 'create-transaction-request':
				return authentications.create_transaction_request(parsedMsg, (err,transaction) =>{
					if(err || empty(transaction))
						return ws.send(JSON.stringify({
							                       status: 'error',
												   errorMessage: err
						                       }));
						return ws.send(JSON.stringify({
							                       status: 'pending-user-authentication',
							                       transaction_id:transaction
						                       }));

				});
			    break;

			case 'check-transaction-authentication':
				return authentications.check_transaction_authentication(parsedMsg, (err,transaction) =>{
					if(!empty(transaction))
					return ws.send(JSON.stringify(Object.assign(transaction,{status: transaction.transaction_status == 1?
			                                               'success':
														   'fail'})));
				});
				break;

			case 'cancel-transaction-request':
				if(empty(parsedMsg.transaction_id)){}
					//return ws.send(JSON.stringify({
					//	                       status: 'cancel-transaction-success',
					//	                       transaction_id:parsedMsg.transaction_id
					//                       }));
				else
					return authentications.cancel_transaction_request(parsedMsg, (err,returned) =>{
					//if(err || empty(returned))
					//	return ws.send(JSON.stringify({
					//		                              status: 'error',
					//		                              errorMessage: err
					//	                              }));
					//return ws.send(JSON.stringify({
					//	                              status: 'cancel-transaction-success',
					//	                              transaction_id:returned.transaction_id
					//                              }));

				});
				break;
		}


	});
});


module.exports = router;
