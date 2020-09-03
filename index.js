const searchUrls = ['search/url/1', 'search/url/2', 'search/url/3'];
const minResults = 2;

class AutocompleteInput {
	constructor(searchUrls, minResults, parent, label) {
		this.searchUrls = searchUrls;
		this.minResults = minResults;
		this.parent = parent;
		this.label = label;
		this.requestCounter = 0;
	}

	closeAllLists(elmnt) {
		const listItems = this.parent.getElementsByClassName('autosuggest-items');
		const input = document.getElementById('reason-for-request')
		for (let i = 0; i < listItems.length; i++) {
			if (elmnt != listItems[i] && elmnt != input) {
				listItems[i].parentNode.removeChild(listItems[i]);
			}
		}
	};

	async request(value) {
		if (this.searchUrls.length <= this.requestCounter) {
			return;
		}

		const data = await fetch(`${this.searchUrls[this.requestCounter]}?search=${value}`).then(res => res.json());
		this.requestCounter++;

		return data.result.length < this.minResults ? await this.request(value) : data.result;
	};

	throttle(fn, threshhold, scope) {
		threshhold || (threshhold = 250);
		var last,
			deferTimer;
		return function () {
			var context = scope || this;
	  
			var now = +new Date,
			args = arguments;
			if (last && now < last + threshhold) {
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshhold);
			} else {
				last = now;
				fn.apply(context, args);
			}
		};
	}

	changeInput(input) {
		const val = input.value;
		this.closeAllLists();
		if (!val) { return false; }

		const listItems = document.createElement('div');
		listItems.setAttribute('id', `${input.id}-autosuggest-list`);
		listItems.classList.add('autosuggest-items');
		input.parentNode.appendChild(listItems);

		this.request(val).then(data => {
			this.requestCounter = 0;
			if (!!data) {
				data.forEach((item) => {
					if (item.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
						const listItem = document.createElement('div');
						listItem.innerHTML = '<strong>' + item.substr(0, val.length) + '</strong>';
						listItem.innerHTML += item.substr(val.length);
						listItem.innerHTML += "<input type='hidden' value='" + item + "'>";
						listItem.addEventListener('click', e => {
							input.value = e.target.getElementsByTagName('input')[0].value
							this.closeAllLists();
						});
						listItems.appendChild(listItem);
					}
				})
			}
		});
	}

	render() {
		const form = document.createElement('form');
		form.setAttribute('autosuggest', 'off');
		this.parent.appendChild(form);

		const formLabel = document.createElement('div');
		formLabel.innerText = this.label;
		form.appendChild(formLabel);

		const inputBlock = document.createElement('div');
		inputBlock.classList.add('autosuggest');
		form.appendChild(inputBlock);

		const input = document.createElement('input')
		input.setAttribute('type', 'text');
		input.setAttribute('name', 'reason-for-request');
		input.setAttribute('id', 'reason-for-request');
		input.value = localStorage.getItem('reasonForRequestInputValue');
		inputBlock.appendChild(input);

		const throttledChangeInput = this.throttle(this.changeInput, 1000, this)
		input.addEventListener('input', e => throttledChangeInput(input));
		document.addEventListener('click', e => this.closeAllLists(e.target));

		return input;
	}
}

class TelephoneInput {
	constructor(parent, label) {
		this.parent = parent;
		this.label = label;
	}

	render() {
		const form = document.createElement('form');
		form.setAttribute('autosuggest', 'off');
		this.parent.appendChild(form);

		const formLabel = document.createElement('div');
		formLabel.innerText = this.label;
		form.appendChild(formLabel);

		const inputBlock = document.createElement('div');
		inputBlock.classList.add('telephone');
		form.appendChild(inputBlock);
		
		const input = document.createElement('input')
		input.setAttribute('type', 'text');
		input.setAttribute('name', 'tel');
		input.setAttribute('placeholder', 'Номер телефона');
		input.setAttribute('required', '');
		input.setAttribute('maxlength', '11');
		input.setAttribute('id', 'tel');
		input.value = localStorage.getItem('telephoneNumberInputValue');
		inputBlock.appendChild(input);

		input.addEventListener('focus', () => {
			if (!/^\+\d*$/.test(input.value)) input.value = '+';
		});

		input.addEventListener('keypress', e => {
			if (!/\d/.test(e.key)) e.preventDefault();
		});

		return input
	}
}

const searchInputLabel = 'Введите причину вашего обращания:';
const telephoneInputLabel = 'Введите номер вашего телефона:';
const parent = document.getElementsByClassName('content')[0];
const autocompleteInput = new AutocompleteInput(searchUrls, minResults, parent, searchInputLabel).render();
const telephoneInput = new TelephoneInput(parent, telephoneInputLabel).render();

const btnSave = document.getElementById('button-save');
const btnCancel = document.getElementById('button-cancel');

btnSave.addEventListener('click', () => {
	localStorage.setItem('reasonForRequestInputValue', autocompleteInput.value);
	localStorage.setItem('telephoneNumberInputValue', telephoneInput.value);
	const data = {
		'reasonForRequest': autocompleteInput.value,
		'telephoneNumber': telephoneInput.value
	};
	fetch('url/for/save/data', {method: 'POST', body: JSON.stringify(data)});
});

btnCancel.addEventListener('click', () => {
	autocompleteInput.value = '';
	telephoneInput.value = '';
	localStorage.setItem('reasonForRequestInputValue', '');
	localStorage.setItem('telephoneNumberInputValue', '');
});