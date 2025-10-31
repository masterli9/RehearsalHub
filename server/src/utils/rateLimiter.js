class TokenBucket {
    constructor({ capacity, refillAmount, refillIntervalMs }) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillAmount = refillAmount;
        this.refillIntervalMs = refillIntervalMs;
        this.lastRefill = Date.now();
    }

    _refillNow() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        if (elapsed >= this.refillIntervalMs) {
            const intervals = Math.floor(elapsed / this.refillIntervalMs);
            const add = intervals * this.refillAmount;
            this.tokens = Math.min(this.capacity, this.tokens + add);
            this.lastRefill += intervals * this.refillIntervalMs;
        }
    }
    tryRemove(n = 1) {
        this._refillNow();
        if (this.tokens >= n) {
            this.tokens -= n;
            return true;
        }
        return false;
    }
}

export default TokenBucket;
