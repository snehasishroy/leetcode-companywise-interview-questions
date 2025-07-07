import io.github.bonigarcia.wdm.WebDriverManager;
import model.ProblemStatement;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.*;
import org.openqa.selenium.edge.EdgeDriver;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class Scraper {
    private static final String USERNAME = ""; // Provide your LeetCode username/email
    private static final String PASSWORD = ""; // Provide your LeetCode password
    public static final int QUESTIONS_PAGE_WAIT_MILLIS = 10000;
    public static final int LOGIN_PAGE_WAIT_MILLIS = 2000;
    WebDriver driver;
    List<String> companyURLs = new ArrayList<>();

    public void setup() throws InterruptedException, IOException {
        WebDriverManager.edgedriver().setup();
        driver = new EdgeDriver();

        driver.get("https://leetcode.com/accounts/login/");
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(1));
        if (USERNAME.isEmpty() || PASSWORD.isEmpty()) {
            throw new IllegalArgumentException("Username or password can't be empty");
        }
        driver.findElement(By.xpath("// *[ @ id = 'id_login']")).sendKeys(USERNAME);
        driver.findElement(By.xpath("// *[ @ id = 'id_password']")).sendKeys(PASSWORD);
        driver.findElement(By.xpath("// *[ @ id = 'id_password']")).sendKeys(Keys.ENTER);
        Thread.sleep(LOGIN_PAGE_WAIT_MILLIS); // Wait for the login to happen, then visit the problems pages
//        driver.get("https://leetcode.com/problemset/all/");
//        List<WebElement> companies = driver.findElements(By.cssSelector(".mb-4.mr-3"));
//        for (WebElement company : companies) {
//            String link = company.getAttribute("href");
//            System.out.println(link);
//            companyURLs.add(link);
//        }
//        for (String companyURL : companyURLs) {
            visitCompanies("https://leetcode.com/company/amazon/?favoriteSlug=amazon-all", driver);
//        }
    }

    private void visitCompanies(String companyURL, WebDriver driver) throws InterruptedException, IOException {
        String companyName = companyURL.substring(companyURL.lastIndexOf("/") + 1);
        System.out.println("Visiting " + companyURL);
        this.driver.get(companyURL);
        Thread.sleep(QUESTIONS_PAGE_WAIT_MILLIS);
        loadAllProblems(driver);
        // Get the page source and parse with Jsoup
        String pageSource = this.driver.getPageSource();
        Document doc = Jsoup.parse(pageSource);
        List<ProblemStatement> problems = extractProblems(doc);
        // Print results
        System.out.println("Extracted " + problems.size() + " problems:");
        for (ProblemStatement problem : problems) {
            System.out.println(problem);
        }
    }

//    private void visitCompanies(String companyURL) throws InterruptedException, IOException {
//        String companyName = companyURL.substring(companyURL.lastIndexOf("/") + 1);
//        System.out.println("Visiting " + companyURL);
//        driver.get(companyURL);
//        Thread.sleep(QUESTIONS_PAGE_WAIT_MILLIS); // Wait for the page to load, for companies like Google/Amazon, it takes a lot of time
//        String table = "";
//        try {
//            table = "<table>" + driver.findElement(By.className("table")).getAttribute("innerHTML") + "</table>";
//        } catch (NoSuchElementException ex) {
//            Thread.sleep(30000);
//            driver.get(companyURL);
//            Thread.sleep(30000);
//            table = "<table>" + driver.findElement(By.className("table")).getAttribute("innerHTML") + "</table>";
//        }
//        Document doc = Jsoup.parse(table); // parse the table html content
//        List<String[]> result = new ArrayList<>();
//        String[] header = new String[]{"ID", "Title", "URL", "Is Premium", "Acceptance %", "Difficulty", "Frequency %"};
//        result.add(header);
//        for (Element row : doc.getElementsByTag("tr")) {
//            Elements cols = row.getElementsByTag("td");
//            int size = cols.size();
//            if (size != 0) { // for <th> size would be 0
//                String id = cols.get(1).text();
//                String title = cols.get(2).text();
//                Elements href = cols.get(2).getElementsByAttribute("href");
//                boolean isPremium = !cols.get(2).getElementsByTag("i").isEmpty();
//                String problemUrl = href.get(0).attr("href");
//                String acceptance = cols.get(3).text();
//                String difficulty = cols.get(4).getElementsByTag("span").text();
//                String frequency = cols.get(5).getElementsByClass("progress-bar").attr("style");
//                // sample response "width: 29.1345%";
//                frequency = frequency.substring(frequency.indexOf(" ") + 1); // get the value after the first whitespace
//                String[] res = new String[]{id, title, problemUrl, isPremium ? "Y" : "N", acceptance, difficulty, frequency};
//                result.add(res);
//            }
//        }
//        try (CSVWriter csvWriter = new CSVWriter(new FileWriter(companyName + ".csv"))) {
//            csvWriter.writeAll(result);
//        }
//    }

    public static void loadAllProblems(WebDriver driver) {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        int maxScrolls = 30; // Maximum number of scrolls
        int scrollDelay = 10; // Delay between scrolls in seconds
        int consecutiveNoChange = 0; // Counter for consecutive scrolls with no new content
        int maxConsecutiveNoChange = 3; // Stop after 3 consecutive scrolls with no new content

        System.out.println("Loading all problems by scrolling...");

        for (int i = 0; i < maxScrolls; i++) {
            // Get current number of problem links
            int currentCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();

            // Try multiple scrolling methods to ensure scrolling works
            boolean scrolled = performScroll(driver, js);

            if (!scrolled) {
                System.out.println("Scroll " + (i + 1) + ": Unable to scroll further, stopping.");
                break;
            }

            // Wait for new content to load
            try {
                Thread.sleep(scrollDelay * 1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }

            // Check if new problems were loaded
            int newCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();

            if (newCount > currentCount) {
                // New content loaded
                consecutiveNoChange = 0;
                System.out.println("Scroll " + (i + 1) + ": Found " + newCount + " problems (+" + (newCount - currentCount) + " new)");
            } else {
                // No new content
                consecutiveNoChange++;
                System.out.println("Scroll " + (i + 1) + ": No new problems loaded (" + consecutiveNoChange + "/" + maxConsecutiveNoChange + ")");

                // If we've had consecutive scrolls with no new content, assume we've reached the end
                if (consecutiveNoChange >= maxConsecutiveNoChange) {
                    System.out.println("No new content loaded after " + maxConsecutiveNoChange + " consecutive scrolls. Assuming all problems are loaded.");
                    break;
                }
            }
        }

        System.out.println("Finished loading problems.");
    }

    /**
     * Performs scrolling using multiple methods to ensure it works
     * @param driver WebDriver instance
     * @param js JavascriptExecutor instance
     * @return true if scrolling was performed, false otherwise
     */
    private static boolean performScroll(WebDriver driver, JavascriptExecutor js) {
        try {
            // Get current scroll position
            long currentScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");

            // Method 1: Scroll to document height
            js.executeScript("window.scrollTo(0, document.body.scrollHeight);");
            Thread.sleep(1000); // Short wait

            // Check if we actually scrolled
            long newScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");
            if (newScrollY > currentScrollY) {
                return true;
            }

            // Method 2: Try document.documentElement.scrollHeight
            js.executeScript("window.scrollTo(0, document.documentElement.scrollHeight);");
            Thread.sleep(1000);

            newScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");
            if (newScrollY > currentScrollY) {
                return true;
            }

            // Method 3: Scroll by a large amount
            js.executeScript("window.scrollBy(0, 3000);");
            Thread.sleep(1000);

            newScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");
            if (newScrollY > currentScrollY) {
                return true;
            }

            // Method 4: Try scrolling the main container (common in SPAs)
            js.executeScript(
                    "const containers = document.querySelectorAll('[class*=\"scroll\"], [class*=\"overflow\"], main, .main-content, #main');" +
                            "for (let container of containers) {" +
                            "  if (container.scrollHeight > container.clientHeight) {" +
                            "    container.scrollTop = container.scrollHeight;" +
                            "    break;" +
                            "  }" +
                            "}"
            );
            Thread.sleep(1000);

            newScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");
            if (newScrollY > currentScrollY) {
                return true;
            }

            // Method 5: End key simulation
            js.executeScript("document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'End'}));");
            Thread.sleep(1000);

            newScrollY = (Long) js.executeScript("return window.scrollY || window.pageYOffset;");
            return newScrollY > currentScrollY;

        } catch (Exception e) {
            System.err.println("Error during scrolling: " + e.getMessage());
            return false;
        }
    }

    public static List<ProblemStatement> extractProblems(Document doc) {
        List<ProblemStatement> problems = new ArrayList<>();

        // Find all problem links (assuming they are anchor tags with specific pattern)
        Elements problemLinks = doc.select("a[href*='/problems/'][id]");

        for (Element link : problemLinks) {
            try {
                // Extract ID from the id attribute
                String id = link.attr("id");

                // Extract URL from href attribute
                String url = link.attr("href");
                // Remove query parameters if needed
                if (url.contains("?")) {
                    url = url.substring(0, url.indexOf("?"));
                }

                // Extract title - look for the element containing the problem title
                String title = "";
                Element titleElement = link.select("div.ellipsis.line-clamp-1").first();
                if (titleElement != null) {
                    title = titleElement.text().trim();
                    // Remove the number prefix if present (e.g., "22. Generate Parentheses" -> "Generate Parentheses")
                    if (title.matches("^\\d+\\.\\s*.*")) {
                        title = title.replaceFirst("^\\d+\\.\\s*", "");
                    }
                }

                // Extract acceptance percentage
                String acceptancePercentage = "";
                Element acceptanceElement = link.select("div.text-sd-muted-foreground").first();
                if (acceptanceElement != null) {
                    acceptancePercentage = acceptanceElement.text().trim();
                }

                // Extract difficulty based on CSS class
                String difficulty = "";
                Element easyElement = link.select("p.text-sd-easy").first();
                Element mediumElement = link.select("p.text-sd-medium").first();
                Element hardElement = link.select("p.text-sd-hard").first();

                if (easyElement != null) {
                    difficulty = "Easy";
                } else if (mediumElement != null) {
                    difficulty = "Medium";
                } else if (hardElement != null) {
                    difficulty = "Hard";
                }

                // Extract frequency percentage by counting orange divs (exclude those with opacity)
                String frequencyPercentage = "";
                Elements orangeDivs = link.select("div.bg-brand-orange.h-2.w-0\\.5.rounded");
                if (!orangeDivs.isEmpty()) {
                    int validCount = 0;
                    for (Element div : orangeDivs) {
                        // Only count divs that don't have opacity class
                        if (!div.hasClass("opacity-40")) {
                            validCount++;
                        }
                    }
                    double frequency = validCount * 12.5; // Each valid div represents 12.5%
                    frequencyPercentage = frequency + "%";
                }

                // Create and add problem statement if we have valid data
                if (!id.isEmpty() && !url.isEmpty() && !title.isEmpty()) {
                    ProblemStatement problem = new ProblemStatement(
                            id, url, title, difficulty, acceptancePercentage, frequencyPercentage
                    );
                    problems.add(problem);
                }

            } catch (Exception e) {
                System.err.println("Error processing problem element: " + e.getMessage());
                continue;
            }
        }

        return problems;
    }
}
