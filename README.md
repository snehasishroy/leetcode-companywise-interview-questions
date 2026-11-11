# Leetcode Companywise Interview Questions

![leetcode-companywise-interview-questions](https://socialify.git.ci/snehasishroy/leetcode-companywise-interview-questions/image?description=1&font=JetBrains+Mono&forks=1&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark)

This repository contains Company Wise Questions of LeetCode, categorized based on their recency.

* Last 30 Days
* Last 3 Months
* Last 6 Months
* Last 1 Year
* All

Attributes like Difficulty, Acceptance %, Frequency % are also added to enable filtering.

> This repository contains the snapshot as of **12th July 2026**.
>
> If you need to sort/filter the questions based on frequency/difficulty, please clone the repo and perform operations
> in any CSV Editor (Excel / Google Sheets / OpenOffice Calc)

## If you have LeetCode Premium and want to contribute back

* If you have LeetCode premium and want to contribute back, please clone the repo and setup the Java Project in the IDE
  of your choice.
* Code to scrap the solutions is
  present [here](https://github.com/snehasishroy/leetcode-companywise-interview-questions/blob/master/src/main/java/Scraper.java).
* By default, the selenium browser will open in Edge.
* If the selenium browser does not open, you might need to update *selenium-java* to the latest version because the
  older versions of Selenium java can be incompatible with the existing version of Edge.
  Run the scraper after filling in your UserName and Password [here](https://github.com/snehasishroy/leetcode-companywise-interview-questions/blob/master/src/main/java/Scraper.java#L17), without which the code won't work.
* Delete the existing folders so the new files does not conflict.
* In case you get a timeout during page reloads, do increase the default timeout value
  set [here](https://github.com/snehasishroy/leetcode-companywise-interview-questions/blob/master/src/main/java/Scraper.java#L19)

* Once the code is finished (which should take ~3 hours), create a Pull Request and I will be happy to merge it. Thank
  you for your contribution :)

### Test one list using a signed-in Edge session on macOS

Sign in to LeetCode in Edge and enable **Remote debugging** at `edge://inspect`. With Node.js 18+, Maven and JDK 21 available, run:

```sh
npm ci
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npm run capture:edge
```

Allow the connection if Edge prompts you. The command opens a temporary tab and exports the Google 3-month list to the printed scratch path. The adjacent JSON report records the visible recency filter check, the count reported by the list's pagination, and whether the final page was reached. Review any unverified results before replacing a snapshot.

For an explicit set of companies and a shared window, provide a new output directory:

```sh
npm run capture:edge -- google,amazon three-months /tmp/leetcode-refresh
```

The supported window names are `thirty-days`, `three-months`, `six-months`, `more-than-six-months`, and `all`.

# Star History

[![Star History Chart](https://api.star-history.com/chart?repos=snehasishroy/leetcode-companywise-interview-questions&type=date&legend=top-left&sealed_token=fbsbaQ5FrWF5R-zf2kLFqSxVae8tcHcv8ZphgmDdrGoUA1OOBTu--r8o5Cwmp_8BgAVdmr0ALgaS4GkOzXQwRDwwMSlzoxQbqnLreg1PkrOoANW2bxYNmqB_eBZt72mpS4eG_8xBZ8isXJZkuf-zbT4crPpTX4mX8WdXIbz9B-FJIfZfl5BUUpUrzFiz)](https://www.star-history.com/?repos=snehasishroy%2Fleetcode-companywise-interview-questions&type=date&legend=top-left)

## Happy LeetCoding. May the force be with you.


