using System.Text;
using Common.DatabaseModels;

public static class JobListView
{
    public static string RenderScrappedJobsHtml(List<ScrappedJob> jobs)
    {
        var sb = new StringBuilder();

        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang='en'>");
        sb.AppendLine("<head>");
        sb.AppendLine("<meta charset='UTF-8'>");
        sb.AppendLine("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        sb.AppendLine("<title>Scrapped Jobs</title>");
        sb.AppendLine(@"<style>
            body { font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:20px; }
            .job-card { background:#fff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:20px; padding:20px; }
            .job-title { font-size:18px; font-weight:600; color:#0078D4; margin-bottom:8px; }
            .job-meta { color:#666; font-size:14px; margin-bottom:10px; }
            .job-snippet { font-size:15px; margin-bottom:10px; color:#333; }
            .job-tags { display:flex; flex-wrap:wrap; gap:6px; }
            .tag { background:#0078D4; color:white; border-radius:5px; padding:4px 8px; font-size:12px; }
            a { text-decoration:none; color:#0078D4; }
        </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("<h2>Scrapped Job Listings</h2>");

        foreach (var job in jobs)
        {
            sb.AppendLine("<div class='job-card'>");
            sb.AppendLine($"  <div class='job-title'><a href='{job.link}' target='_blank'>{System.Net.WebUtility.HtmlEncode(job.title)}</a></div>");
            sb.AppendLine($"  <div class='job-meta'>{System.Net.WebUtility.HtmlEncode(job.companyName ?? "Unknown")} — {System.Net.WebUtility.HtmlEncode(job.location ?? "N/A")}</div>");
            sb.AppendLine($"  <div class='job-snippet'>{System.Net.WebUtility.HtmlEncode(job.snippet ?? "No description available.")}</div>");
            
            if (job.tags != null && job.tags.Count > 0)
            {
                sb.AppendLine("  <div class='job-tags'>");
                foreach (var tag in job.tags)
                    sb.AppendLine($"<span class='tag'>{System.Net.WebUtility.HtmlEncode(tag)}</span>");
                sb.AppendLine("  </div>");
            }

            sb.AppendLine($"  <div class='job-meta'>Source: <a href='{job.displayLink}' target='_blank'>{job.displayLink}</a></div>");
            sb.AppendLine($"  <div class='job-meta'>Scrapped: {job.scrappedTime:yyyy-MM-dd HH:mm}</div>");
            sb.AppendLine("</div>");
        }

        sb.AppendLine("</body></html>");

        return sb.ToString();
    }
}
