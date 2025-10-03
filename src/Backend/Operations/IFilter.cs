namespace Backend.Operations
{
    public interface IFilter
    {
        public List<Common.Models.Problem> ApplyFilterAsync(List<Common.Models.Problem> problems);
    }    
}