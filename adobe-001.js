class TokenBucket {
    constructor(threshold, allowPerSec) {
        this.threshold = threshold
        this.allowPerSec = allowPerSec
        this.lastAllowed = Math.floor(Date.now() / 1000)
        this.tokens = threshold
    }

    isIntakeAllowed() {
        // Calc how many tokens added sinsce last call
        this.renew()

        if (this.tokens > 0) {
            this.tokens -= 1
            return true
        }
        return false
    }

    renew() {
        const now = Math.floor(Date.now() / 1000)
        const rate = (now - this.lastAllowed) / this.allowPerSec
        this.tokens = Math.min(this.threshold, this.tokens + Math.floor(rate * this.threshold))
        this.lastAllowed = now
    }
}

const express = require('express')
const app = express()

function requestLimiter(perSec, maxBurst) {
    const buckets = new Map()
    return function rateLimitFramework(req, res, next) {
        if (!buckets.has(req.apiKey)) {
            buckets.set(req.apiKey, new TokenBucket(maxBurst, perSec))
        }

        const bucketForApiKey = buckets.get(req.apiKey)
        if (bucketForApiKey.isIntakeAllowed()) {
            next()
        } else {
            res.status(429).send('Too many requests')
        }
    }
}

app.get('/',
    requestLimiter(5, 10),
    (req, res) => {
        res.send('This is a test')
    }
)

app.listen(8080, () => console.log('Express - Up & running'))