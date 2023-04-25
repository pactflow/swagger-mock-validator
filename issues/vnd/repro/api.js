import axios from "axios";
import adapter from "axios/lib/adapters/http";
import { Product } from "./product";

axios.defaults.adapter = adapter;

export class API {
  constructor(url) {
    if (url === undefined || url === "") {
      url = process.env.REACT_APP_API_BASE_URL;
    }
    if (url.endsWith("/")) {
      url = url.substr(0, url.length - 1);
    }
    this.url = url;
  }

  withPath(path) {
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    return `${this.url}${path}`;
  }

  generateAuthToken() {
    return "Bearer " + new Date().toISOString();
  }

  async getAllProducts() {
    return axios
      .get(this.withPath("/products"), {
        headers: {
          Accept:        "application/json",
          Authorization: this.generateAuthToken(),
        },
      })
      .then((r) => r.data.map((p) => new Product(p)));
  }

  async getAllVndProducts() {
    return axios
      .get(this.withPath("/products"), {
        headers: {
          Accept:        "application/vnd.api+json",
          Authorization: this.generateAuthToken(),
        },
      })
      .then((r) => r.data.map(
        (p) => new Product(
          {
            id:   p["data"]["id"],
            type: p["data"]["type"],
            name: p["data"]["attributes"]["name"]
          }          
        )
      ));
  }
}

export default new API(
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"
);
