export type Widget = "compound" | "position" | "volatility" | "chart" | "order" | "diversify";
export interface Lesson {
  id: string;
  title: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  xp: number;
  body: string[];
  widget: Widget;
  quiz: { q: string; options: string[]; answer: number }[];
}

export const LESSONS: Lesson[] = [
  { id: "basics", title: "Investing basics", level: "BEGINNER", xp: 50, widget: "compound",
    body: ["Investing means buying assets you expect to grow in value or produce income over time.", "Time is your biggest ally: returns compound, meaning gains start earning their own gains."],
    quiz: [{ q: "What makes compounding powerful?", options: ["High fees", "Gains earning further gains over time", "Trading every day"], answer: 1 }, { q: "Investing guarantees profit.", options: ["True", "False"], answer: 1 }] },
  { id: "stocks", title: "Stocks", level: "BEGINNER", xp: 50, widget: "chart",
    body: ["A stock is a small ownership share of a company.", "Prices move as investors re-evaluate the company's future profits, plus overall market mood."],
    quiz: [{ q: "Owning a share of AAPL means…", options: ["You lent Apple money", "You own a slice of Apple", "You work at Apple"], answer: 1 }] },
  { id: "etfs", title: "ETFs", level: "BEGINNER", xp: 50, widget: "diversify",
    body: ["An ETF is a basket of assets that trades like a single stock.", "Funds like SPY or VOO track the S&P 500 — instant diversification across 500 companies."],
    quiz: [{ q: "Main benefit of a broad index ETF?", options: ["Diversification", "Guaranteed returns", "No price movement"], answer: 0 }] },
  { id: "crypto", title: "Crypto", level: "BEGINNER", xp: 50, widget: "volatility",
    body: ["Cryptocurrencies are digital assets secured by cryptography and recorded on blockchains.", "They trade 24/7 and are typically far more volatile than stocks."],
    quiz: [{ q: "Compared to large stocks, crypto is usually…", options: ["Less volatile", "More volatile", "Identical"], answer: 1 }] },
  { id: "orders", title: "Market & limit orders", level: "BEGINNER", xp: 50, widget: "order",
    body: ["A market order fills immediately at the current price.", "A limit order only fills at your chosen price or better — you control price, not timing."],
    quiz: [{ q: "Which order guarantees your price?", options: ["Market", "Limit"], answer: 1 }] },
  { id: "technical", title: "Technical analysis", level: "INTERMEDIATE", xp: 75, widget: "chart",
    body: ["Technical analysis studies price and volume patterns to estimate probabilities, not certainties.", "Moving averages smooth noise so trends are easier to see."],
    quiz: [{ q: "A moving average helps…", options: ["Predict the future exactly", "Smooth price noise", "Avoid fees"], answer: 1 }] },
  { id: "candles", title: "Candlestick charts", level: "INTERMEDIATE", xp: 75, widget: "chart",
    body: ["Each candle shows open, high, low and close for a period.", "Green candles closed higher than they opened; red candles closed lower."],
    quiz: [{ q: "A red candle means…", options: ["Close < Open", "Close > Open"], answer: 0 }] },
  { id: "support", title: "Support & resistance", level: "INTERMEDIATE", xp: 75, widget: "chart",
    body: ["Support is a price zone where buying has historically stepped in; resistance is where selling has.", "These levels are zones, not exact lines, and they break regularly."],
    quiz: [{ q: "Support levels are…", options: ["Guaranteed floors", "Zones where buyers have appeared before"], answer: 1 }] },
  { id: "sizing", title: "Position sizing", level: "INTERMEDIATE", xp: 75, widget: "position",
    body: ["Position sizing decides how much to put into one trade.", "A common rule: risk only 1–2% of your account on any single idea."],
    quiz: [{ q: "With $10,000 and a 1% risk rule, max loss per trade is…", options: ["$10", "$100", "$1,000"], answer: 1 }] },
  { id: "rr", title: "Risk / reward", level: "INTERMEDIATE", xp: 75, widget: "position",
    body: ["Risk/reward compares potential loss (to your stop) with potential gain (to your target).", "A 1:2 ratio means you aim to make $2 for every $1 risked."],
    quiz: [{ q: "Entry $100, stop $95, target $110. R/R is…", options: ["1:1", "1:2", "2:1"], answer: 1 }] },
  { id: "strategies", title: "Trading strategies", level: "ADVANCED", xp: 100, widget: "compound",
    body: ["Strategies include trend following, mean reversion, and dollar-cost averaging.", "No strategy wins all the time — consistency and risk control matter more than any single trade."],
    quiz: [{ q: "Dollar-cost averaging means…", options: ["Investing a fixed amount on a schedule", "Buying only at lows"], answer: 0 }] },
  { id: "construction", title: "Portfolio construction", level: "ADVANCED", xp: 100, widget: "diversify",
    body: ["Combine assets with different risk profiles so one bad outcome doesn't sink everything.", "Rebalancing brings allocations back to target over time."],
    quiz: [{ q: "Rebalancing does what?", options: ["Restores target allocation", "Maximizes leverage"], answer: 0 }] },
  { id: "psychology", title: "Market psychology", level: "ADVANCED", xp: 100, widget: "volatility",
    body: ["Fear and greed drive many short-term moves.", "FOMO buying after a huge run and panic selling after a drop are common, costly behaviors."],
    quiz: [{ q: "FOMO usually leads to…", options: ["Buying after big run-ups", "Careful planning"], answer: 0 }] },
  { id: "volatility", title: "Volatility", level: "ADVANCED", xp: 100, widget: "volatility",
    body: ["Volatility measures how widely price swings.", "High volatility means bigger potential gains AND bigger potential losses."],
    quiz: [{ q: "High volatility means…", options: ["Only upside", "Larger swings both ways"], answer: 1 }] },
  { id: "advanced-charts", title: "Advanced chart analysis", level: "ADVANCED", xp: 100, widget: "chart",
    body: ["Combine trend, volume and key levels to build a thesis — then define where you're wrong.", "Indicators confirm; they don't predict."],
    quiz: [{ q: "Before entering, you should define…", options: ["Where your idea is wrong", "Nothing"], answer: 0 }] },
];

export const TUTORIAL = [
  { n: 1, title: "What Is Investing?", lesson: "basics" },
  { n: 2, title: "Stocks", lesson: "stocks" },
  { n: 3, title: "Crypto", lesson: "crypto" },
  { n: 4, title: "Reading Charts", lesson: "candles" },
  { n: 5, title: "Buying & Selling", lesson: "orders" },
  { n: 6, title: "Risk Management", lesson: "sizing" },
  { n: 7, title: "Day Trading", lesson: "rr" },
  { n: 8, title: "Portfolio Management", lesson: "construction" },
  { n: 9, title: "Technical Indicators", lesson: "technical" },
  { n: 10, title: "Building a Strategy", lesson: "strategies" },
];

export const LEADERS = [
  ["quantfox", 18.42, 1.9, 14], ["stealthbull", 15.71, 1.6, 11], ["mira_trades", 13.04, 2.1, 17], ["deltaone", 11.3, 1.2, 9],
  ["lowvolkid", 9.88, 2.4, 13], ["thetaqueen", 8.12, 1.4, 8], ["cashflowcal", 6.55, 1.7, 12], ["indexandchill", 5.2, 2.6, 15],
  ["breakoutbo", 3.91, 0.8, 6], ["rangerider", 2.4, 1.1, 7],
] as const;
