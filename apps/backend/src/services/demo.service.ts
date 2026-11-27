import { randomBytes } from 'node:crypto';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';
import { generateInviteCode } from '../lib/crypto.js';

/**
 * Demo workspace for showcasing Syncro.
 *
 * The demo users get a random, never-stored password, so nobody can sign in to
 * them with a password — only through POST /auth/demo (enabled with
 * DEMO_LOGIN=true). Re-seeding wipes and rebuilds everything so each run starts
 * from the same believable "Tuesday afternoon" state.
 */
export const DEMO_OWNER_EMAIL = 'demo.owner@syncro.demo';
const DEMO_TEAM = [
  { email: DEMO_OWNER_EMAIL, name: 'Aarav Mehta', role: 'OWNER' as const },
  { email: 'demo.priya@syncro.demo', name: 'Priya Sharma', role: 'ADMIN' as const },
  { email: 'demo.rohan@syncro.demo', name: 'Rohan Iyer', role: 'MEMBER' as const },
  { email: 'demo.sara@syncro.demo', name: 'Sara Khan', role: 'MEMBER' as const },
];

const H = 3600_000;
const M = 60_000;

export async function seedDemoWorkspace() {
  // Fresh start: removing the users cascades to their workspace data.
  const emails = DEMO_TEAM.map((u) => u.email);
  const old = await prisma.workspaceMember.findMany({
    where: { user: { email: { in: emails } }, role: 'OWNER' },
    select: { workspaceId: true },
  });
  await prisma.workspace.deleteMany({ where: { id: { in: old.map((o) => o.workspaceId) } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });

  const passwordHash = await hashPassword(randomBytes(24).toString('hex'));
  const users = await Promise.all(DEMO_TEAM.map((u) => prisma.user.create({ data: { email: u.email, name: u.name, passwordHash } })));
  const [aarav, priya, rohan, sara] = users as [typeof users[0], typeof users[0], typeof users[0], typeof users[0]];

  const ws = await prisma.workspace.create({
    data: {
      name: 'Orbit Labs · Launch',
      slug: `orbit-launch-${randomBytes(3).toString('hex')}`,
      inviteCode: generateInviteCode(),
      members: { create: DEMO_TEAM.map((u, i) => ({ userId: users[i]!.id, role: u.role })) },
    },
  });

  const now = Date.now();
  const day = (d: number) => new Date(new Date(now + d * 86_400_000).toISOString().slice(0, 10) + 'T00:00:00.000Z');

  type Seed = {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    who: typeof aarav;
    label: string;
    due?: number;
    est?: number;
    desc?: string;
    checklist?: [string, boolean][];
  };
  const seeds: Seed[] = [
    { title: 'Pricing page copy & layout', status: 'TODO', priority: 'MEDIUM', who: sara, label: 'Marketing', due: 4, est: 180 },
    { title: 'Onboarding email sequence', status: 'TODO', priority: 'LOW', who: priya, label: 'Growth', due: 6 },
    { title: 'Fix flaky payment webhook test', status: 'TODO', priority: 'URGENT', who: rohan, label: 'Backend', due: -1, est: 90 },
    { title: 'Accessibility pass on forms', status: 'TODO', priority: 'HIGH', who: sara, label: 'Frontend', due: 3 },
    {
      title: 'Checkout flow redesign',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      who: aarav,
      label: 'Design',
      due: 2,
      est: 480,
      desc: 'One-page checkout with saved cards. Match the new design tokens.',
      checklist: [
        ['Audit current drop-off', true],
        ['Wireframes', true],
        ['Hi-fi mockups', true],
        ['Usability test with 5 users', false],
        ['Hand-off to engineering', false],
      ],
    },
    {
      title: 'Realtime notifications service',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      who: rohan,
      label: 'Backend',
      due: 1,
      est: 360,
      checklist: [
        ['Event schema', true],
        ['WebSocket fan-out', true],
        ['Retry + dead letter queue', false],
      ],
    },
    { title: 'Mobile nav polish', status: 'IN_PROGRESS', priority: 'MEDIUM', who: sara, label: 'Frontend', due: 3, est: 120 },
    {
      title: 'Q3 analytics dashboard',
      status: 'REVIEW',
      priority: 'HIGH',
      who: priya,
      label: 'Data',
      est: 300,
      checklist: [
        ['Metrics spec', true],
        ['Charts', true],
        ['Review with leads', false],
      ],
    },
    { title: 'API rate limiting', status: 'REVIEW', priority: 'MEDIUM', who: rohan, label: 'Backend', est: 150 },
    { title: 'Brand illustration set', status: 'DONE', priority: 'LOW', who: sara, label: 'Design' },
    { title: 'SSO with Google Workspace', status: 'DONE', priority: 'HIGH', who: priya, label: 'Backend' },
    { title: 'Launch announcement draft', status: 'DONE', priority: 'MEDIUM', who: aarav, label: 'Marketing' },
  ];

  const tasks: Prisma.TaskGetPayload<object>[] = [];
  const positions: Record<string, number> = {};
  for (const s of seeds) {
    const position = (positions[s.status] = (positions[s.status] ?? -1024) + 1024);
    tasks.push(
      await prisma.task.create({
        data: {
          workspaceId: ws.id,
          title: s.title,
          description: s.desc,
          status: s.status,
          priority: s.priority,
          label: s.label,
          position,
          estimateMinutes: s.est,
          dueDate: s.due !== undefined ? day(s.due) : null,
          completedAt: s.status === 'DONE' ? new Date(now - (2 + tasks.length) * H) : null,
          assigneeId: s.who.id,
          createdById: aarav.id,
          checklist: s.checklist && { create: s.checklist.map(([text, done], i) => ({ text, done, position: i * 1024 })) },
        },
      })
    );
  }
  const byTitle = (t: string) => tasks.find((x) => x.title === t)!;

  await prisma.taskComment.createMany({
    data: [
      { taskId: byTitle('Checkout flow redesign').id, authorId: priya.id, body: 'Love the single-page approach. Can we keep Apple Pay above the fold?', createdAt: new Date(now - 3 * H) },
      { taskId: byTitle('Checkout flow redesign').id, authorId: aarav.id, body: 'Yes — moved it up in v3. Testing with users tomorrow 🙌', createdAt: new Date(now - 2 * H) },
      { taskId: byTitle('Realtime notifications service').id, authorId: rohan.id, body: 'Fan-out works locally at ~8ms p95. DLQ next.', createdAt: new Date(now - 90 * M) },
      { taskId: byTitle('Q3 analytics dashboard').id, authorId: aarav.id, body: 'Looks great. One question on the churn definition, left a note.', createdAt: new Date(now - 40 * M) },
    ],
  });

  // A week of tracked time (weekdays), plus two people on the clock right now.
  const entries: Prisma.TimeEntryCreateManyInput[] = [];
  const work: [typeof aarav, string[]][] = [
    [aarav, ['Checkout flow redesign', 'Launch announcement draft']],
    [priya, ['Q3 analytics dashboard', 'SSO with Google Workspace']],
    [rohan, ['Realtime notifications service', 'API rate limiting', 'Fix flaky payment webhook test']],
    [sara, ['Mobile nav polish', 'Brand illustration set', 'Accessibility pass on forms']],
  ];
  for (let d = 6; d >= 1; d--) {
    const date = new Date(now - d * 86_400_000);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    work.forEach(([u, titles], ui) => {
      let start = new Date(date);
      start.setHours(9 + (ui % 2), 10 * ui, 0, 0);
      for (let k = 0; k < 2; k++) {
        const minutes = 70 + ((d * 41 + ui * 29 + k * 53) % 140);
        const t = byTitle(titles[(d + k) % titles.length]!);
        entries.push({ userId: u.id, workspaceId: ws.id, taskId: t.id, startedAt: start, endedAt: new Date(start.getTime() + minutes * M) });
        start = new Date(start.getTime() + (minutes + 45) * M);
      }
    });
  }
  // Earlier today
  work.forEach(([u, titles], ui) => {
    const start = new Date(now - (4 + ui * 0.5) * H);
    entries.push({ userId: u.id, workspaceId: ws.id, taskId: byTitle(titles[0]!).id, startedAt: start, endedAt: new Date(start.getTime() + (80 + ui * 15) * M) });
  });
  // Live right now
  entries.push({ userId: rohan.id, workspaceId: ws.id, taskId: byTitle('Realtime notifications service').id, startedAt: new Date(now - 47 * M) });
  entries.push({ userId: sara.id, workspaceId: ws.id, taskId: byTitle('Mobile nav polish').id, startedAt: new Date(now - 18 * M) });
  await prisma.timeEntry.createMany({ data: entries });

  const at = (ms: number) => {
    const d = new Date(now + ms);
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
    return d;
  };
  await prisma.meeting.createMany({
    data: [
      { workspaceId: ws.id, createdById: priya.id, title: 'Sprint planning', provider: 'INSTANT', joinUrl: `https://meet.jit.si/Syncro-orbit-${randomBytes(4).toString('hex')}`, startsAt: at(2 * H), durationMinutes: 45 },
      { workspaceId: ws.id, createdById: aarav.id, title: 'Checkout usability test', provider: 'INSTANT', joinUrl: `https://meet.jit.si/Syncro-orbit-${randomBytes(4).toString('hex')}`, startsAt: at(26 * H), durationMinutes: 60, taskId: byTitle('Checkout flow redesign').id },
      { workspaceId: ws.id, createdById: rohan.id, title: 'Backend sync', provider: 'INSTANT', joinUrl: `https://meet.jit.si/Syncro-orbit-${randomBytes(4).toString('hex')}`, startsAt: new Date(now - 26 * H), durationMinutes: 30 },
    ],
  });

  await prisma.commit.createMany({
    data: [
      ['a1f9c2e', 'feat(notify): websocket fan-out with backpressure', rohan, 3],
      ['7be41d0', 'fix(forms): label association for screen readers', sara, 5],
      ['c03d8aa', 'feat(analytics): churn + retention charts', priya, 20],
      ['5e2f7b1', 'chore: bump design tokens to v3', aarav, 26],
    ].map(([sha, message, u, hAgo]) => ({
      workspaceId: ws.id,
      sha: sha as string,
      message: message as string,
      branch: 'main',
      authorId: (u as typeof aarav).id,
      authorName: (u as typeof aarav).name,
      committedAt: new Date(now - (hAgo as number) * H),
    })),
  });

  const act = (actor: typeof aarav, type: Prisma.ActivityRecordCreateManyInput['type'], summary: string, minsAgo: number) => ({
    workspaceId: ws.id,
    actorId: actor.id,
    type,
    summary,
    createdAt: new Date(now - minsAgo * M),
  });
  await prisma.activityRecord.createMany({
    data: [
      act(aarav, 'WORKSPACE_CREATED', 'created workspace "Orbit Labs · Launch"', 60 * 24 * 7),
      act(priya, 'TASK_COMPLETED', 'completed task "SSO with Google Workspace"', 60 * 5),
      act(aarav, 'TASK_COMPLETED', 'completed task "Launch announcement draft"', 60 * 3),
      act(priya, 'TASK_STATUS_CHANGED', 'moved "Q3 analytics dashboard" from In Progress to Review', 60 * 2),
      act(aarav, 'COMMENT_ADDED', 'commented on "Checkout flow redesign"', 120),
      act(rohan, 'TIMER_STARTED', 'started working on "Realtime notifications service"', 47),
      act(aarav, 'COMMENT_ADDED', 'commented on "Q3 analytics dashboard"', 40),
      act(sara, 'TIMER_STARTED', 'started working on "Mobile nav polish"', 18),
    ],
  });

  return { workspaceId: ws.id, ownerId: aarav.id };
}
