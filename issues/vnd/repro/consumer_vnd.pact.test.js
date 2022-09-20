import { Pact } from "@pact-foundation/pact";
import { API } from "./api";
import { Matchers } from "@pact-foundation/pact";
import { Product } from "./product";
const { eachLike, like, regex } = Matchers;

const mockProvider = new Pact({
  consumer: "pactflow-example-consumer-vnd",
  provider: process.env.PACT_PROVIDER
    ? process.env.PACT_PROVIDER
    : "pactflow-example-provider",
});

describe("API Pact test", () => {
  beforeAll(() => mockProvider.setup());
  afterEach(() => mockProvider.verify());
  afterAll(() => mockProvider.finalize());

  describe("retrieving products", () => {
    test("products exists", async () => {
      // set up Pact interactions
      const expectedProduct = {
        id: "10",
        type: "CREDIT_CARD",
        name: "28 Degrees",
        foo: "bar",
      };

      await mockProvider.addInteraction({
        state: "products exist",
        uponReceiving: "a request to get all products",
        withRequest: {
          method: "GET",
          path: "/products",
          headers: {
            Authorization: like("Bearer 2019-01-14T11:34:18.045Z"),
          },
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
          body: eachLike(expectedProduct),
        },
      });

      const api = new API(mockProvider.mockService.baseUrl);

      // make request to Pact mock server
      const products = await api.getAllProducts();

      // assert that we got the expected response
      expect(products).toStrictEqual([new Product(expectedProduct)]);
    });
  });
});
