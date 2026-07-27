import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Solve counts for unique problems
    const totalProblems = await prisma.problem.count();
    const solvedProblems = await prisma.problem.count({ where: { solved: true } });
    const remainingProblems = totalProblems - solvedProblems;
    const completionPercentage = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;

    // 2. Breakdown by difficulty levels
    const easySolved = await prisma.problem.count({ where: { difficulty: 'Easy', solved: true } });
    const easyTotal = await prisma.problem.count({ where: { difficulty: 'Easy' } });

    const mediumSolved = await prisma.problem.count({ where: { difficulty: 'Medium', solved: true } });
    const mediumTotal = await prisma.problem.count({ where: { difficulty: 'Medium' } });

    const hardSolved = await prisma.problem.count({ where: { difficulty: 'Hard', solved: true } });
    const hardTotal = await prisma.problem.count({ where: { difficulty: 'Hard' } });

    // 3. Compute company completion stats
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        problems: {
          select: {
            problem: {
              select: {
                solved: true,
              },
            },
          },
        },
      },
    });

    let completedCompanies = 0;
    let startedCompanies = 0;
    const totalCompanies = companies.length;

    for (const c of companies) {
      const total = c.problems.length;
      if (total === 0) continue;
      const solved = c.problems.filter(p => p.problem.solved).length;
      if (solved === total) {
        completedCompanies++;
      } else if (solved > 0) {
        startedCompanies++;
      }
    }

    // 4. Today's solved count (local day)
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    const startOfToday = new Date(todayStr + 'T00:00:00');
    
    const todaySolvedCount = await prisma.activityLog.count({
      where: {
        action: 'SOLVED',
        timestamp: {
          gte: startOfToday,
        },
      },
    });

    // 5. Recent activity
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: {
        action: 'SOLVED',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    const recentActivity = recentActivityLogs.map(log => ({
      id: log.id,
      problemId: log.problemId,
      problemTitle: log.problem.title,
      difficulty: log.problem.difficulty,
      timestamp: log.timestamp,
    }));

    // 6. Streak stats
    const stats = await prisma.userStats.findUnique({ where: { id: 1 } });
    const streak = stats?.streak || 0;

    // 7. Sync Config
    const syncConfig = await prisma.syncConfig.findUnique({ where: { id: 1 } });

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
