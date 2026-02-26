import { createRouter } from '../packages/core/src/index.js';
import { GaoResponse, GaoRequest } from '../packages/http/src/index.js';

/**
 * Basic Router Benchmark
 * 
 * Measures the time taken to match and execute 1,000,000 routes.
 */

const router = createRouter();

// Register 100 routes
for (let i = 0; i < 100; i++) {
    router.get(`/api/v1/users/${i}/profile`, (req: any, res: GaoResponse) => {
        return res.json({ id: i });
    });
}

// Add a parameterized route
router.get('/api/v1/posts/:postId/comments/:commentId', (req: any, res: GaoResponse) => {
    return res.json({ postId: req.params.postId, commentId: req.params.commentId });
});

async function runBenchmark() {
    const iterations = 1000000;
    console.log(`🚀 Starting Router Benchmark (${iterations.toLocaleString()} iterations)...`);

    const staticReq = new Request('http://localhost/api/v1/users/50/profile');
    const gaoReqStatic = new GaoRequest(staticReq);
    const gaoRes = new GaoResponse();

    const paramReq = new Request('http://localhost/api/v1/posts/123/comments/456');
    const gaoReqParam = new GaoRequest(paramReq);

    // Static Route Match
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const match = router.match('GET', '/api/v1/users/50/profile');
        // match.handler(gaoReqStatic, gaoRes); // skip execution to measure just matching
    }
    let end = performance.now();
    console.log(`✅ Static Route Match: ${((iterations / (end - start)) * 1000).toFixed(2)} ops/sec`);

    // Parametric Route Match
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const match = router.match('GET', '/api/v1/posts/123/comments/456');
    }
    end = performance.now();
    console.log(`✅ Parametric Route Match: ${((iterations / (end - start)) * 1000).toFixed(2)} ops/sec`);
}

runBenchmark().catch(console.error);
