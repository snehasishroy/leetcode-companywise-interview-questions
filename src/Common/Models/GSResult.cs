namespace Common.Models
{
    public class GSResult
    {
        public string kind { get; set; }
        public UrlInfo url { get; set; }
        public Queries queries { get; set; }
        public Context context { get; set; }
        public SearchInformation searchInformation { get; set; }
        public List<Item> items { get; set; }
    }

    public class UrlInfo
    {
        public string type { get; set; }
        public string template { get; set; }
    }

    public class Queries
    {
        public List<QueryRequest> request { get; set; }
        public List<QueryRequest> nextPage { get; set; }
    }

    public class QueryRequest
    {
        public string totalResults { get; set; }
        public int count { get; set; }
        public int startIndex { get; set; }
        public string inputEncoding { get; set; }
        public string outputEncoding { get; set; }
        public string safe { get; set; }
        public string cx { get; set; }
        public string sort { get; set; }
        public string gl { get; set; }
        public string siteSearch { get; set; }
        public string siteSearchFilter { get; set; }
        public string exactTerms { get; set; }
        public string excludeTerms { get; set; }
        public string dateRestrict { get; set; }
    }

    public class Context
    {
        public string title { get; set; }
    }

    public class SearchInformation
    {
        public double searchTime { get; set; }
        public string formattedSearchTime { get; set; }
        public string totalResults { get; set; }
        public string formattedTotalResults { get; set; }
    }

    public class Item
    {
        public string kind { get; set; }
        public string title { get; set; }
        public string htmlTitle { get; set; }
        public string link { get; set; }
        public string displayLink { get; set; }
        public string snippet { get; set; }
        public string htmlSnippet { get; set; }
        public string formattedUrl { get; set; }
        public string htmlFormattedUrl { get; set; }
        // public PageMap pagemap { get; set; } // Not in use currently
    }

    /*
    #region PageMapClasses
    public class PageMap
    {
        public List<MetaTag> metatags { get; set; }
        public List<CseThumbnail> cse_thumbnail { get; set; }
        public List<CseImage> cse_image { get; set; }
        public List<BreadcrumbList> BreadcrumbList { get; set; }
        public List<Organization> organization { get; set; }
    }

    public class MetaTag
    {
        public string image { get; set; }
        public string og_type { get; set; }
        public string viewport { get; set; }
        public string title { get; set; }
        public string og_url { get; set; }
        public string og_image { get; set; }
        public string og_site_name { get; set; }
        public string og_locale { get; set; }
        public string og_description { get; set; }
        public string twitter_card { get; set; }
        public string twitter_image { get; set; }
        public string author { get; set; }
        public string url { get; set; }
        public string position { get; set; }
        public string referrer { get; set; }
        public string csrf_token { get; set; }
        public string csrf_param { get; set; }
        public string jobidentifier { get; set; }
        public string og_image_width { get; set; }
        public string og_image_height { get; set; }
        public string http_ogp_me_ns_article_published_time { get; set; }
        public string http_ogp_me_ns_article_modified_time { get; set; }
        public string http_ogp_me_ns_article_section { get; set; }
        public string twitter_site { get; set; }
    }

    public class CseThumbnail
    {
        public string src { get; set; }
        public string width { get; set; }
        public string height { get; set; }
    }

    public class CseImage
    {
        public string src { get; set; }
    }

    public class BreadcrumbList
    {
        // Add properties if needed
    }

    public class Organization
    {
        public string sameas { get; set; }
    }
    #endregion PageMapClasses 
    */
}