import { Command } from "commander";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as Ajv from "ajv";
import jtomler from "jtomler";
import json_from_schema from "json-from-default-schema";
import * as config_schema from "./schemes/config.json";
import { IAppConfig } from "./config.interfaces";

type TPackage = {
    [key: string]: unknown
}

const findPkg = (): TPackage => {

    const cwd_pkg_full_path = path.resolve(process.cwd(), "package.json");
    const dirname_pkg_full_path = path.resolve(__dirname, "package.json");
    const app_pkg_full_path = path.resolve(path.dirname(process.argv[1]), "package.json");
    const require_pkg_full_path = path.resolve(path.dirname(require.main.filename), "package.json"); 

    if (fs.existsSync(dirname_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(dirname_pkg_full_path).toString());
    }
    if (fs.existsSync(app_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(app_pkg_full_path).toString());
    }
    if (fs.existsSync(require_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(require_pkg_full_path).toString());
    }   
    if (fs.existsSync(cwd_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(cwd_pkg_full_path).toString());
    }

};

const program = new Command();
const pkg = findPkg();

if (pkg === undefined) {
    console.error(`${chalk.red("ERROR")} package.json not found`);
    process.exit(1);
}

program.version(`${<string>pkg.name} version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(<string>pkg.name);
program.option("-c, --config <type>", "Path to config file.");

program.parse(process.argv);

const options = program.opts();

if (process.env["CRON_EXTEND_CONFIG_PATH"] === undefined) {
	if (options.config === undefined) {
		console.error(`${chalk.red("ERROR")} Not set --config key`);
		process.exit(1);
	}
} else {
	options.config = process.env["CRON_EXTEND_CONFIG_PATH"];
}

const full_config_path = path.resolve(process.cwd(), options.config);

if (!fs.existsSync(full_config_path)) {
    console.error(`${chalk.red("ERROR")} Config file ${full_config_path} not found`);
    process.exit(1);
}

const config: IAppConfig = <IAppConfig>json_from_schema(jtomler.parseFileSync(full_config_path), config_schema);

const ajv = new Ajv();
const validate = ajv.compile(config_schema);

if (!validate(config)) {
    console.error(`${chalk.red("ERROR")} Config schema errors:`);
    for (const item of validate.errors) {
        console.error(`  - Key ${chalk.yellow(item.dataPath.replace(/\./g, ""))} ${item.message}`);
    }
    process.exit(1);
}

config.api.prefix = `/${config.api.prefix.replace(/(^\/|\/$)/g,"")}`;

export default config;