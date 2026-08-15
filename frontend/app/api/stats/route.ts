import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    const startOfToday = new Date(todayStr + 'T00:00:00');

    // Run all independent queries in parallel
    const [
      totalProblems,
      solvedProblems,
      easySolved,
      easyTotal,
      mediumSolved,
      mediumTotal,
      hardSolved,
      hardTotal,
      todaySolvedCount,
      recentActivityProblems,
      userStats,
      bookmarkedProblemsList,
      syncConfig,
      companyStatsRaw,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({ where: { solved: true } }),
      prisma.problem.count({ where: { difficulty: 'Easy', solved: true } }),
      prisma.problem.count({ where: { difficulty: 'Easy' } }),
      prisma.problem.count({ where: { difficulty: 'Medium', solved: true } }),
      prisma.problem.count({ where: { difficulty: 'Medium' } }),
      prisma.problem.count({ where: { difficulty: 'Hard', solved: true } }),
      prisma.problem.count({ where: { difficulty: 'Hard' } }),
      prisma.problem.count({
        where: {
          solved: true,
          solvedAt: { gte: startOfToday },
        },
      }),
      prisma.problem.findMany({
        where: { solved: true, solvedAt: { not: null } },
        orderBy: { solvedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, difficulty: true, solvedAt: true },
      }),
      prisma.userStats.findUnique({ where: { id: 1 } }),
      prisma.problem.findMany({
        where: { bookmarked: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          difficulty: true,
          solved: true,
          url: true,
          updatedAt: true,
        },
      }),
      prisma.syncConfig.findUnique({ where: { id: 1 } }),
      prisma.$queryRaw<Array<{ totalCompanies: bigint; completedCompanies: bigint; startedCompanies: bigint }>>`
        SELECT 
          (SELECT COUNT(*) FROM Company) as totalCompanies,
          COUNT(CASE WHEN total_cnt > 0 AND solved_cnt = total_cnt THEN 1 END) as completedCompanies,
          COUNT(CASE WHEN solved_cnt > 0 AND solved_cnt < total_cnt THEN 1 END) as startedCompanies
        FROM (
          SELECT cp.companyId,
                 COUNT(cp.problemId) as total_cnt,
                 SUM(CASE WHEN p.solved = 1 THEN 1 ELSE 0 END) as solved_cnt
          FROM CompanyProblem cp
          JOIN Problem p ON cp.problemId = p.id
          GROUP BY cp.companyId
        )
      `,
    ]);

    const remainingProblems = totalProblems - solvedProblems;
    const completionPercentage = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;

    const totalCompanies = Number(companyStatsRaw[0]?.totalCompanies || 0);
    const completedCompanies = Number(companyStatsRaw[0]?.completedCompanies || 0);
    const startedCompanies = Number(companyStatsRaw[0]?.startedCompanies || 0);

    const recentActivity = recentActivityProblems.map((p) => ({
      id: p.id,
      problemId: p.id,
      problemTitle: p.title,
      difficulty: p.difficulty,
      timestamp: p.solvedAt,
    }));

    const streak = userStats?.streak || 0;

    const bookmarkedProblems = bookmarkedProblemsList.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      solved: p.solved,
      url: p.url,
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      overall: {
        totalProblems,
        solvedProblems,
        remainingProblems,
        completionPercentage,
      },
      difficulties: {
        easy: { solved: easySolved, total: easyTotal },
        medium: { solved: mediumSolved, total: mediumTotal },
        hard: { solved: hardSolved, total: hardTotal },
      },
      companies: {
        total: totalCompanies,
        completed: completedCompanies,
        started: startedCompanies,
      },
      todaySolvedCount,
      streak,
      recentActivity,
      bookmarkedCount: bookmarkedProblems.length,
      bookmarkedProblems,
      syncConfig: {
        leetcodeUser: syncConfig?.leetcodeUser || '',
        lastSyncedAt: syncConfig?.lastSyncedAt || null,
        isDemoMode: syncConfig?.isDemoMode || false,
        hasSessionCookie: !!syncConfig?.leetcodeSession,
      },
    });
  } catch (error: any) {
    console.error('Error fetching global statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
