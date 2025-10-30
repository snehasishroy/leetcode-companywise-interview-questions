namespace Common
{
    public interface IFilter<T>
    {
        public List<T> ApplyFilterAsync(List<T> entities);
    }    
}