namespace Common.Helper
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    public static class FastHashId
    {
        public static string GenerateHashId(string part1, string part2, string part3)
        {
            return GenerateHashId(new List<string> { part1, part2, part3 });
        }

        public static string GenerateHashId(List<string> input)
        {
            string combined = string.Join("|", input);
            ulong hash = 14695981039346656037UL; // FNV offset basis
            const ulong prime = 1099511628211UL;

            foreach (byte b in Encoding.UTF8.GetBytes(combined))
            {
                hash ^= b;
                hash *= prime;
            }

            // Convert hash to Base36 (alphanumeric) for compactness
            string base36 = ToBase36(hash);

            // Ensure it's exactly 10 characters
            return base36.Length > 10 ? base36.Substring(0, 10) : base36.PadLeft(10, '0');
        }

        private static string ToBase36(ulong value)
        {
            const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            StringBuilder sb = new StringBuilder();
            while (value > 0)
            {
                sb.Insert(0, chars[(int)(value % 36)]);
                value /= 36;
            }
            return sb.ToString();
        }

        public static string GenerateRandonGuid()
        {
            return Guid.NewGuid().ToString("N");
        }
    }
    
}
