using Common.Models;

namespace Backend.Filters
{
    public interface IFilter
    {
        public List<Problem> ApplyFilterAsync(List<Problem> problems);
    }    
}