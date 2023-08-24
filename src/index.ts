import templateHtml from "./template.html";
import "./style.css"

class InfieldElement extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "closed" });
		shadow.appendChild(
			InfieldElement.template.content.cloneNode(true)
		);
	}

	static template: HTMLTemplateElement = (() => {
		const template = document.createElement('template');
		template.innerHTML = templateHtml;
		return template;
	})();
}
customElements.define('in-field', InfieldElement);
