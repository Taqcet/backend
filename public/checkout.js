var scripts = document.getElementsByClassName('taqcet-checkout');
var scriptName = scripts[scripts.length-1];
var formElement = scriptName.closest('form');

function getSyncScriptParams() {
	return {
		key : scriptName.getAttribute('data-key'),
		amount : scriptName.getAttribute('data-amount'),
		currency : scriptName.getAttribute('data-currency')
	};
}

window.document.addEventListener('paylater-click',openCheckoutModal);
window.document.addEventListener('payment-response',handlePaymentResponse);

function openCheckoutModal(){
	console.log('opening modal');

	var data=getSyncScriptParams();
	var params = '';

	Object.keys(data).forEach(function(s){
		params+= '&'+s+'='+data[s];
	});

	var link = "/html/modal.html?"+params;
	var iframe = document.createElement('iframe');
	iframe.frameBorder=0;
	iframe.width= document.body.clientWidth;
	iframe.height= document.body.clientHeight;
	iframe.style.position = 'fixed';
	iframe.style.top = 0;
	iframe.style.right = 0;
	iframe.style.left = 0;
	iframe.style.right = 0;
	iframe.style.zIndex = 10000;
	iframe.frameborder="1";
	iframe.id="taqcet-modal-iframe";
	iframe.setAttribute("src", link);
	formElement.appendChild(iframe);
	window.document.addEventListener('paylatermodal-close',function(){
		iframe.remove();
	});
}
function embedCheckoutButton(){
	var link = "/html/button.html"
	var iframe = document.createElement('iframe');
	iframe.frameBorder=0;
	iframe.width="300px";
	iframe.height="250px";
	iframe.frameborder="1";
	iframe.id="taqcet-button-iframe";
	iframe.setAttribute("src", link);
	formElement.appendChild(iframe);
}
function handlePaymentResponse(event){
	//WE send the increpted data to the server
	var method = formElement.getAttribute('method');
	method = method == null? 'POST':method;

	var action = formElement.getAttribute('action');
	action = action == null? '/':action;

	var form = document.createElement("form");
	document.body.appendChild(form);
	form.method = method;
	form.action = action;

	var element = document.createElement("INPUT");
	element.name="data"
	element.value = typeof event.detail == 'object'? JSON.stringify(event.detail):event.detail;
	element.type = 'hidden'
	form.appendChild(element);
	form.submit();
}

embedCheckoutButton();
