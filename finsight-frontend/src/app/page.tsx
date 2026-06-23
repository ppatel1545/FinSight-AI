"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Brain,
  MessageSquare,
  ArrowRight,
  Coins,
  ShieldCheck,
  Sparkles,
  ArrowRightLeft,
  DollarSign,
  Info,
  Check,
  ChevronRight
} from "lucide-react";

export default function Home() {
  // --- Sandbox 1: Currency Conversion Matrix ---
  const EXCHANGE_RATES: { [key: string]: number } = {
    USD: 1.0,
    INR: 83.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.0,
    CAD: 1.37,
    AUD: 1.51,
    CHF: 0.90,
    CNY: 7.24,
    AED: 3.67
  };

  const [convAmount, setConvAmount] = useState<string>("100");
  const [fromCurr, setFromCurr] = useState<string>("USD");
  const [toCurr, setToCurr] = useState<string>("INR");
  const [convResult, setConvResult] = useState<string>("8300.00");

  useEffect(() => {
    const amt = parseFloat(convAmount);
    if (isNaN(amt) || amt <= 0) {
      setConvResult("0.00");
      return;
    }
    // Amount in USD = amt / fromRate
    const fromRate = EXCHANGE_RATES[fromCurr] || 1.0;
    const toRate = EXCHANGE_RATES[toCurr] || 1.0;
    const amountInUsd = amt / fromRate;
    const result = amountInUsd * toRate;
    setConvResult(result.toFixed(2));
  }, [convAmount, fromCurr, toCurr]);

  // --- Sandbox 2: Budget Warnings Slider ---
  const [budgetLimit, setBudgetLimit] = useState<number>(500);
  const [budgetSpent, setBudgetSpent] = useState<number>(350);
  const [budgetPercentage, setBudgetPercentage] = useState<number>(70);
  const [thresholdStatus, setThresholdStatus] = useState<string>("GREEN");

  useEffect(() => {
    if (budgetLimit <= 0) {
      setBudgetPercentage(budgetSpent > 0 ? 100 : 0);
      setThresholdStatus(budgetSpent > 0 ? "RED" : "GREEN");
      return;
    }
    const pct = Math.round((budgetSpent / budgetLimit) * 100);
    setBudgetPercentage(pct);

    if (budgetSpent > budgetLimit) {
      setThresholdStatus("RED");
    } else if (budgetSpent >= budgetLimit * 0.8) {
      setThresholdStatus("AMBER");
    } else {
      setThresholdStatus("GREEN");
    }
  }, [budgetLimit, budgetSpent]);

  // --- Sandbox 3: AI Quick-Fill Auto-Categorization ---
  const PARSE_PRESETS = [
    { text: "Swiggy order 350 INR", category: "Food", amount: 350, currency: "INR", type: "EXPENSE", desc: "Swiggy order" },
    { text: "Salary credit 5000 USD", category: "Salary", amount: 5000, currency: "USD", type: "INCOME", desc: "Salary credit" },
    { text: "Rent payment 800 EUR", category: "Rent", amount: 800, currency: "EUR", type: "EXPENSE", desc: "Rent payment" }
  ];

  const [inputText, setInputText] = useState("");
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const triggerTyping = (index: number) => {
    setParsedData(null);
    setInputText("");
    setTypingIndex(index);
    const text = PARSE_PRESETS[index].text;
    let currentText = "";
    let charIndex = 0;

    const interval = setInterval(() => {
      if (charIndex < text.length) {
        currentText += text.charAt(charIndex);
        setInputText(currentText);
        charIndex++;
      } else {
        clearInterval(interval);
        // Compute US dollar value fallback
        const rate = EXCHANGE_RATES[PARSE_PRESETS[index].currency] || 1.0;
        const usdValue = PARSE_PRESETS[index].amount / rate;
        setParsedData({
          ...PARSE_PRESETS[index],
          usdNormalized: usdValue.toFixed(2)
        });
        setTypingIndex(null);
      }
    }, 40);
  };

  // --- Sandbox 4: AI Conversation Financial Assistant ---
  const CHAT_QUESTIONS = [
    {
      q: "What is my remaining budget for Food?",
      a: "Based on your active budgets, your **Food** budget limit is **$500.00 USD** and you have spent **$410.00 USD** (82% used). You have **$90.00 USD** remaining, which puts you in the **AMBER** warning threshold. Try to minimize restaurant spending for the next 7 days!"
    },
    {
      q: "How are my savings doing this month?",
      a: "Looking at your ledger: Total Income is **$5,000.00 USD** and Total Expenses are **$2,350.00 USD**. Your Net Savings are **$2,650.00 USD** (a solid **53%** savings rate). You are on track to meet your savings goals!"
    },
    {
      q: "Give me an optimization recommendation.",
      a: "Certainly! You have logged 3 separate Streaming subscriptions this month totaling **$45.00 USD**. Consolidating or pausing one inactive sub could increase your savings. Also, your food expense is nearing its cap; consider grocery cooking to save an estimated **$50.00 USD** this week."
    }
  ];

  const [chatMessages, setChatMessages] = useState<Array<{ role: string; message: string }>>([
    { role: "assistant", message: "Hello! I am your FinSight AI financial assistant. Ask me questions about your monthly budget or ledger balance sheets!" }
  ]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  const askAssistant = (index: number) => {
    if (isAssistantTyping) return;
    const question = CHAT_QUESTIONS[index].q;
    const answer = CHAT_QUESTIONS[index].a;

    // Append user message
    setChatMessages((prev) => [...prev, { role: "user", message: question }]);
    setIsAssistantTyping(true);

    setTimeout(() => {
      setIsAssistantTyping(false);
      setChatMessages((prev) => [...prev, { role: "assistant", message: answer }]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              FinSight <span className="text-emerald-400 font-medium">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sandbox" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-950">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02]">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Empowered by Gemini 2.5 Flash
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Personal Finance, <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Supercharged by Intelligence
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Log expenses naturally, track limits with dynamic alert warnings, convert currencies in real-time, and get smart AI advice tailored to your balance sheet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02]">
              Start Managing Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#sandbox" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-8 py-4 rounded-xl transition-all">
              Try Interactive Sandbox
            </a>
          </div>
        </div>
      </section>

      {/* Main Interactive Sandbox Section */}
      <section id="sandbox" className="py-16 bg-slate-950 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Interactive Dashboard Sandbox
            </h2>
            <p className="text-slate-400 mt-3">
              Play with our core features live. Adjust values below to experience the financial math and AI workflows run by our system.
            </p>
          </div>

          {/* Playground Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Sandbox 1: Budget Alert Warning System */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[440px] shadow-xl hover:border-slate-800 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Smart Budget Warnings</h3>
                      <p className="text-xs text-slate-400">Visual alert status engine</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    thresholdStatus === "RED" 
                      ? "bg-red-500/10 border-red-500/30 text-red-400 animate-bounce" 
                      : thresholdStatus === "AMBER" 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}>
                    {thresholdStatus} ALERT
                  </span>
                </div>

                {/* Progress bar and math indicators */}
                <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-900/60 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-400">Monthly Food Limit</span>
                    <span className="text-sm font-semibold text-slate-200">${budgetLimit} USD</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-400">Spent Amount</span>
                    <span className="text-sm font-semibold text-slate-200">${budgetSpent} USD</span>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden mb-2 relative">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        thresholdStatus === "RED" 
                          ? "bg-gradient-to-r from-red-500 to-rose-600" 
                          : thresholdStatus === "AMBER" 
                          ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                          : "bg-gradient-to-r from-emerald-400 to-teal-500"
                      }`} 
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{budgetPercentage}% Spent</span>
                    <span>Remaining: ${(budgetLimit - budgetSpent)} USD</span>
                  </div>
                </div>

                {/* Controls Sliders */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Adjust Budget Limit</span>
                      <span>${budgetLimit}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="1000" 
                      step="50"
                      value={budgetLimit} 
                      onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Adjust Spent Amount</span>
                      <span>${budgetSpent}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      step="25"
                      value={budgetSpent} 
                      onChange={(e) => setBudgetSpent(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-4 mt-6 flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Alert rules mimic the Spring Boot backend: <b className="text-emerald-400">&lt;80%</b> is safe (Green), <b className="text-amber-400">80%-100%</b> warns of threshold risks (Amber), and <b className="text-rose-400">&gt;100%</b> triggers budget overrun alerts (Red).
                </p>
              </div>
            </div>

            {/* Sandbox 2: Conversational AI Financial Assistant */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[440px] shadow-xl hover:border-slate-800 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Financial Assistant</h3>
                    <p className="text-xs text-slate-400">Chatbot context simulator</p>
                  </div>
                </div>

                {/* Simulated message logs container */}
                <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-4 h-48 overflow-y-auto mb-4 flex flex-col gap-3.5 scrollbar-thin">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "assistant" 
                          ? "bg-slate-900 text-slate-100 self-start border border-slate-800" 
                          : "bg-indigo-600 text-white self-end"
                      }`}
                    >
                      {msg.message}
                    </div>
                  ))}
                  {isAssistantTyping && (
                    <div className="bg-slate-900 text-slate-400 border border-slate-800 max-w-[40%] rounded-2xl px-4 py-2.5 text-sm self-start flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75" />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-220" />
                    </div>
                  )}
                </div>

                {/* Simulated quick questions trigger */}
                <span className="text-xs text-slate-400 font-semibold block mb-2">Select a prompt to ask AI:</span>
                <div className="flex flex-col gap-2">
                  {CHAT_QUESTIONS.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => askAssistant(idx)}
                      disabled={isAssistantTyping}
                      className="text-left text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-300 font-medium px-4 py-2 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span>"{item.q}"</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sandbox 3: AI Quick-Fill Form Categorizer */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[440px] shadow-xl hover:border-slate-800 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Quick-Fill Auto-Categorization</h3>
                    <p className="text-xs text-slate-400">Natural language parsing engine</p>
                  </div>
                </div>

                {/* Simulated text input form */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-3">
                    {PARSE_PRESETS.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => triggerTyping(idx)}
                        disabled={typingIndex !== null}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white transition-all disabled:opacity-50"
                      >
                        Try "{item.desc}"
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 flex items-center gap-2 relative">
                    <span className="text-emerald-400 font-mono text-sm font-semibold select-none">$</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={inputText}
                      placeholder="Click one of the presets above to type..."
                      className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder-slate-600 focus:ring-0"
                    />
                    {typingIndex !== null && (
                      <span className="w-2 h-4 bg-indigo-500 animate-ping absolute right-4" />
                    )}
                  </div>
                </div>

                {/* Simulated response card output */}
                {parsedData ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5 mb-2.5">
                      <span className="text-xs text-emerald-400 font-bold tracking-wider">STRUCTURED AI RECEIPT</span>
                      <span className="text-[10px] text-slate-500 font-mono">Status: Parsed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-slate-400">Transaction Type</div>
                      <div className="font-bold text-slate-200 text-right">{parsedData.type}</div>

                      <div className="text-slate-400">Extracted Amount</div>
                      <div className="font-bold text-slate-200 text-right">{parsedData.amount} {parsedData.currency}</div>

                      <div className="text-slate-400">Assigned Category</div>
                      <div className="font-bold text-slate-200 text-right">🏷️ {parsedData.category}</div>

                      <div className="text-slate-400">Description</div>
                      <div className="italic text-slate-300 text-right font-medium">"{parsedData.desc}"</div>

                      <div className="text-slate-400 border-t border-slate-800/80 pt-2 mt-2">Normalized (USD)</div>
                      <div className="font-extrabold text-emerald-400 text-right border-t border-slate-800/80 pt-2 mt-2">${parsedData.usdNormalized} USD</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 border border-slate-900 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 h-[190px]">
                    <Brain className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                    <p className="text-xs max-w-xs leading-relaxed">
                      Select a prompt above to simulate the Gemini API mapping structured JSON output into active forms.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sandbox 4: Multi-Currency Sandbox */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[440px] shadow-xl hover:border-slate-800 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Multi-Currency Exchange</h3>
                    <p className="text-xs text-slate-400">Real-time normalization system</p>
                  </div>
                </div>

                {/* Conversion panel */}
                <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-5 mb-4">
                  <div className="grid grid-cols-5 items-center gap-3 mb-4">
                    <div className="col-span-3">
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Source Amount</label>
                      <input 
                        type="number" 
                        value={convAmount}
                        onChange={(e) => setConvAmount(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 w-full focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">From Currency</label>
                      <select 
                        value={fromCurr}
                        onChange={(e) => setFromCurr(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 w-full focus:outline-none focus:border-indigo-500"
                      >
                        {Object.keys(EXCHANGE_RATES).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-center my-3 text-indigo-400 bg-slate-900/50 w-8 h-8 rounded-full items-center mx-auto border border-slate-800">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>

                  <div className="grid grid-cols-5 items-center gap-3">
                    <div className="col-span-3">
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Target Amount</label>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold w-full">
                        {convResult}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">To Currency</label>
                      <select 
                        value={toCurr}
                        onChange={(e) => setToCurr(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 w-full focus:outline-none focus:border-indigo-500"
                      >
                        {Object.keys(EXCHANGE_RATES).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rate lookup stats */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-900">
                    <div className="text-[10px] text-slate-500 font-bold">1 USD = INR</div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">83.00</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-900">
                    <div className="text-[10px] text-slate-500 font-bold">1 USD = EUR</div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">0.92</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-900">
                    <div className="text-[10px] text-slate-500 font-bold">1 USD = GBP</div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">0.79</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Product Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Key Features
            </h2>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Every detail is engineered to make tracking, forecasting, and optimizing personal capital seamless and fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Brain className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">AI Quick-Fill Logging</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Parse natural sentences into structured ledger details automatically, matching categories and normalizations instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wallet className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Category Budget Caps</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set monthly targets. Receive alerts when spending reaches 80% (Amber) or overruns (Red) of category boundaries.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-slate-900/60 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Coins className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Multi-Currency Unification</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Support entries in USD, EUR, INR, GBP, and more, automatically standardizing analytics trends and budgets to USD.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Secure Encrypted Ledger</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Secured by Spring Security and JWT authentication. Your financial details remain confidential, private, and fully yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 relative z-10 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-300 text-sm">FinSight AI</span>
          </div>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} FinSight AI. Built using Spring Security, Gemini 2.5 Flash, and Next.js. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
