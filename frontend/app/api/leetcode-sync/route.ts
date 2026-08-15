import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to fetch exact solved question slugs using the session cookie
async function fetchExactSolvedProblems(cookie: string): Promise<string[]> {
  const res = await fetch('https://leetcode.com/api/problems/all/', {
    method: 'GET',
    headers: {
      'Cookie': `LEETCODE_SESSION=${cookie}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`LeetCode authenticated API returned status ${res.status}`);
  }

  const data = await res.json();
  const pairs = data.stat_status_pairs || [];
  
  return pairs
    .filter((p: any) => p.status === 'ac')
    .map((p: any) => p.stat.question__title_slug)
    .filter(Boolean);
}

// Helper to fetch user solved counts by difficulty
async function fetchLeetCodeStats(username: string) {
  const query = `
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode Stats API returned status ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL Error fetching stats');
  }

  const stats = json.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
  
  let easy = 0;
  let medium = 0;
  let hard = 0;

  for (const item of stats) {
    if (item.difficulty === 'Easy') easy = item.count;
    if (item.difficulty === 'Medium') medium = item.count;
    if (item.difficulty === 'Hard') hard = item.count;
  }

  return { easy, medium, hard };
}

// Helper to fetch recent accepted submissions
interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
}

async function fetchRecentSubmissions(username: string, limit = 50): Promise<LeetCodeSubmission[]> {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ query, variables: { username, limit } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode Submissions API returned status ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL Error fetching submissions');
  }

  return json.data?.recentAcSubmissionList || [];
}

export async function POST(request: Request) {
  try {
    const { username, action, isSimulation, leetcodeSession } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get current sync configuration
    let config = await prisma.syncConfig.findUnique({ where: { id: 1 } });
    if (!config) {
      config = await prisma.syncConfig.create({
        data: { id: 1, leetcodeUser: '', leetcodeSession: '', lastSubmissionTimestamp: 0, isDemoMode: false },
      });
    }

    let targetAction = action || 'full';

    // Recovery Detection: Check if we need to upgrade to full sync
    if (targetAction === 'incremental') {
      const now = new Date();
      const lastSync = config.lastSyncedAt ? new Date(config.lastSyncedAt) : null;
      
      // 1. Recovery Check: If never synced, or last synced > 7 days ago
      if (!lastSync || (now.getTime() - lastSync.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        console.log('Recovery Triggered: Last sync was more than a week ago. Performing Full Sync.');
        targetAction = 'full';
      } else {
        // 2. Recovery Check: Fetch recent submissions and check for gaps
        try {
          const recentSubs = await fetchRecentSubmissions(username, 50);
          if (recentSubs.length > 0) {
            const lowestFetchedTimestamp = parseInt(recentSubs[recentSubs.length - 1].timestamp);
            // If the oldest submission in the fetched batch is newer than our last processed submission,
            // it means there is a gap where submissions were missed! We must trigger full sync.
            if (config.lastSubmissionTimestamp > 0 && lowestFetchedTimestamp > config.lastSubmissionTimestamp) {
              console.log('Recovery Triggered: Recent submissions window exceeded. Performing Full Sync.');
              targetAction = 'full';
            }
          }
        } catch (e: any) {
          console.warn('Failed to fetch recent submissions for recovery check, falling back to incremental', e.message);
        }
      }
    }

    // ==========================================
    // ACTION 1: FULL SYNC
    // ==========================================
    if (targetAction === 'full') {
      console.log(`Starting Full Sync for user: ${username}`);

      // Clear existing solved states to start a fresh sync
      await prisma.$transaction([
        prisma.problem.updateMany({
          where: { OR: [{ solved: true }, { solvedViaDemo: true }] },
          data: { solved: false, solvedAt: null, solvedViaDemo: false },
        }),
        prisma.activityLog.deleteMany(),
      ]);

      let solvedSlugs: Set<string> = new Set();
      let latestTimestamp = 0;
      let isDemoMode = !!isSimulation;

      // Determine session cookie to use (from request or fallback to stored config if username matches)
      const activeCookie = leetcodeSession !== undefined 
        ? leetcodeSession 
        : (config.leetcodeUser === username ? config.leetcodeSession : '');

      if (isDemoMode || username.toLowerCase() === 'demo' || username.toLowerCase() === 'simulation') {
        isDemoMode = true;
        console.log('Seeding simulated solved questions for demo...');
        const popularProblems = await prisma.problem.findMany({
          take: 120,
          orderBy: { id: 'asc' },
        });
        
        solvedSlugs = new Set(popularProblems.map(p => p.titleSlug));
        latestTimestamp = Math.floor(Date.now() / 1000);
      } 
      // 1. Precise Sync via LeetCode Session Cookie
      else if (activeCookie && activeCookie.trim()) {
        console.log(`Performing Authenticated Cookie Sync...`);
        try {
          const exactSlugs = await fetchExactSolvedProblems(activeCookie.trim());
          exactSlugs.forEach(slug => solvedSlugs.add(slug));
          latestTimestamp = Math.floor(Date.now() / 1000);
          console.log(`Found exactly ${solvedSlugs.size} solved question slugs using session cookie.`);
        } catch (cookieError: any) {
          console.error('Authenticated cookie fetch failed, falling back to public stats sync:', cookieError.message);
          // If cookie sync fails, proceed to public stats count-filler logic below
        }
      }

      // 2. Fallback to public counts sync if cookie was not provided or failed
      if (solvedSlugs.size === 0 && !isDemoMode) {
        console.log('Performing Public Stats Sync (Counts-Filler mode)...');
        try {
          const counts = await fetchLeetCodeStats(username);
          console.log(`LeetCode profile counts: Easy: ${counts.easy}, Medium: ${counts.medium}, Hard: ${counts.hard}`);

          const recentSubs = await fetchRecentSubmissions(username, 50);
          const actualSolvedSlugs: string[] = [];

          for (const sub of recentSubs) {
            actualSolvedSlugs.push(sub.titleSlug);
            const ts = parseInt(sub.timestamp);
            if (ts > latestTimestamp) {
              latestTimestamp = ts;
            }
          }

          actualSolvedSlugs.forEach(slug => solvedSlugs.add(slug));

          // Fetch difficulty matching
          const actualProblems = await prisma.problem.findMany({
            where: { titleSlug: { in: actualSolvedSlugs } },
            select: { difficulty: true },
          });

          let easyRemaining = counts.easy;
          let mediumRemaining = counts.medium;
          let hardRemaining = counts.hard;

          for (const p of actualProblems) {
            if (p.difficulty === 'Easy') easyRemaining = Math.max(0, easyRemaining - 1);
            if (p.difficulty === 'Medium') mediumRemaining = Math.max(0, mediumRemaining - 1);
            if (p.difficulty === 'Hard') hardRemaining = Math.max(0, hardRemaining - 1);
          }

          // Fill difficulties remaining using popular problems from repository
          if (easyRemaining > 0) {
            const fillEasy = await prisma.problem.findMany({
              where: {
                difficulty: 'Easy',
                NOT: { titleSlug: { in: Array.from(solvedSlugs) } },
              },
              orderBy: { id: 'asc' },
              take: easyRemaining,
              select: { titleSlug: true },
            });
            fillEasy.forEach(p => solvedSlugs.add(p.titleSlug));
          }

          if (mediumRemaining > 0) {
            const fillMedium = await prisma.problem.findMany({
              where: {
                difficulty: 'Medium',
                NOT: { titleSlug: { in: Array.from(solvedSlugs) } },
              },
              orderBy: { id: 'asc' },
              take: mediumRemaining,
              select: { titleSlug: true },
            });
            fillMedium.forEach(p => solvedSlugs.add(p.titleSlug));
          }

          if (hardRemaining > 0) {
            const fillHard = await prisma.problem.findMany({
              where: {
                difficulty: 'Hard',
                NOT: { titleSlug: { in: Array.from(solvedSlugs) } },
              },
              orderBy: { id: 'asc' },
              take: hardRemaining,
              select: { titleSlug: true },
            });
            fillHard.forEach(p => solvedSlugs.add(p.titleSlug));
          }

          if (latestTimestamp === 0) {
            latestTimestamp = Math.floor(Date.now() / 1000);
          }
        } catch (apiError: any) {
          console.error('LeetCode API failed, falling back to simulated demo solved states:', apiError.message);
          isDemoMode = true;
          const popularProblems = await prisma.problem.findMany({
            take: 75,
            orderBy: { id: 'desc' },
          });
          solvedSlugs = new Set(popularProblems.map(p => p.titleSlug));
          latestTimestamp = Math.floor(Date.now() / 1000);
        }
      }

      const slugsArray = Array.from(solvedSlugs);
      
      // Match solved list against repo (Query ONLY user's solved slugs for maximum efficiency)
      const matchedProblems = await prisma.problem.findMany({
        where: {
          titleSlug: { in: slugsArray },
        },
      });

      console.log(`Matched ${matchedProblems.length} solved problems with the repository.`);

      if (matchedProblems.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.problem.updateMany({
            where: {
              id: { in: matchedProblems.map(p => p.id) },
            },
            data: {
              solved: true,
              solvedAt: new Date(),
              solvedViaDemo: isDemoMode,
            },
          });

          // Create activity logs
          const activities = matchedProblems.map(p => ({
            problemId: p.id,
            action: 'SOLVED',
          }));
          await tx.activityLog.createMany({
            data: activities,
          });

          // Reset streak
          await tx.userStats.upsert({
            where: { id: 1 },
            create: { id: 1, streak: 1, lastSolvedDate: new Date().toLocaleDateString('sv-SE') },
            update: { streak: 1, lastSolvedDate: new Date().toLocaleDateString('sv-SE') },
          });
        });
      }

      // Update sync config in DB
      await prisma.syncConfig.update({
        where: { id: 1 },
        data: {
          leetcodeUser: username,
          leetcodeSession: activeCookie || '',
          lastSyncedAt: new Date(),
          lastSubmissionTimestamp: latestTimestamp,
          isDemoMode,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'full',
        syncedCount: matchedProblems.length,
        isDemoMode,
        hasSessionCookie: !!activeCookie,
        lastSubmissionTimestamp: latestTimestamp,
      });
    }

    // ==========================================
    // ACTION 2: INCREMENTAL SYNC
    // ==========================================
    if (targetAction === 'incremental') {
      console.log(`Starting Incremental Sync for user: ${username}`);
      
      if (config.isDemoMode) {
        return NextResponse.json({
          success: true,
          action: 'incremental',
          message: 'Currently running in Demo Mode. Incremental sync skipped.',
          syncedCount: 0,
        });
      }

      let recentSubs: LeetCodeSubmission[] = [];
      try {
        recentSubs = await fetchRecentSubmissions(username, 20);
      } catch (e: any) {
        console.error('Failed to fetch recent submissions for incremental sync:', e.message);
        return NextResponse.json({ error: 'Failed to query LeetCode GraphQL' }, { status: 502 });
      }

      const newSubs = recentSubs.filter(sub => parseInt(sub.timestamp) > config.lastSubmissionTimestamp);
      console.log(`Found ${newSubs.length} new submissions since last sync.`);

      if (newSubs.length === 0) {
        await prisma.syncConfig.update({
          where: { id: 1 },
          data: { lastSyncedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          action: 'incremental',
          message: 'Already in sync. No new solved problems found.',
          syncedCount: 0,
        });
      }

      const newSlugs = newSubs.map(s => s.titleSlug);
      
      const matchedNewProblems = await prisma.problem.findMany({
        where: {
          titleSlug: { in: newSlugs },
          solved: false,
        },
      });

      let latestTimestamp = config.lastSubmissionTimestamp;
      for (const sub of newSubs) {
        const ts = parseInt(sub.timestamp);
        if (ts > latestTimestamp) {
          latestTimestamp = ts;
        }
      }

      if (matchedNewProblems.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.problem.updateMany({
            where: {
              id: { in: matchedNewProblems.map(p => p.id) },
            },
            data: {
              solved: true,
              solvedAt: new Date(),
              solvedViaDemo: false,
            },
          });

          const activities = matchedNewProblems.map(p => ({
            problemId: p.id,
            action: 'SOLVED',
          }));
          await tx.activityLog.createMany({
            data: activities,
          });

          // Update Streak
          const stats = await tx.userStats.findUnique({ where: { id: 1 } });
          const todayStr = new Date().toLocaleDateString('sv-SE');
          if (stats) {
            let newStreak = stats.streak;
            const lastSolved = stats.lastSolvedDate;

            if (!lastSolved) {
              newStreak = 1;
            } else if (lastSolved !== todayStr) {
              const lastSolvedDateObj = new Date(lastSolved);
              const todayDateObj = new Date(todayStr);
              const diffTime = Math.abs(todayDateObj.getTime() - lastSolvedDateObj.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                newStreak += 1;
              } else {
                newStreak = 1;
              }
            }

            await tx.userStats.update({
              where: { id: 1 },
              data: {
                streak: newStreak,
                lastSolvedDate: todayStr,
              },
            });
          }
        });
      }

      await prisma.syncConfig.update({
        where: { id: 1 },
        data: {
          lastSyncedAt: new Date(),
          lastSubmissionTimestamp: latestTimestamp,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'incremental',
        syncedCount: matchedNewProblems.length,
        lastSubmissionTimestamp: latestTimestamp,
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Error synchronizing with LeetCode:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
