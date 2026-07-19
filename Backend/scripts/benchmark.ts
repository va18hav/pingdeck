import { Queue, QueueEvents } from 'bullmq';
import { PrismaClient } from 'db';
import dotenv from 'dotenv';

dotenv.config();

// Match connection configuration pattern used in queue.ts
const getRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const parsed = new URL(redisUrl);
            return {
                host: parsed.hostname,
                port: parsed.port ? parseInt(parsed.port, 10) : 6379,
                username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
                password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
                tls: parsed.protocol === 'rediss:' ? {} : undefined,
                enableOfflineQueue: false
            };
        } catch (err) {
            // Fallback
        }
    }
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        enableOfflineQueue: false
    };
};

const connection = getRedisConnection();
const jobQueue = new Queue('jobs-queue', { connection });
const queueEvents = new QueueEvents('jobs-queue', { connection });

const prisma = new PrismaClient();

async function runBenchmark() {
    const NUM_JOBS = 1000; // Batch size to enqueue
    console.log(`\n🚀 Starting worker throughput benchmark with ${NUM_JOBS} jobs...`);

    // 1. Ensure a benchmark user, project and endpoint exist in DB
    let user = await prisma.user.findFirst({ where: { email: 'benchmark@test.com' } });
    if (!user) {
        user = await prisma.user.create({
            data: { email: 'benchmark@test.com', password: 'hashedpassword' }
        });
    }

    let project = await prisma.project.findFirst({ where: { userId: user.id } });
    if (!project) {
        project = await prisma.project.create({
            data: { name: 'Benchmark Project', userId: user.id }
        });
    }

    let endpoint = await prisma.endpoint.findFirst({ where: { projectId: project.id } });
    if (!endpoint) {
        endpoint = await prisma.endpoint.create({
            data: {
                name: 'Local Target',
                url: 'http://localhost:3000/metrics', // Using local metrics endpoint to isolate database/worker limits
                method: 'GET',
                projectId: project.id
            }
        });
    }

    console.log(`📦 Verification done. Target Endpoint ID: ${endpoint.id}`);

    // Clean out queue before test
    await jobQueue.drain();

    const jobs = [];
    console.log(`✍️ Adding ${NUM_JOBS} jobs to BullMQ queue...`);
    for (let i = 0; i < NUM_JOBS; i++) {
        jobs.push({
            name: 'ping_endpoint',
            data: {
                payload: {
                    endpointId: endpoint.id,
                    isTest: true // using test context to isolate performance
                },
                userId: user.id
            }
        });
    }

    const startEnqueuing = Date.now();
    // Add bulk jobs to Redis
    await jobQueue.addBulk(jobs);
    const endEnqueuing = Date.now();
    console.log(`✅ Bulk add completed in ${endEnqueuing - startEnqueuing}ms`);

    console.log('⏱️ Monitoring queue depletion. Waiting for worker to complete jobs...');
    const startProcessing = Date.now();

    // Check count periodically until empty
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            const counts = await jobQueue.getJobCounts('waiting', 'active');
            const totalRemaining = counts.waiting + counts.active;
            
            console.log(`   └─ Remaining: ${totalRemaining} (Waiting: ${counts.waiting}, Active: ${counts.active})`);
            
            if (totalRemaining === 0) {
                clearInterval(interval);
                const endProcessing = Date.now();
                const totalDuration = (endProcessing - startProcessing) / 1000;
                const throughput = NUM_JOBS / totalDuration;
                
                console.log('\n🏁 Benchmark Results:');
                console.log(`=============================`);
                console.log(`Total Jobs Processed: ${NUM_JOBS}`);
                console.log(`Time Taken          : ${totalDuration.toFixed(2)} seconds`);
                console.log(`Throughput          : ${throughput.toFixed(2)} jobs/sec`);
                console.log(`=============================`);
                resolve(true);
            }
        }, 1000);
    });
}

runBenchmark()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await jobQueue.close();
        await queueEvents.close();
        process.exit(0);
    });
