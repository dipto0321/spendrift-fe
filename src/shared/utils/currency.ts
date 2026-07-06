/** ISO 4217 code → display symbol. Lookup is case-insensitive via getCurrencySymbol(). */
export const CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
	// ── Major global ──────────────────────────────────────────────────────────
	USD: "$",      // US Dollar
	EUR: "€",      // Euro
	GBP: "£",      // British Pound
	JPY: "¥",      // Japanese Yen
	CNY: "¥",      // Chinese Yuan (Renminbi)
	CHF: "Fr",     // Swiss Franc
	CAD: "CA$",    // Canadian Dollar
	AUD: "A$",     // Australian Dollar
	NZD: "NZ$",    // New Zealand Dollar
	HKD: "HK$",    // Hong Kong Dollar
	SGD: "S$",     // Singapore Dollar

	// ── South & Southeast Asia ────────────────────────────────────────────────
	BDT: "৳",      // Bangladeshi Taka
	INR: "₹",      // Indian Rupee
	PKR: "₨",      // Pakistani Rupee
	LKR: "₨",      // Sri Lankan Rupee
	NPR: "₨",      // Nepalese Rupee
	MMK: "K",      // Myanmar Kyat
	THB: "฿",      // Thai Baht
	VND: "₫",      // Vietnamese Dong
	IDR: "Rp",     // Indonesian Rupiah
	PHP: "₱",      // Philippine Peso
	MYR: "RM",     // Malaysian Ringgit
	KHR: "៛",      // Cambodian Riel
	LAK: "₭",      // Lao Kip
	BND: "B$",     // Brunei Dollar

	// ── Middle East & Central Asia ────────────────────────────────────────────
	AED: "د.إ",    // UAE Dirham
	SAR: "﷼",      // Saudi Riyal
	QAR: "﷼",      // Qatari Riyal
	KWD: "د.ك",    // Kuwaiti Dinar
	BHD: "BD",     // Bahraini Dinar
	OMR: "﷼",      // Omani Rial
	ILS: "₪",      // Israeli Shekel
	JOD: "JD",     // Jordanian Dinar
	IRR: "﷼",      // Iranian Rial
	TRY: "₺",      // Turkish Lira
	KZT: "₸",      // Kazakhstani Tenge
	UZS: "сум",    // Uzbekistani Som
	AZN: "₼",      // Azerbaijani Manat
	GEL: "₾",      // Georgian Lari
	AMD: "֏",      // Armenian Dram

	// ── Europe (non-EUR) ──────────────────────────────────────────────────────
	SEK: "kr",     // Swedish Krona
	NOK: "kr",     // Norwegian Krone
	DKK: "kr",     // Danish Krone
	ISK: "kr",     // Icelandic Króna
	PLN: "zł",     // Polish Zloty
	CZK: "Kč",     // Czech Koruna
	HUF: "Ft",     // Hungarian Forint
	RON: "lei",    // Romanian Leu
	BGN: "лв",     // Bulgarian Lev
	RSD: "din",    // Serbian Dinar
	UAH: "₴",      // Ukrainian Hryvnia
	RUB: "₽",      // Russian Ruble
	HRK: "kn",     // Croatian Kuna
	ALL: "L",      // Albanian Lek
	MKD: "ден",    // Macedonian Denar
	BAM: "KM",     // Bosnia-Herzegovina Convertible Mark
	MDL: "L",      // Moldovan Leu
	BYN: "Br",     // Belarusian Ruble

	// ── Americas ─────────────────────────────────────────────────────────────
	MXN: "MX$",    // Mexican Peso
	BRL: "R$",     // Brazilian Real
	ARS: "$",      // Argentine Peso
	CLP: "$",      // Chilean Peso
	COP: "$",      // Colombian Peso
	PEN: "S/",     // Peruvian Sol
	UYU: "$U",     // Uruguayan Peso
	BOB: "Bs",     // Bolivian Boliviano
	PYG: "₲",      // Paraguayan Guaraní
	VES: "Bs.S",   // Venezuelan Bolívar Soberano
	GTQ: "Q",      // Guatemalan Quetzal
	CRC: "₡",      // Costa Rican Colón
	DOP: "RD$",    // Dominican Peso
	TTD: "TT$",    // Trinidad & Tobago Dollar
	JMD: "J$",     // Jamaican Dollar
	BBD: "Bds$",   // Barbadian Dollar
	BSD: "B$",     // Bahamian Dollar
	PAB: "B/.",    // Panamanian Balboa

	// ── Africa ────────────────────────────────────────────────────────────────
	ZAR: "R",      // South African Rand
	NGN: "₦",      // Nigerian Naira
	GHS: "₵",      // Ghanaian Cedi
	KES: "KSh",    // Kenyan Shilling
	TZS: "TSh",    // Tanzanian Shilling
	UGX: "USh",    // Ugandan Shilling
	ETB: "Br",     // Ethiopian Birr
	EGP: "E£",     // Egyptian Pound
	MAD: "MAD",    // Moroccan Dirham
	TND: "DT",     // Tunisian Dinar
	DZD: "DA",     // Algerian Dinar
	XOF: "CFA",    // West African CFA Franc
	XAF: "FCFA",   // Central African CFA Franc
	MUR: "₨",      // Mauritian Rupee
	SCR: "₨",      // Seychellois Rupee
	ZMW: "ZK",     // Zambian Kwacha
	MWK: "MK",     // Malawian Kwacha
	BIF: "Fr",     // Burundian Franc
	RWF: "Fr",     // Rwandan Franc
	AOA: "Kz",     // Angolan Kwanza

	// ── East Asia & Pacific ───────────────────────────────────────────────────
	KRW: "₩",      // South Korean Won
	TWD: "NT$",    // Taiwan Dollar
	MNT: "₮",      // Mongolian Tögrög
	KPW: "₩",      // North Korean Won
	FJD: "FJ$",    // Fijian Dollar
	PGK: "K",      // Papua New Guinean Kina
	SBD: "SI$",    // Solomon Islands Dollar
	VUV: "Vt",     // Vanuatu Vatu
	WST: "WS$",    // Samoan Tālā
	TOP: "T$",     // Tongan Paʻanga
};

/**
 * Number of decimal places used by currencies that deviate from the standard 2.
 * Everything not listed here defaults to 2.
 */
const CURRENCY_DECIMALS: Readonly<Record<string, number>> = {
	// Zero decimal places
	JPY: 0, KRW: 0, VND: 0, IDR: 0, HUF: 0, UGX: 0, KHR: 0, MMK: 0,
	PYG: 0, RWF: 0, BIF: 0, XOF: 0, XAF: 0, DJF: 0, KMF: 0, MGA: 0,
	ISK: 0, GNF: 0, SLL: 0, VUV: 0,
	// Three decimal places
	KWD: 3, BHD: 3, OMR: 3, JOD: 3, TND: 3,
};

/** Returns the display symbol for an ISO 4217 currency code (case-insensitive). Falls back to the code itself. */
export function getCurrencySymbol(code: string): string {
	return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code.toUpperCase();
}

/** Returns the number of fractional digits for a currency (case-insensitive). */
export function getCurrencyDecimals(code: string): number {
	return CURRENCY_DECIMALS[code.toUpperCase()] ?? 2;
}
