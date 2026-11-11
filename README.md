# Leetcode Companywise Interview Questions

![leetcode-companywise-interview-questions](https://socialify.git.ci/snehasishroy/leetcode-companywise-interview-questions/image?description=1&font=JetBrains+Mono&forks=1&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark)

## Question lists

The checked-in CSVs contain the **July 12, 2026** snapshot of LeetCode company question lists. Each company has its own folder, such as [Google](google/) or [Citadel](citadel/). The CSVs include the problem ID, URL, title, difficulty, acceptance rate, and frequency.

| CSV | LeetCode filter |
| --- | --- |
| `thirty-days.csv` | 30 days |
| `three-months.csv` | 3 months |
| `six-months.csv` | 6 months |
| `more-than-six-months.csv` | More than 6 months |
| `all.csv` | All |

## Refresh company CSVs on macOS

You need a signed-in LeetCode Premium session in Microsoft Edge, Node.js 20 or later, Maven, and JDK 21. In Edge, open `edge://inspect`, select **Remote debugging**, and enable it for the running browser. Leave Edge open.

From the repository root, install dependencies and pass the company's LeetCode slug to export all five windows:

```sh
npm ci
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npm run capture:edge citadel
```

If Edge prompts you, click **Allow**. The script uses your existing signed-in session and opens a temporary tab.

Exports go to `captures/YYYY-MM-DD/<company>/` using your local date. Git ignores `captures/`. Each CSV has an adjacent `.csv.json` verification report. A run stops before connecting to Edge if an output file or report already exists.

To save a run to a different directory, including a same-day rerun for the same company:

```sh
npm run capture:edge citadel ./captures/citadel-rerun
```

To export a single window for one or more companies, pass the company slug or comma-separated slugs, the window name from the table without `.csv`, and an output directory:

```sh
npm run capture:edge google,amazon three-months ./captures/targeted-refresh
```

## Contribute a data refresh

1. Review each CSV and its verification report. A verified capture matches the visible recency filter, reaches the final page, and matches the list's reported question count.
2. Copy the verified CSVs into the corresponding tracked company folders and review the diff. For a partial refresh, include the company names, windows, and capture date in the PR description. Update the repository-wide snapshot date when refreshing the full snapshot.
3. Open a pull request with the CSV changes.

# Star History

[![Star History Chart](https://api.star-history.com/chart?repos=snehasishroy/leetcode-companywise-interview-questions&type=date&legend=top-left&sealed_token=fbsbaQ5FrWF5R-zf2kLFqSxVae8tcHcv8ZphgmDdrGoUA1OOBTu--r8o5Cwmp_8BgAVdmr0ALgaS4GkOzXQwRDwwMSlzoxQbqnLreg1PkrOoANW2bxYNmqB_eBZt72mpS4eG_8xBZ8isXJZkuf-zbT4crPpTX4mX8WdXIbz9B-FJIfZfl5BUUpUrzFiz)](https://www.star-history.com/?repos=snehasishroy%2Fleetcode-companywise-interview-questions&type=date&legend=top-left)

## Happy LeetCoding. May the force be with you.


