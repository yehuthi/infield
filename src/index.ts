import templateHtml from "./template.html";
import "./style.css";

enum Attr {
	LabelPosition = 'labelpos',
}
const attrs = Object.freeze(Object.values(Attr));

enum LabelPosition {
	Inside = 'inside',
	Border = 'border',
	Outside = 'outside',
}
const labelPositions = Object.freeze(Object.values(LabelPosition));
const isLabelPosition =  (a: any): a is LabelPosition =>
	labelPositions.includes(a);

const elementReplicateWithTag = <T extends Element>(tag: string, element: T): HTMLElement => {
	const result = document.createElement(tag);
	for (const attr of element.attributes)
		result.setAttribute(attr.name, attr.value);
	for (const child of element.children)
		result.appendChild(child);
	return result;
}

const elementEnsureTag = <T extends HTMLElement>(tag: string, element: T): HTMLElement => {
	if (element.tagName === tag) return element;
	const replicated = elementReplicateWithTag(tag, element);
	element.replaceWith(replicated);
	return replicated;
}

class InfieldElement extends HTMLElement {
	shadow: ShadowRoot;

	refreshLayout = () => {
		const labelPosition = (() => {
			const value = this.getAttribute(Attr.LabelPosition);
			return isLabelPosition(value) ? value : LabelPosition.Border;
		})();

		const fieldset = this.shadow.children[0]! as HTMLElement;
		let [legend, body] = fieldset.children as unknown as [HTMLElement, HTMLElement];

		legend.className = labelPosition;

		switch (labelPosition) {
			case LabelPosition.Border: {
				fieldset.part.add('border');
				body.part.remove('border');
				legend = elementEnsureTag('LEGEND', legend);
				const gap = (() => {
					const legendRect = legend.getBoundingClientRect();
					const bodyRect = body.getBoundingClientRect();
					const legendMid = legendRect.top + legendRect.height / 2;
					const existingGap = parseInt(window.getComputedStyle(body).marginBlockStart ?? 0)
					return bodyRect.top - legendMid - existingGap;
				})();
				const gapPx = `${gap}px`;
				fieldset.style.setProperty('--body-gap', gapPx);
				fieldset.style.setProperty('--body-pad', gapPx);
				fieldset.style.setProperty('--border',	'1');
				fieldset.style.setProperty('--inside',	'0');
				fieldset.style.setProperty('--outside', '0');
			} break;

			case LabelPosition.Inside: {
				fieldset.part.add('border');
				body.part.remove('border');
				legend = elementEnsureTag('div', legend);
				const legendStyle = window.getComputedStyle(legend);
				const gap = legend.getBoundingClientRect().height + parseInt(legendStyle.marginBlockStart) + parseInt(legendStyle.borderBlockStart);
				const gapPx = `${gap}px`;
				fieldset.style.setProperty('--body-gap', gapPx);
				fieldset.style.setProperty('--body-pad', gapPx);
				fieldset.style.setProperty('--border',	'0');
				fieldset.style.setProperty('--inside',	'1');
				fieldset.style.setProperty('--outside', '0');
			} break;

			case LabelPosition.Outside: {
				fieldset.part.remove('border');
				body.part.add('border');
				legend = elementEnsureTag('div', legend);
				fieldset.style.setProperty('--body-gap', '0px');
				fieldset.style.setProperty('--body-pad', '0px');
				fieldset.style.setProperty('--border',	 '0');
				fieldset.style.setProperty('--inside',	 '0');
				fieldset.style.setProperty('--outside',  '1');
			} break;

			default: labelPosition satisfies never
		}
	};

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.appendChild(
			InfieldElement.template.content.cloneNode(true)
		);
		this.refreshLayout();
	}

	static get observedAttributes() { return attrs; }
	attributeChangedCallback(_name: string, _oldValue?: string, _newValue?: string) {
		this.refreshLayout();
	}

	static template: HTMLTemplateElement = (() => {
		const template = document.createElement('template');
		template.innerHTML = templateHtml;
		return template;
	})();
}
customElements.define('in-field', InfieldElement);
