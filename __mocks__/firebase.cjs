// Minimal Firebase mock — only Firebase-as-types is used in code under test.
// Real Firebase SDK is never called from pure service/utility functions.
module.exports = new Proxy(
  {},
  {
    get: (_, prop) => {
      // Return a no-op class for Timestamp so type-guarded code doesn't crash
      if (prop === "Timestamp") {
        return class Timestamp {
          constructor(seconds, nanoseconds) {
            this.seconds = seconds;
            this.nanoseconds = nanoseconds;
          }
          toDate() {
            return new Date(this.seconds * 1000);
          }
          static fromDate(date) {
            return new Timestamp(Math.floor(date.getTime() / 1000), 0);
          }
        };
      }
      return () => {};
    },
  },
);
