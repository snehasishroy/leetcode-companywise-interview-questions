import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws Exception {
        Scraper scraper = new Scraper();
        if (args.length == 0) {
            scraper.setup();
        } else if (args.length == 1 && args[0].equals("--import-html")) {
            Path htmlFile = Path.of(System.getenv("LEETCODE_CAPTURE_HTML"));
            Path outputFile = Path.of(System.getenv("LEETCODE_CAPTURE_CSV")).toAbsolutePath();
            int count = scraper.importCapturedHtml(htmlFile, outputFile);
            System.out.printf("Exported %d rows to %s%n", count, outputFile);
        } else {
            throw new IllegalArgumentException("Usage: Main [--import-html]");
        }
    }
}
