import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to check if a path is a directory
const isDirectory = (source: string) => fs.lstatSync(source).isDirectory();

// Helper to format company slug to readable name
function formatCompanyName(slug: string): string {
  const overrides: Record<string, string> = {
    '1kosmos': '1Kosmos',
    '6sense': '6sense',
    'bill-com': 'Bill.com',
    'coindcx': 'CoinDCX',
    'cred': 'CRED',
    'drw': 'DRW',
    'ey': 'EY',
    'hrt': 'HRT',
    'hpe': 'HPE',
    'ibm': 'IBM',
    'imc': 'IMC',
    'ivp': 'IVP',
    'ixl': 'IXL',
    'jpmorgan': 'JPMorgan',
    'kotak-mahindra-bank': 'Kotak Mahindra Bank',
    'lowe': 'Lowe\'s',
    'lowes': 'Lowe\'s',
    'ncr': 'NCR',
    'npci': 'NPCI',
    'ola': 'Ola',
    'oyo': 'OYO',
    'pwc': 'PwC',
    'sig': 'SIG',
    'tcs': 'TCS',
    'ubs': 'UBS',
    'ukg': 'UKG',
    'unbxd': 'Unbxd',
    'ust': 'UST',
    'vimeo': 'Vimeo',
    'vk': 'VK',
    'wipro': 'Wipro',
    'wix': 'Wix',
    'zoho': 'Zoho',
  };

  const lower = slug.toLowerCase();
  if (overrides[lower]) {
    return overrides[lower];
  }

  return slug
    .split('-')
    .map(word => {
      if (['of', 'and', 'the', 'for', 'to', 'in', 'by'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

interface ProblemCSVRow {
  ID: string;
  URL: string;
  Title: string;
  Difficulty: string;
  'Acceptance %'?: string;
  'Frequency %'?: string;
}

async function main() {
  console.log('Starting SQLite seeding...');
  const startTime = Date.now();

  // The workspace root is the parent of the frontend folder
  const workspaceRoot = path.resolve(__dirname, '../../');
  console.log(`Workspace root path: ${workspaceRoot}`);

  // List all directories in workspace root
  const allItems = fs.readdirSync(workspaceRoot);
  const companySlugs: string[] = [];

  const excludeDirs = new Set([
    'node_modules',
    '.git',
    '.github',
    '.next',
    '.vscode',
    'frontend',
    'src',
    'target',
    'bin',
    'out',
    '.gemini',
    'prisma',
    '.idea',
    'build',
    'gradle',
  ]);

  for (const item of allItems) {
    const itemPath = path.join(workspaceRoot, item);
    if (!excludeDirs.has(item) && isDirectory(itemPath)) {
      // Check if it has at least one CSV file
      const files = fs.readdirSync(itemPath);
      const hasCSV = files.some(file => file.endsWith('.csv'));
      if (hasCSV) {
        companySlugs.push(item);
      }
    }
  }

  console.log(`Found ${companySlugs.length} company folders containing CSV files.`);

  // Maps to store parsed entities in memory for duplicate detection
  const problemsMap = new Map<number, {
    id: number;
    title: string;
    url: string;
    titleSlug: string;
    difficulty: string;
    acceptance: number;
  }>();

  interface CompanyProblemTemp {
    companySlug: string;
    problemId: number;
    frequency: number;
    inThirtyDays: boolean;
    inThreeMonths: boolean;
    inSixMonths: boolean;
    inMoreThanSixMonths: boolean;
    inAll: boolean;
  }

  const companyProblemsMap = new Map<string, CompanyProblemTemp>();
  const companiesToCreate = companySlugs.map(slug => ({
    slug,
    name: formatCompanyName(slug),
  }));

  console.log('Parsing CSV files...');
  let processedFilesCount = 0;

  for (const slug of companySlugs) {
    const companyPath = path.join(workspaceRoot, slug);
    const files = fs.readdirSync(companyPath).filter(f => f.endsWith('.csv'));

    for (const file of files) {
      processedFilesCount++;
      const filePath = path.join(companyPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const category = path.parse(file).name; // 'thirty-days', 'three-months', etc.

      const parsed = Papa.parse<ProblemCSVRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      for (const row of parsed.data) {
        const id = parseInt(row.ID);
        if (isNaN(id)) continue;

        const title = row.Title ? row.Title.trim() : `Problem #${id}`;
        const url = row.URL ? row.URL.trim() : `https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const difficulty = row.Difficulty ? row.Difficulty.trim() : 'Medium';
        
        let acceptance = 0.0;
        if (row['Acceptance %']) {
          acceptance = parseFloat(row['Acceptance %'].replace('%', ''));
          if (isNaN(acceptance)) acceptance = 0.0;
        }

        let frequency = 0.0;
        if (row['Frequency %']) {
          frequency = parseFloat(row['Frequency %'].replace('%', ''));
          if (isNaN(frequency)) frequency = 0.0;
        }

        const titleSlug = url.split('/problems/')[1]?.split('/')[0] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Store problem once
        if (!problemsMap.has(id)) {
          problemsMap.set(id, {
            id,
            title,
            url,
            titleSlug,
            difficulty,
            acceptance,
          });
        }

        // Create junction record
        const junctionKey = `${slug}_${id}`;
        const isThirty = category === 'thirty-days';
        const isThree = category === 'three-months';
        const isSix = category === 'six-months';
        const isMoreThanSix = category === 'more-than-six-months';
        const isAll = category === 'all';

        const existing = companyProblemsMap.get(junctionKey);
        if (!existing) {
          companyProblemsMap.set(junctionKey, {
            companySlug: slug,
            problemId: id,
            frequency,
            inThirtyDays: isThirty,
            inThreeMonths: isThree,
            inSixMonths: isSix,
            inMoreThanSixMonths: isMoreThanSix,
            inAll: isAll,
          });
        } else {
          existing.frequency = Math.max(existing.frequency, frequency);
          if (isThirty) existing.inThirtyDays = true;
          if (isThree) existing.inThreeMonths = true;
          if (isSix) existing.inSixMonths = true;
          if (isMoreThanSix) existing.inMoreThanSixMonths = true;
          if (isAll) existing.inAll = true;
        }
      }
    }
  }

  console.log(`Parsed ${processedFilesCount} files. Created ${problemsMap.size} unique problems in memory.`);

  // Write to DB
  console.log('Writing to database...');

  // Clean current tables in case of re-run
  await prisma.companyProblem.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.company.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.syncConfig.deleteMany();

  // Create single user settings and sync settings
  await prisma.userStats.create({
    data: { id: 1, streak: 0, lastSolvedDate: null },
  });
  await prisma.syncConfig.create({
    data: { id: 1, leetcodeUser: '', lastSyncedAt: null },
  });

  // 1. Create Companies in bulk
  console.log('Inserting companies...');
  await prisma.company.createMany({
    data: companiesToCreate,
  });

  const dbCompanies = await prisma.company.findMany();
  const slugToIdMap = new Map<string, number>();
  for (const c of dbCompanies) {
    slugToIdMap.set(c.slug, c.id);
  }

  // 2. Create Problems in batches
  console.log('Inserting problems...');
  const problemsArray = Array.from(problemsMap.values());
  const batchSize = 1000;
  for (let i = 0; i < problemsArray.length; i += batchSize) {
    const batch = problemsArray.slice(i, i + batchSize);
    await prisma.problem.createMany({
      data: batch,
    });
  }

  // 3. Create CompanyProblems in batches
  console.log('Inserting company problem relations...');
  const relationsArray = Array.from(companyProblemsMap.values()).map(rel => ({
    companyId: slugToIdMap.get(rel.companySlug)!,
    problemId: rel.problemId,
    frequency: rel.frequency,
    inThirtyDays: rel.inThirtyDays,
    inThreeMonths: rel.inThreeMonths,
    inSixMonths: rel.inSixMonths,
    inMoreThanSixMonths: rel.inMoreThanSixMonths,
    inAll: rel.inAll,
  }));

  for (let i = 0; i < relationsArray.length; i += batchSize) {
    const batch = relationsArray.slice(i, i + batchSize);
    await prisma.companyProblem.createMany({
      data: batch,
    });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Database seeding completed successfully in ${duration}s!`);
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
