//delay promise

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TestResponse = string[];

export default defineEventHandler<void, TestResponse>(async () => {
  await wait(1000);

  return await Promise.resolve(["A", "B", "C"]);
});
