// Deterministic arithmetic expression evaluator for smart paste. Supports
// + - * / ( ), unary minus, and decimals. Currency symbols and thousands
// separators are stripped before tokenizing so "1,000", "$50", and "৳100"
// all parse cleanly.

const STRIP = /[,$€£৳\s\u00A0]/g;

function roundToCents(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

type Token =
	| { kind: "number"; value: number }
	| { kind: "plus" }
	| { kind: "minus" }
	| { kind: "star" }
	| { kind: "slash" }
	| { kind: "lparen" }
	| { kind: "rparen" }
	| { kind: "end" };

function isDigit(ch: string): boolean {
	return ch >= "0" && ch <= "9";
}

function tokenize(expr: string): Token[] {
	const clean = expr.replace(STRIP, "");
	const tokens: Token[] = [];
	let i = 0;
	while (i < clean.length) {
		const ch = clean[i];
		if (isDigit(ch) || ch === ".") {
			let j = i;
			let seenDot = false;
			while (j < clean.length) {
				const c = clean[j];
				if (isDigit(c)) {
					j++;
					continue;
				}
				if (c === "." && !seenDot) {
					seenDot = true;
					j++;
					continue;
				}
				break;
			}
			const raw = clean.slice(i, j);
			const value = Number.parseFloat(raw);
			if (Number.isNaN(value)) throw new Error("Invalid number");
			tokens.push({ kind: "number", value });
			i = j;
			continue;
		}
		switch (ch) {
			case "+":
				tokens.push({ kind: "plus" });
				break;
			case "-":
				tokens.push({ kind: "minus" });
				break;
			case "*":
				tokens.push({ kind: "star" });
				break;
			case "/":
				tokens.push({ kind: "slash" });
				break;
			case "(":
				tokens.push({ kind: "lparen" });
				break;
			case ")":
				tokens.push({ kind: "rparen" });
				break;
			default:
				throw new Error(`Unexpected character: ${ch}`);
		}
		i++;
	}
	tokens.push({ kind: "end" });
	return tokens;
}

class Parser {
	private readonly tokens: Token[];
	private pos = 0;

	constructor(expr: string) {
		this.tokens = tokenize(expr);
	}

	private peek(): Token {
		return this.tokens[this.pos];
	}

	private consume(): Token {
		return this.tokens[this.pos++];
	}

	parse(): number {
		const value = this.parseExpression();
		const next = this.consume();
		if (next.kind !== "end") throw new Error("Unexpected trailing input");
		return value;
	}

	private parseExpression(): number {
		let value = this.parseTerm();
		for (;;) {
			const tok = this.peek();
			if (tok.kind === "plus") {
				this.consume();
				value += this.parseTerm();
			} else if (tok.kind === "minus") {
				this.consume();
				value -= this.parseTerm();
			} else {
				break;
			}
		}
		return value;
	}

	private parseTerm(): number {
		let value = this.parseUnary();
		for (;;) {
			const tok = this.peek();
			if (tok.kind === "star") {
				this.consume();
				value *= this.parseUnary();
			} else if (tok.kind === "slash") {
				this.consume();
				const divisor = this.parseUnary();
				if (divisor === 0) throw new Error("Division by zero");
				value /= divisor;
			} else {
				break;
			}
		}
		return value;
	}

	private parseUnary(): number {
		const tok = this.peek();
		if (tok.kind === "minus") {
			this.consume();
			return -this.parseUnary();
		}
		return this.parsePrimary();
	}

	private parsePrimary(): number {
		const tok = this.consume();
		if (tok.kind === "number") return tok.value;
		if (tok.kind === "lparen") {
			const value = this.parseExpression();
			const close = this.consume();
			if (close.kind !== "rparen") throw new Error("Expected ')'");
			return value;
		}
		throw new Error("Expected a number or '('");
	}
}

// Evaluate an arithmetic expression, rounded to two decimal places (the
// app-wide money convention). Throws on malformed input or division by zero.
export function evaluateExpression(expr: string): number {
	return roundToCents(new Parser(expr).parse());
}
