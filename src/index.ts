import templateHtml from "./template.html";
import "./style.css";

/** {@link InfieldElement} HTML attributes. */
enum Attr {
	LabelPosition = 'labelpos',
	Float = 'float',
}
/** All {@link Attr} values. */
const attrs = Object.freeze(Object.values(Attr));

/** Values for the `labelpos` {@link Attr}. */
const enum LabelPosition {
	/** Places the label at the border of the body (the border under the label is not rendered, so the border and label will not overlap). */
	Border = 0,
	/** Places the label inside the body. */
	Inside = 1,
	/** Places the label outside the body. */
	Outside = 2,
	/** Places the label on top of the border of the body (the entire border is rendered, so the border and the label will overlap). */
	OnBorder = 3,
}
/** An array of the names of {@link LabelPosition} values, and ordered such that it can be indexed
* with a {@link LabelPosition} value. */
const labelPositionNames = Object.freeze(["border", "inside", "outside", "onborder"]);
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

const enum CssProp {
	/** Set to 1 if `labelpos` ({@link LabelPosition}) is `border`, otherwise 0. */
	Border = '--border',
	/** Set to 1 if `labelpos` ({@link LabelPosition}) is `inside`, otherwise 0. */
	Inside = '--inside',
	/** Set to 1 if `labelpos` ({@link LabelPosition}) is `outside`, otherwise 0. */
	Outside = '--outside',
	/** Set to 1 if `labelpos` ({@link LabelPosition}) is `onborder`, otherwise 0. */
	OnBorder = '--onborder',
	/** The distance between the body (usually <input>) and the label slot. */
	BodyGap = '--body-gap',
	/** The minimum top padding the body (usually <input>) should have to not collide with the label. */
	BodyPad = '--body-pad',
}

/** The infield custom element. */
class InfieldElement extends HTMLElement {
	static tag = 'in-field';
	private shadow: ShadowRoot;

	private static setLabelPositionProperties = (labelPosition: LabelPosition, target: HTMLElement) => {
		const t = '1';
		const f = '0';
		const [border, inside, outside, onborder] = ([[t,f,f,f],[f,t,f,f],[f,f,t,f],[f,f,f,t]] as const)[labelPosition]!;
		target.style.setProperty(CssProp.Border, border);
		target.style.setProperty(CssProp.Inside, inside);
		target.style.setProperty(CssProp.Outside, outside);
		target.style.setProperty(CssProp.OnBorder, onborder);
	}

	private static updatePartBorder = (labelPosition: LabelPosition, fieldset: Element, body: Element) => {
		const fieldsetBorder = () => {
			fieldset.part.add('border');
			body.part.remove('border');
		};
		const bodyBorder = () => {
			fieldset.part.remove('border');
			body.part.add('border');
		};
		[fieldsetBorder,fieldsetBorder,bodyBorder,bodyBorder][labelPosition]!();
	}

	refreshLayout = () => {
		const labelPosition = labelPositionParse(this.getAttribute(Attr.LabelPosition)) ?? labelPositionDefault;
		const fieldset = this.shadow.children[0]! as HTMLElement;
		let [legend, body] = fieldset.children as unknown as [HTMLElement, HTMLElement];

		legend.className = labelPositionNames[labelPosition]!;
		InfieldElement.setLabelPositionProperties(labelPosition, fieldset);
		InfieldElement.updatePartBorder(labelPosition, fieldset, body);
		legend = elementEnsureTag(['LEGEND','DIV','DIV','DIV'][labelPosition]!, legend);

		[
			// Border
			() => {
				const gapPx = (() => {
					const legendRect = legend.getBoundingClientRect();
					const bodyRect = body.getBoundingClientRect();
					const legendMid = legendRect.top + legendRect.height / 2;
					const existingGap = parseFloat(window.getComputedStyle(body).marginBlockStart ?? 0)
					const gap = bodyRect.top - legendMid - existingGap;
					return `${gap}px`;
				})();
				fieldset.style.setProperty(CssProp.BodyGap, gapPx);
				fieldset.style.setProperty(CssProp.BodyPad, gapPx);
			},
			// Inside
			() => {
				const legendStyle = window.getComputedStyle(legend);
				const gapPx = `${legend.getBoundingClientRect().height + parseFloat(legendStyle.marginBlockStart) + parseFloat(legendStyle.borderBlockStart)}px`;
				fieldset.style.setProperty(CssProp.BodyGap, gapPx);
				fieldset.style.setProperty(CssProp.BodyPad, gapPx);
			},
			// Outside
			() => {
				const gapPx = '0px';
				fieldset.style.setProperty(CssProp.BodyGap, gapPx);
				fieldset.style.setProperty(CssProp.BodyPad, gapPx);
			},
			// On Border
			() => {
				const legendStyle = window.getComputedStyle(legend);
				const clientHeight = legend.getBoundingClientRect().height;
				const bottomMarginTotal = parseFloat(legendStyle.marginBlockEnd) + parseFloat(legendStyle.borderBlockEnd);
				const clientHeightHalf = clientHeight / 2;
				fieldset.style.setProperty(CssProp.BodyGap, `${bottomMarginTotal + clientHeightHalf}px`);
				fieldset.style.setProperty(CssProp.BodyPad, `${clientHeight / 2}px`);
			},
		][labelPosition]!();
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
