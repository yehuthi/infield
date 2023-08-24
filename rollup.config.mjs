import typescript from "@rollup/plugin-typescript";
import { minify as htmlMinify } from "html-minifier-terser";
import terser from "@rollup/plugin-terser";
import css from "rollup-plugin-import-css";
import fs from "node:fs"
import path from "node:path";
import process from "node:process";

function html() {
	const isHtmlImport = source => source.endsWith('.html');
	return {
		name: 'html-loader',
		resolveId(source, importer) {
			if (!isHtmlImport(source)) return null;
			const base = importer ? path.dirname(importer) : path.join(process.cwd(), 'src');
			return path.join(base, source);
		},
		async load(id) {
			if (!isHtmlImport(id)) return null;
			let data = fs.readFileSync(id).toString();
			data = await htmlMinify(data, {
				collapseInlineTagWhitespace: true,
				collapseWhitespace: true,
				noNewlinesBeforeTagClose: true,
				removeAttributeQuotes: true,
				removeComments: true,
				removeEmptyAttributes: true,
				minifyCSS: true,
				minifyJS: true,
			});
			data = data.replaceAll('`', '\\`');
			return `export default \`${data}\``;
		},
	}
}

export default [
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/index.js',
			format: 'cjs',
			sourcemap: true,
		},
		plugins: [
			css({
				minify: true,
				include: "**/*.css",
				output: "infield.css",
			}),
			html(),
			typescript(),
			terser(),
		]
	}
];
