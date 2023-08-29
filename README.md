# Infield

Provides an HTML custom element `<in-field>` for in-field labels.

## Getting Started

- Import the JavaScript library in the browser (to define the custom element).
- Import or [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#try_it) the CSS file (for essential light DOM CSS). 

## Usage

Example:

```html
<in-field labelpos="inside">
    <label slot="label" for="age">Age</label>
    <input id="age" type="number">
</in-field>
```

Note: attributes are case-sensitive.

### Label Position

Label position can be set with the `labelpos` attribute. It may be:
- `inside`: places the label inside the input.
- `border`: places the label in the border of the input (doesn't overlap with the input border).
- `outside`: places the label outside of the input.
- `onborder`: places the label on the border of the input (overlaps with the input border).

While the main point of this library is `inside`, providing alternatives is useful for when a label shouldn't be in-field because it helps to maintain a consistent style.
This is especially true with overflowing input elements such as [`<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) which can create overlapping with in-field labels, hence, the **default value for `labelpos`** is not `inside` (at the time of writing it's `border`).

### Styling

#### Parts
The following [parts](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) are defined:
- `border`: use to style the input border (not the input itself!)
- `label`: `label` slot container.
- `body`: default slot container.

#### Properties
`<in-field>` elements have CSS properties set that are accessible for their rules, the public ones are:
- `--body-pad` is the minimal top padding there must be in the body (usually `<input>`) so it will not overlap with the label.
- `--inside`, `--border`, `--outside`, `--on-border` each are set to `1` (without a unit) when the `labelpos` corresponds with their name (only one can be set at a time), otherwise `0`.

#### Examples

Set margin on the label but only for `inside` and `border` label positions:
```css
in-field::part(label) {
	margin-block-start: calc(1rem * max(var(--inside), var(--border)));
}
```

Uniform distance between labels and inputs (uniform between label positions):
```css
in-field > :nth-child(2) {
	padding: 1rem;
	padding-block-start: calc(var(--body-pad) + 1rem);
}
```
