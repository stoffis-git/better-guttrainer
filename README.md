# Gut Training Protocol Generator

A personalized carbohydrate intake optimization calculator for endurance athletes. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🎯 What This Tool Does

1. **Questionnaire** (6 questions, ~60 seconds): Collects athlete profile
2. **Opportunity Assessment**: Calculates personalized time savings estimate  
3. **Protocol Generation** (optional): Week-by-week gut training plan

## 🔬 Key Innovation: GI Dual Effect

GI issues have TWO distinct effects:

1. **Bigger Opportunity** (Time Calculation)
   - Multiplier: 1.3× if GI >30%
   - Athletes with GI issues are underabsorbing → fixing tolerance unlocks MORE gains

2. **Longer Timeline** (Protocol Calculation)  
   - Multiplier: 1.0-1.6× based on severity
   - Building tolerance takes time → slower progression for safety

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel-ready
- **Dependencies**: Zero external dependencies (pure React)

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run validation tests
npx tsx src/lib/validation.test.ts
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Validation Tests

The calculator includes 5 validation scenarios per specification:

| Test | Profile | Expected |
|------|---------|----------|
| 1 | Male, 70.3, 5:00, 65g/h, 5% GI | Target 90g, Save 4-7 min, 8 weeks |
| 2 | Male, 70.3, 5:00, 65g/h, 40% GI | Target 90g, Save 5-9 min, 11 weeks |
| 3 | Female, Marathon, 4:30, 35g/h, 20% GI | Target 60g (NOT 90!), Save 4-7 min |
| 4 | Male, Ironman, 11:00, 95g/h, 5% GI | Target 120g, Save 0-10 min, 8 weeks |
| 5 | Female, 100k, 12:00, 45g/h, 55% GI | Target 60g, Save 10-16 min, 17 weeks |

Run tests: `npx tsx src/lib/validation.test.ts`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main entry point
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── GutTrainerApp.tsx # Main app component
│   └── screens/
│       ├── LandingScreen.tsx
│       ├── QuestionnaireScreen.tsx
│       ├── ResultsScreen.tsx
│       ├── ProtocolSetupScreen.tsx
│       └── ProtocolResultsScreen.tsx
└── lib/
    ├── types.ts          # TypeScript types
    ├── calculations.ts   # Core calculation engine
    ├── store.ts          # State management
    └── validation.test.ts # Validation tests
```

## 🧮 Calculation Formulas

### Time Savings (9 steps)
1. `carb_gap = target - current`
2. `base_rate = 0.7% (≤90g) or 0.25% (120g)`
3. `base_improvement = (carb_gap / 10) × base_rate`
4. `gender_modifier = 0.95 (female) or 1.0`
5. `duration_modifier = 1.0 (<6h), 1.2 (6-8h), 1.4 (8+h)`
6. `gi_modifier = 1.3 (>30%) or 1.0` ⭐
7. `time_saved = finish_time × all_modifiers`
8. `variance = 0.25 (≤90g) or 0.8 (120g)`
9. `range = time_saved × (1±variance), floor at 0`

### Protocol Length (5 steps)
1. `base_weeks = 5 (4-6wk), 8 (6-10wk), 12 (10+wk)`
2. `gi_time_modifier = 1.0-1.6×` ⭐
3. `gap_modifier = 0.9-1.4×`
4. `total_weeks = base × gi_time × gap`
5. `weekly_increase = carb_gap / total_weeks`

## 🎨 Design Principles

- **Dark theme** with amber/orange accents
- **Mobile-first** responsive design
- **Transparency**: Show all calculation factors
- **Encouragement**: Positive framing for all athletes
- **Honesty**: Range width indicates confidence

## 🔧 Shopify Integration

This is a standalone service that can be integrated with Shopify via:
- **Iframe embed**: Embed directly in a Shopify page
- **External link**: Link from your Shopify store to the Vercel deployment
- **Custom app**: Build a Shopify app wrapper if needed

## 📚 Based On Research

- Costa et al. (2017): 5.2% performance improvement
- Stellingwerff & Cox (2014): 2-3% time gains documented
- Viribay et al. (2020): Recovery benefits at 120g/h
- Urdampilleta et al. (2020): Neuromuscular function preservation

## 📝 License

MIT

---

Built with evidence-based specifications for endurance athletes.
