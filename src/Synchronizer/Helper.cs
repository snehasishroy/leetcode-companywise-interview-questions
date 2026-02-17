using Synchronizer;

internal class Helper
{
    public static List<string> GetCsvFileNames(string rootDir)
    {
        var csvFiles = Directory.GetFiles(rootDir, "*.csv", SearchOption.AllDirectories);
        return csvFiles.ToList();
    }

    public static List<Common.Models.Problem> ReadProblemsFromCsv(string filePath, string rootDir)
    {
        var problems = new List<Common.Models.Problem>();
        var lines = File.ReadAllLines(filePath);
        var relPath = Path.GetRelativePath(rootDir, filePath);
        
        foreach (var line in lines.Skip(1)) // Skip header
        {
            var parts = line.Split(',');

            // ID,URL,Title,Difficulty,Acceptance %,Frequency %
            if (parts.Length < 5)
            {
                Console.WriteLine($"[{relPath}] Skipping malformed line: {line}");
                continue;
            }

            var problem = new Common.Models.Problem
            {
                id = parts[0],
                url = parts[1],
                title = parts[2],
                difficulty = Enum.TryParse<Common.Models.Difficulty>(parts[3], true, out var diff) ? diff : Common.Models.Difficulty.Unknown,
                acceptance = double.TryParse(parts[4].TrimEnd('%'), out var acc) ? acc : 0.0,
                frequency = double.TryParse(parts[5].TrimEnd('%'), out var freq) ? freq : 0.0,
                metadata = new Dictionary<string, string>()
            };

            problem.metadata[Common.Models.TagName.FolderName] = Path.GetDirectoryName(filePath)?.Split("/").Last() ?? "NA";
            problem.metadata[Common.Models.TagName.FileName] = Path.GetFileNameWithoutExtension(filePath);

            // Additional metadata can be parsed here if available
            problems.Add(problem);
        }

        return problems;
    }

}