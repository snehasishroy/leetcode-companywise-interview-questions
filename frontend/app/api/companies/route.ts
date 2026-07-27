import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const filter = searchParams.get('filter') || 'all'; // 'all', 'completed', 'in-progress', 'not-started'
    const sort = searchParams.get('sort') || 'alphabetical'; // 'alphabetical', 'most-complete', 'least-complete', 'most-remaining'

    // Fetch companies and their problems
    const companies = await prisma.company.findMany({
      include: {
        problems: {
          select: {
            frequency: true,
            problem: {
              select: {
                id: true,
                title: true,
                url: true,
                difficulty: true,
                solved: true,
              },
            },
          },
        },
      },
    });

    // Map stats in memory
    const formattedCompanies = companies.map(company => {
      const problems = company.problems;
      const totalProblems = problems.length;
      const solvedProblems = problems.filter(p => p.problem.solved).length;
      const completionPercentage = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;
      const remainingProblems = totalProblems - solvedProblems;

      // Find the first unsolved problem sorted by frequency descending
      const firstUnsolved = problems
        .filter(p => !p.problem.solved)
        .sort((a, b) => b.frequency - a.frequency)[0]?.problem || null;

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        totalProblems,
        solvedProblems,
        completionPercentage,
        remainingProblems,
        firstUnsolved: firstUnsolved ? {
          id: firstUnsolved.id,
          title: firstUnsolved.title,
          url: firstUnsolved.url,
          difficulty: firstUnsolved.difficulty,
        } : null,
      };
    });

    // Apply filters
    let filteredCompanies = formattedCompanies;
    if (search) {
      filteredCompanies = filteredCompanies.filter(c => c.name.toLowerCase().includes(search));
    }

    if (filter === 'completed') {
      filteredCompanies = filteredCompanies.filter(c => c.solvedProblems === c.totalProblems && c.totalProblems > 0);
    } else if (filter === 'in-progress') {
      filteredCompanies = filteredCompanies.filter(c => c.solvedProblems > 0 && c.solvedProblems < c.totalProblems);
    } else if (filter === 'not-started') {
      filteredCompanies = filteredCompanies.filter(c => c.solvedProblems === 0);
    }

    // Apply sorting
    if (sort === 'alphabetical') {
      filteredCompanies.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'most-complete') {
      filteredCompanies.sort((a, b) => {
        if (b.completionPercentage !== a.completionPercentage) {
          return b.completionPercentage - a.completionPercentage;
        }
        return b.solvedProblems - a.solvedProblems; // fallback to count
      });
    } else if (sort === 'least-complete') {
      filteredCompanies.sort((a, b) => {
        if (a.completionPercentage !== b.completionPercentage) {
          return a.completionPercentage - b.completionPercentage;
        }
        return a.solvedProblems - b.solvedProblems;
      });
    } else if (sort === 'most-remaining') {
      filteredCompanies.sort((a, b) => b.remainingProblems - a.remainingProblems);
    }

    return NextResponse.json(filteredCompanies);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
