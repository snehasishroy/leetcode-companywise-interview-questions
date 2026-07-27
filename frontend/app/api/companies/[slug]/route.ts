import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        problems: {
          select: {
            frequency: true,
            inThirtyDays: true,
            inThreeMonths: true,
            inSixMonths: true,
            inMoreThanSixMonths: true,
            inAll: true,
            problem: {
              select: {
                id: true,
                title: true,
                url: true,
                difficulty: true,
                solved: true,
                notes: true,
                bookmarked: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Format problems
    const problems = company.problems.map(cp => ({
      id: cp.problem.id,
      title: cp.problem.title,
      url: cp.problem.url,
      difficulty: cp.problem.difficulty,
      solved: cp.problem.solved,
      notes: cp.problem.notes || '',
      bookmarked: cp.problem.bookmarked,
      frequency: cp.frequency,
      categories: {
        thirtyDays: cp.inThirtyDays,
        threeMonths: cp.inThreeMonths,
        sixMonths: cp.inSixMonths,
        moreThanSixMonths: cp.inMoreThanSixMonths,
        all: cp.inAll,
      },
    }));

    // Sort by frequency descending
    problems.sort((a, b) => b.frequency - a.frequency);

    const totalProblems = problems.length;
    const solvedProblems = problems.filter(p => p.solved).length;
    const completionPercentage = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;

    // Find first unsolved problem for Continue Learning
    const firstUnsolved = problems.find(p => !p.solved) || null;

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      stats: {
        totalProblems,
        solvedProblems,
        completionPercentage,
        remainingProblems: totalProblems - solvedProblems,
      },
      firstUnsolved,
      problems,
    });
  } catch (error: any) {
    console.error('Error fetching company details:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
