import templateHtml from "./template.html";
import "./style.css";

/** {@link InfieldElement} HTML attributes. */
enum Attr {
	LabelPosition = 'labelpos',
}
/** All {@link Attr} values. */
const attrs = Object.freeze(Object.values(Attr));

/** Values for the `labelpos` {@link Attr}. */
const enum LabelPosition {
	Border  = 0,
	Inside  = 1,
	Outside = 2,
}
/** An array of the names of {@link LabelPosition} values, and ordered such that it can be indexed
* with a {@link LabelPosition} value. */
const labelPositionNames = Object.freeze(["border", "inside", "outside"]);
/** Checks if the given value is a {@link LabelPosition}. */
const labelPositionParse = (a: any): LabelPosition | null => {
	const i = labelPositionNames.indexOf(a);
	return i !== -1 ? i : null;
}
/** The default / fallback {@link LabelPosition} value. */
const labelPositionDefault = LabelPosition.Border;

/** Replicates an element under a different tag. Doesn't replace in it the DOM but DOES take its children. */
const elementReplicateWithTag = <T extends Element>(tag: string, element: T): HTMLElement => {
	const result = document.createElement(tag);
	for (const attr of element.attributes)
		result.setAttribute(attr.name, attr.value);
	for (const child of element.children)
		result.appendChild(child);
	return result;
}

/** Ensures the given element is of the given tag. If it does not, the element with be replicated ({@link elementReplicateWithTag) and replaced. */
const elementEnsureTag = <T extends HTMLElement>(tag: string, element: T): HTMLElement => {
	if (element.tagName === tag) return element;
	const replicated = elementReplicateWithTag(tag, element);
	element.replaceWith(replicated);
	return replicated;
}

/** The infield custom element. */
class InfieldElement extends HTMLElement {
	static tag = 'in-field';
	private shadow: ShadowRoot;

	refreshLayout = () => {
		const labelPosition = labelPositionParse(this.getAttribute(Attr.LabelPosition)) ?? labelPositionDefault;

		const fieldset = this.shadow.children[0]! as HTMLElement;
		let [legend, body] = fieldset.children as unknown as [HTMLElement, HTMLElement];

		legend.className = labelPositionNames[labelPosition]!;

		switch (labelPosition) {
			case LabelPosition.Border: {
				fieldset.part.add('border');
				body.part.remove('border');
				legend = elementEnsureTag('LEGEND', legend);
				const gap = (() => {
					const legendRect = legend.getBoundingClientRect();
					const bodyRect = body.getBoundingClientRect();
					const legendMid = legendRect.top + legendRect.height / 2;
					const existingGap = parseFloat(window.getComputedStyle(body).marginBlockStart ?? 0)
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
				legend = elementEnsureTag('DIV', legend);
				const legendStyle = window.getComputedStyle(legend);
				const gap = legend.getBoundingClientRect().height + parseFloat(legendStyle.marginBlockStart) + parseFloat(legendStyle.borderBlockStart);
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
				legend = elementEnsureTag('DIV', legend);
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

	private static template: HTMLTemplateElement = (() => {
		const template = document.createElement('template');
		template.innerHTML = templateHtml;
		return template;
	})();
}
customElements.define(InfieldElement.tag, InfieldElement);
