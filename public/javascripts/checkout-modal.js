var socketUrl = "ws://localhost:8080/authentication/checkout";
var WS = new WebSocket(socketUrl);

var authentication_completed = false;
var max_wait_limit = 120000
var transaction_id = null;
var interval_check = null;

var closeElm = document.getElementById('taqcet-remove-modal');
var closeWhileWaitingElm = document.getElementById('taqcet-cancel-request');
var closeWhileWaitingElm2 = document.getElementById('taqcet-cancel-request-2');

var authElm = document.getElementById('taqcet-auth-button');

var formContainer = document.getElementById('taqcet-auth-form');
var loadingContainer = document.getElementById('taqcet-loading');
var authSuccessContainer = document.getElementById('taqcet-auth-success');
var authCancelContainer = document.getElementById('taqcet-auth-cancel');
var errorContainer = document.getElementById('taqcet-error');


function cancel_request(){
	WS.send(JSON.stringify(Object.assign({   status: 'cancel-transaction-request',
		                                     transaction_id:transaction_id})));
	close_modal();
}
function close_modal(){
	var event = new Event('paylatermodal-close');
	window.parent.document.dispatchEvent(event);
}



closeElm.onclick = cancel_request;
closeWhileWaitingElm.onclick = cancel_request;
closeWhileWaitingElm2.onclick = cancel_request;
//WE SHOULD INCLUDE IN ON IFRAME CLOSE

function getParams(paramName){
	var url = window.location.search.substring(2); //get rid of "?" in querystring
	var qArray = url.split('&'); //get key-value pairs
	var returned = {};
	for (var i = 0; i < qArray.length; i++){
		var pArr = qArray[i].split('='); //split key and value
		returned[pArr[0]] = pArr[1];
		//if (pArr[0] == paramName)
		//	return pArr[1]; //return value
	}
	return returned;
}
function checkForAuthentication(){
	var data = {
		transaction_id:transaction_id,
		status: 'check-transaction-authentication'
	};
	WS.send(JSON.stringify(Object.assign(data)));
}
authElm.onclick = function(){
	var inputElm = document.getElementById('taqcet-input-modal');
	var nIDvalue = inputElm.value;
	if(nIDvalue == '')
		return false;

	var data = {
		status:'create-transaction-request',
		nationalid: nIDvalue
	};
	loading();
	WS.send(JSON.stringify(Object.assign(data, getParams())));
	interval_check = setInterval(checkForAuthentication, 500);
	setTimeout(function(){
		if(!authentication_completed)
			cancel_request();
	},max_wait_limit)
};


function loading(){
	loadingContainer.style.display = 'block';
	formContainer.style.display = 'none';
	errorContainer.style.display = 'none';
	authSuccessContainer.style.display ='none';
	authCancelContainer.style.display ='none';
}
function handleAuthResponse(status, data){
	authentication_completed = true;
	clearInterval(interval_check);
	loadingContainer.style.display = 'none';
	formContainer.style.display = 'none';
	errorContainer.style.display = 'none';
	authSuccessContainer.style.display =status == 'success'?'block':'none';
	authCancelContainer.style.display = status == 'success'?'none':'block';

	var event = new CustomEvent('payment-response', {detail:data});
	window.parent.document.dispatchEvent(event);
	setTimeout(close_modal,2000);
}

function instructUserToOpenTheAppAndAuthentication(){
	var loadingMessageWait = document.getElementById('taqcet-loading-wait');
	var loadingMessageAuth = document.getElementById('taqcet-loading-authorize');

	loadingMessageAuth.style.display = 'block';
	loadingMessageWait.style.display = 'none';
}
function errorOccured(errorMessage){
	errorContainer.innerHTML = 'A error occured! Please make sure your National ID is correct and you are registered' +
	                         ' to our service';
	loadingContainer.style.display = 'none';
	formContainer.style.display = 'block';
	errorContainer.style.display = 'block';

	authSuccessContainer.style.display ='none';
	authCancelContainer.style.display ='none';
}


WS.onmessage = function(msg){
	var parsedMsg = JSON.parse(msg.data);
		console.log( parsedMsg);
	switch (parsedMsg.status){
		case 'pending-user-authentication':
			transaction_id = parsedMsg.transaction_id;
			return instructUserToOpenTheAppAndAuthentication();
			break;

		case 'success':
			return handleAuthResponse('success',parsedMsg);
			break;

		case 'fail':
			return handleAuthResponse('fail',parsedMsg);
			break;

		case 'error':
			return errorOccured(parsedMsg.errorMessage);
		    break;
	}
}
WS.onerror = function(){
	errorOccured(parsedMsg.errorMessage);
	cancel_request();
}

window.onload = function(){
	document.getElementById('taqcet-input-modal').focus();
}




