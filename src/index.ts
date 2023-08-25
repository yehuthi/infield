import templateHtml from "./template.html";
import "./style.css";

class InfieldElement extends HTMLElement {
	shadow: ShadowRoot;

	refreshLayout = () => {
		const fieldset = this.shadow.children[0]! as HTMLElement;
		const [legend, body] = fieldset.children as unknown as [HTMLElement, HTMLElement];
		const gap = (() => {
			const legendRect = legend.getBoundingClientRect();
			const bodyRect = body.getBoundingClientRect();
			const legendMid = legendRect.top + legendRect.height / 2;
			return bodyRect.top - legendMid;
		})();
		fieldset.style.setProperty('--body-gap', `${gap}px`);
		fieldset.style.setProperty('--body-pad', `${gap}px`);
	};

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.appendChild(
			InfieldElement.template.content.cloneNode(true)
		);
		this.refreshLayout();
	}

	static template: HTMLTemplateElement = (() => {
		const template = document.createElement('template');
		template.innerHTML = templateHtml;
		return template;
	})();
}
customElements.define('in-field', InfieldElement);
