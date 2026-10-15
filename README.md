# Recursion Lab

[![GitHub stars](https://img.shields.io/github/stars/AndaliaGitProjects/Recursion-lab?style=social)](https://github.com/AndaliaGitProjects/Recursion-lab)

An interactive, step-by-step visualizer for recursive algorithms. Watch every call being made, see the call tree grow, follow the call stack, and jump to any step.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no server.

## Algorithms

| Algorithm          | What you see                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Tower of Hanoi** | Disks moving between pegs, with the role of each peg (source / temp / destination) for the current call |
| **Binary Search**  | The search range shrinking on a sorted array (low / mid / high)                                         |
| **Factorial**      | The stack growing to depth _n_, then results returning                                                  |
| **Fibonacci**      | The branching call tree, with repeated calls highlighted                                                |
| **Ackermann**      | A deeply nested call tree and call statistics                                                           |
| **Hilbert Curve**  | The curve being drawn square by square, with a position scrubber                                        |
| **My algorithms**  | Write your own JavaScript function, trace it, and save it                                               |

## Features

- **Step-by-step control**: play, pause, step forward, step back, reset, and a speed slider
- **Call tree**: current, related and finished calls are colour-coded, with a full-screen button on every tree
- **Call stack and step log**: click any step in the log to jump straight to it
- **Call statistics**: repeated calls are highlighted, so the cost of naive recursion is easy to spot
- **Your own algorithms**: add, name, save, reorder and delete them (stored in your browser)
- **Customisable look**: light / dark theme, glass transparency, corner shape and accent colour
- **Mobile friendly**: the controls float in a bottom bar, and the variables open from a button in it, in a box with the step counter
- **Keyboard shortcuts**: `Space` play / pause, `→` next step, `←` back, `R` reset

## Run it

No installation needed. Download or clone the repo and open `index.html` in a browser.

```bash
git clone https://github.com/AndaliaGitProjects/Recursion-lab.git
cd Recursion-lab
# open index.html, or serve the folder:
python -m http.server 8000   # then visit http://localhost:8000
```

## Trace your own algorithm

1. In the sidebar, click **+** next to **My algorithms**.
2. Write a function (helpers and memo tables are fine), for example:

   ```js
   function power(b, e) {
     if (e === 0) return 1
     return b * power(b, e - 1)
   }
   ```

3. In **Variables**, set the call to trace, for example `power(2, 5)`, then press **Play** or **Step**.
4. Press **Save as new** to keep it in the sidebar.

Your code runs locally in your browser, so only run code you trust.

## Project structure

```
Recursion-lab/
├── index.html        # page structure and icons
├── css/style.css     # styles (themes, layout, mobile)
├── js/main.js        # algorithms, animation, UI
└── gemini-svg.svg    # favicon
```

## Support the project

If Recursion Lab helped you understand recursion, please consider giving the repository a star. It helps other people find it.

## Developer

Eng. Alhussin Rastanawi
