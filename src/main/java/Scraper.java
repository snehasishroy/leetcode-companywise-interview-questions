import io.github.bonigarcia.wdm.WebDriverManager;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import model.ProblemStatement;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.*;
import org.openqa.selenium.edge.EdgeDriver;

import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class Scraper {
    private static final String USERNAME = ""; // Provide your LeetCode username/email
    private static final String PASSWORD = ""; // Provide your LeetCode password
    public static final int QUESTIONS_PAGE_WAIT_MILLIS = 5000;
    public static final int LOGIN_PAGE_WAIT_MILLIS = 20000;
    WebDriver driver;

    public void setup() throws InterruptedException {
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
        driver.get("https://leetcode.com/problemset/all/");
        List<WebElement> companies = driver.findElements(By.cssSelector(".mb-4.mr-3"));
        List<String> companyURLs = new ArrayList<>();
        for (WebElement company : companies) {
            String link = company.getAttribute("href");
            log.info(link);
            companyURLs.add(link);
        }

        for (int i = 0; i < companyURLs.size(); i++) {
            String companyURL = companyURLs.get(i);
            String companyName = extractCompanyNameWithRegex(companyURL);
            for (String recency : new String[]{"thirty-days", "three-months", "six-months", "more-than-six-months", "all"}) {
                visitCompanies(String.format("https://leetcode.com/company/%s/?favoriteSlug=%s-%s", companyName, companyName, recency), driver, recency);
            }
            log.info("Pending {} companies", companyURLs.size() - i - 1);
        }
    }

    private void visitCompanies(String companyURL, WebDriver driver, String recency) throws InterruptedException {
        String companyName = extractCompanyNameWithRegex(companyURL);

        // Create directory structure: companyName/recency/
        Path outputDir = Paths.get(companyName, String.format("%s.csv", recency));
        if (Files.exists(outputDir)) { // this check acts as a checkpoint
            log.warn("File already exists: {}, Skipping", outputDir.toAbsolutePath());
            return;
        }

        log.info("Visiting {} with recency {}", companyName, recency);
        driver.get(companyURL);
        Thread.sleep(QUESTIONS_PAGE_WAIT_MILLIS);
        loadAllProblems(driver);
        String pageSource = driver.getPageSource();
        Document doc = Jsoup.parse(pageSource);
        List<ProblemStatement> problems = extractProblems(doc);

        log.info("Extracted {} problems", problems.size());
        for (ProblemStatement problem : problems) {
            log.info("{}", problem);
        }
        exportToCSV(problems, companyName, recency);
    }

    private String extractCompanyNameWithRegex(String companyURL) {
        Pattern pattern = Pattern.compile("/company/([^/?]+)");
        Matcher matcher = pattern.matcher(companyURL);

        if (matcher.find()) {
            return matcher.group(1);
        }

        throw new IllegalArgumentException("Invalid company URL format: " + companyURL);
    }

    private static void loadAllProblems(WebDriver driver) {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        int maxScrolls = 30; // Maximum number of scrolls

        log.info("Loading all problems by scrolling...");

        for (int i = 0; i < maxScrolls; i++) {
            int currentCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();
            if (currentCount == 0) {
                log.info("Scroll {}: No problems found, stopping.", i + 1);
                break;
            }
            boolean scrolled = performScroll(driver, js);
            if (!scrolled) {
                log.info("Scroll {}: Unable to scroll further, stopping.", i + 1);
                break;
            }

            // Check if new problems were loaded
            int newCount = driver.findElements(By.cssSelector("a[href*='/problems/'][id]")).size();
            if (newCount > currentCount) {
                // New content loaded
                log.info("Scroll {}: Found {} problems (+{} new)", i + 1, newCount, newCount - currentCount);
            } else {
                // No new content
                break;
            }
        }
        log.info("Finished loading problems.");
    }

    private static boolean performScroll(WebDriver driver, JavascriptExecutor js) {
        try {
            WebElement scrollElement = driver.findElement(By.xpath("/html/body/div[1]/div[1]/div[4]/div/div[2]"));

            js.executeScript("arguments[0].scrollTop = arguments[0].scrollHeight;", scrollElement);
            Thread.sleep(3000);

            return true;
        } catch (Exception e) {
            log.error("Error during scrolling: ", e);
            return false;
        }
    }

    private static List<ProblemStatement> extractProblems(Document doc) {
        List<ProblemStatement> problems = new ArrayList<>();

        // Find all problem links
        Elements problemLinks = doc.select("a[href*='/problems/'][id]");

        for (Element link : problemLinks) {
            try {
                // Extract ID from the id attribute
                String id = "";

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
                        id = title.replaceFirst("^(\\d+)\\.\\s*.*", "$1");
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
                    double frequency = validCount * 12.5; // Each valid div represents approx 12.5%
                    frequencyPercentage = frequency + "%";
                }

                // Create and add problem statement if we have valid data
                if (!id.isEmpty() && !url.isEmpty() && !title.isEmpty()) {
                    ProblemStatement problem = new ProblemStatement(
                            id, url, title, difficulty, acceptancePercentage, frequencyPercentage
                    );
                    problems.add(problem);
                } else {
                    log.error("Invalid problem data: ID={}, URL={}, Title={}", id, url, title);
                }
            } catch (Exception e) {
                log.error("Error processing problem element: ", e);
            }
        }

        return problems;
    }

    @SneakyThrows
    private void exportToCSV(List<ProblemStatement> problems, String companyName, String recency) {
        // Create directory structure: companyName/recency/
        Path outputDir = Paths.get(companyName);
        if (!Files.exists(outputDir)) {
            Files.createDirectories(outputDir);
        }

        Path filePath = outputDir.resolve(String.format("%s.csv", recency));

        try (FileWriter writer = new FileWriter(filePath.toFile())) {
            writer.append("ID,URL,Title,Difficulty,Acceptance %,Frequency %\n");

            for (ProblemStatement problem : problems) {
                writer.append(escapeCsvValue(problem.id()))
                        .append(',')
                        .append(escapeCsvValue("https://leetcode.com" + problem.url()))
                        .append(',')
                        .append(escapeCsvValue(problem.title()))
                        .append(',')
                        .append(escapeCsvValue(problem.difficulty()))
                        .append(',')
                        .append(escapeCsvValue(problem.acceptancePercentage()))
                        .append(',')
                        .append(escapeCsvValue(problem.frequencyPercentage()))
                        .append('\n');
            }
        }

        log.info("CSV file created: {}", filePath.toAbsolutePath());
    }

    private String escapeCsvValue(String value) {
        if (value == null) {
            return "";
        }

        // If value contains comma, double quote, or newline, wrap in quotes and escape internal quotes
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }

        return value;
    }
}
