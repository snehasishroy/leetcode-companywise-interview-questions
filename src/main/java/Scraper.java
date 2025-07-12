import io.github.bonigarcia.wdm.WebDriverManager;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
public class Scraper {
    private static final String USERNAME = ""; // Provide your LeetCode username/email
    private static final String PASSWORD = ""; // Provide your LeetCode password
    public static final int QUESTIONS_PAGE_WAIT_MILLIS = 5000;
    public static final int LOGIN_PAGE_WAIT_MILLIS = 30000;
    WebDriver driver;

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
//            log.info(link);
//            companyURLs.add(link);
//        }
//        for (String companyURL : companyURLs) {
        visitCompanies("https://leetcode.com/company/amazon/?favoriteSlug=amazon-all", driver);
//        }
    }

    private void visitCompanies(String companyURL, WebDriver driver) throws InterruptedException {
        String companyName = companyURL.substring(companyURL.lastIndexOf("/") + 1);
        log.info("Visiting {}", companyName);
        driver.get(companyURL);
        Thread.sleep(QUESTIONS_PAGE_WAIT_MILLIS);
        loadAllProblems(driver);
        String pageSource = driver.getPageSource();
        Document doc = Jsoup.parse(pageSource);
        List<ProblemStatement> problems = extractProblems(doc);

        log.info("Extracted {} problems from", problems.size());
        for (ProblemStatement problem : problems) {
            log.info("{}", problem);
        }
    }

    public static void loadAllProblems(WebDriver driver) {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        int maxScrolls = 30; // Maximum number of scrolls
        int consecutiveNoChange = 0; // Counter for consecutive scrolls with no new content
        int maxConsecutiveNoChange = 3; // Stop after 3 consecutive scrolls with no new content

        log.info("Loading all problems by scrolling...");

        for (int i = 0; i < maxScrolls; i++) {
            int currentCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();

            boolean scrolled = performScroll(driver, js);

            if (!scrolled) {
                log.info("Scroll " + (i + 1) + ": Unable to scroll further, stopping.");
                break;
            }

            // Check if new problems were loaded
            int newCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();

            if (newCount > currentCount) {
                // New content loaded
                consecutiveNoChange = 0;
                log.info("Scroll " + (i + 1) + ": Found " + newCount + " problems (+" + (newCount - currentCount) + " new)");
            } else {
                // No new content
                consecutiveNoChange++;
                log.info("Scroll " + (i + 1) + ": No new problems loaded (" + consecutiveNoChange + "/" + maxConsecutiveNoChange + ")");

                // If we've had consecutive scrolls with no new content, assume we've reached the end
                if (consecutiveNoChange >= maxConsecutiveNoChange) {
                    log.info("No new content loaded after " + maxConsecutiveNoChange + " consecutive scrolls. Assuming all problems are loaded.");
                    break;
                }
            }
        }
        log.info("Finished loading problems.");
    }

    private static boolean performScroll(WebDriver driver, JavascriptExecutor js) {
        try {
            // Find the specific element to scroll inside
            WebElement scrollElement = driver.findElement(By.xpath("/html/body/div[1]/div[1]/div[4]/div/div[2]"));

            // Scroll down by 5000 pixels inside the element
            js.executeScript("arguments[0].scrollTop = arguments[0].scrollHeight;", scrollElement);
            Thread.sleep(3000);

            return true;

        } catch (Exception e) {
            log.error("Error during scrolling: ", e);
            return false;
        }
    }

    public static List<ProblemStatement> extractProblems(Document doc) {
        List<ProblemStatement> problems = new ArrayList<>();

        // Find all problem links
        Elements problemLinks = doc.select("a[href*='/problems/'][id]");

        for (Element link : problemLinks) {
            try {
                // Extract ID from the id attribute
                String id = link.attr("id");

                // Extract URL from href attribute
                String url = link.attr("href");
                // Remove query parameters
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
                Elements candidates = link.select("div.text-sd-muted-foreground");
                for (Element candidate : candidates) {
                    String text = candidate.text().trim();
                    if (text.contains("%")) {
                        acceptancePercentage = text;
                        break;
                    }
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
                Elements orangeDivs = link.select("div[class*='bg-brand-orange'][class*='h-2'][class*='w-0.5'][class*='rounded']");
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
                log.error("Error processing problem element: ", e);
            }
        }

        return problems;
    }
}
