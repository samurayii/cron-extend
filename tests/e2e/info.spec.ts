import fetch from "node-fetch";
import { expect } from "chai";
import jtomler from "jtomler";
import { IAppConfig } from "../../src/lib/config.interfaces";
import * as path from "path";

describe("Healthcheck", () => {

    const config: IAppConfig = <IAppConfig>jtomler.parseFileSync(path.resolve(__dirname, "config.toml"));

    it("GET /healthcheck", async () => {

        const response = await fetch(`http://localhost:${config.api.port}${config.api.prefix}/v1/info`, {
            method: "GET"
        });
        expect(response.status).equal(200);
        const data = await response.json();
        expect(data).to.be.an("array");

    });

});