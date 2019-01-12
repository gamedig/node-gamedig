class Promises {
    static createTimeout(timeoutMs, timeoutMsg) {
        let cancel = null;
        const wrapped = new Promise((res, rej) => {
            const timeout = setTimeout(
                () => {
                    rej(new Error(timeoutMsg + " - Timed out after " + timeoutMs + "ms"));
                },
                timeoutMs
            );
            cancel = () => {
                clearTimeout(timeout);
            };
        });
        wrapped.cancel = cancel;
        return wrapped;
    }
}

module.exports = Promises;
