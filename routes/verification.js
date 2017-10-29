var express = require('express');
var router = express.Router();
const  verifications = require('../mw/mw-verifications');
/* GET users listing. */
router.ws('/watch', function(ws, req) {
	var user = req.user;
	ws.on('message', function(msg) {
		verifications.get_user_verification_status({user:user},status =>{
			if(status == 1){
				ws.send(status);
			}
			else{

			}
		});
	});
});
module.exports = router;
