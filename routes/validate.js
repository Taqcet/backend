var express = require('express');
var router = express.Router();
const  validation = require('../mw/mw-validations');
/* GET users listing. */
router.post('/',
    validation.save_content().any(),
	validation.save_to_user,
    function(req, res, next) {
		res.json({uploaded:true});
	});

module.exports = router;
