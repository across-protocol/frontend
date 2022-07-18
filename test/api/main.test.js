const handler = require("../../api/health");

test("serverless function is alive", async () => {
  const response = {};
  response.status = jest.fn().mockReturnValue(response);
  response.send = jest.fn();
  const request = {};
  await handler(request, response);
  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.send).toHaveBeenCalledWith("Ok");
});
