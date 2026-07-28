import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET problem details with companies featuring it
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        companies: {
          select: {
            frequency: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Format companies list
    const companies = problem.companies.map(cp => ({
      id: cp.company.id,
      name: cp.company.name,
      slug: cp.company.slug,
      frequency: cp.frequency,
    })).sort((a, b) => b.frequency - a.frequency);

    return NextResponse.json({
      id: problem.id,
      title: problem.title,
      url: problem.url,
      difficulty: problem.difficulty,
      solved: problem.solved,
      solvedAt: problem.solvedAt,
      notes: problem.notes || '',
      bookmarked: problem.bookmarked,
      companies,
    });
  } catch (error: any) {
    console.error('Error fetching problem details:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// PATCH update problem status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 });
    }

    const body = await request.json();
    const { solved, bookmarked, notes } = body;

    // Check if problem exists
    const existingProblem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!existingProblem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    let solvedStateChanged = false;
    let newSolvedState = false;

    if (solved !== undefined) {
      return NextResponse.json(
        { error: 'Manual marking is disabled. Solved status is updated automatically via LeetCode sync.' },
        { status: 400 }
      );
    }

    if (bookmarked !== undefined) {
      dataToUpdate.bookmarked = bookmarked;
    }

    if (notes !== undefined) {
      dataToUpdate.notes = notes;
    }

    // Perform transaction to update problem, log activity, and update streak
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the problem
      const updated = await tx.problem.update({
        where: { id },
        data: dataToUpdate,
      });

      // 2. If solved state changed, log activity and calculate streak
      if (solvedStateChanged) {
        await tx.activityLog.create({
          data: {
            problemId: id,
            action: newSolvedState ? 'SOLVED' : 'UNSOLVED',
          },
        });

        if (newSolvedState) {
          // Increment/update streak
          const stats = await tx.userStats.findUnique({ where: { id: 1 } });
          const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
          
          if (stats) {
            let newStreak = stats.streak;
            const lastSolved = stats.lastSolvedDate;

            if (!lastSolved) {
              newStreak = 1;
            } else if (lastSolved === todayStr) {
              // Already solved today
            } else {
              // Check if lastSolved was yesterday
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
        }
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating problem:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
