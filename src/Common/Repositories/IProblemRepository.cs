using Common.Models;

namespace Common.Repositories
{
    public interface IProblemRepository
    {
        Task<List<Problem>> GetAllProblemsAsync();
    }
}