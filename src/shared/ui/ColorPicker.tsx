"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	const [text, setText] = React.useState(value);

	React.useEffect(() => {
		setText(value);
	}, [value]);

	function commitText(next: string) {
		const trimmed = next.trim();
		const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
		if (HEX_RE.test(normalized)) {
			onChange(normalized.toLowerCase());
		} else {
			setText(value);
		}
	}

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
				<span
					className="block size-full"
					style={{ backgroundColor: HEX_RE.test(value) ? value : "#000000" }}
					aria-hidden
				/>
				<input
					type="color"
					value={HEX_RE.test(value) ? value : "#000000"}
					onChange={(e) => onChange(e.target.value)}
					className="absolute inset-0 size-full cursor-pointer opacity-0"
					aria-label="Pick a color"
				/>
			</label>
			<Input
				value={text}
				onChange={(e) => setText(e.target.value)}
				onBlur={() => commitText(text)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						commitText(text);
					}
				}}
				placeholder="#0ea5e9"
				aria-label="Hex color code"
				className="h-9 w-28 font-mono uppercase"
			/>
		</div>
	);
}
