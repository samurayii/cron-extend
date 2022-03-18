import { IFastifySmallLogger } from "fastify-small-logger";
import { ICronJobManager, ICronJobManagerJob, ICronJobManagerJobConfig, ICronJobManagerConfig, ICronJobManagerJobInfo, ICronJobManagerJobStatus } from "./interfaces";
import * as job_schema from "./lib/job_schema.json";
import * as Ajv from "ajv";
import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import jtomler from "jtomler";
import * as clone from "clone";
import json_from_schema from "json-from-default-schema";
import { CronJobManagerJob } from "./lib/job";

export * from "./interfaces";

const ajv = new Ajv();
const validate_job_schema = ajv.compile(job_schema);

const getJobsFilesList = (folder: string, files_list: string[]  = []) => {

    const files = fs.readdirSync(folder);

    for (const file_path of files) {
        const full_file_path = path.resolve(folder, file_path);
        const stat = fs.statSync(full_file_path);

        if (stat.isFile()) {
            if (/\.(json|yml|yaml|toml)$/.test(file_path)) {
                files_list.push(full_file_path);
            }
        } else {
            getJobsFilesList(full_file_path, files_list);
        }
    }

    return files_list;

};

export class CronJobManager implements ICronJobManager {

    private readonly _job_list: {
        [key: string]: ICronJobManagerJob
    };

    constructor (
        private readonly _config: ICronJobManagerConfig,
        private readonly _logger: IFastifySmallLogger
    ) {

        this._job_list = {};

        const full_jobs_path = path.resolve(process.cwd(), this._config.jobs_path);

        if (fs.existsSync(full_jobs_path) === false) {
            fs.mkdirSync(full_jobs_path, {
                recursive: true
            });
            this._logger.debug(`Folder ${chalk.gray(full_jobs_path)} created`);
        }

        try {

            const files = getJobsFilesList(full_jobs_path);

            for (const full_file_path of files) {

                const body_job = fs.readFileSync(full_file_path).toString();
                const id = full_file_path.replace(full_jobs_path, "").replace(/\\/g,"/").replace(/^\//,"");
             
                try {

                    const job_config: ICronJobManagerJobConfig = <ICronJobManagerJobConfig>json_from_schema(jtomler.parse(body_job), job_schema);

                    if (!validate_job_schema(job_config)) {
                        let errors = "";
                        for (const item of validate_job_schema.errors) {
                            errors += `\n  - Key ${chalk.yellow(item.dataPath.replace(/\./g, ""))} ${item.message}`;
                        }
                        this._logger.error(`Config schema job ID ${chalk.red(id)} errors:${errors}`);
                        continue;
                    }

                    if (this._job_list[id] !== undefined) {
                        this._logger.error(`Cron job ID ${chalk.red(id)} already exist`);
                        continue;
                    }

                    if (job_config.cwd === "") {
                        job_config.cwd = process.cwd();
                    } else {
                        job_config.cwd = path.resolve(process.cwd(), job_config.cwd);
                    }

                    job_config.env = Object.assign(clone(job_config.env), clone(this._config.env));

                    if (fs.existsSync(job_config.cwd) === false) {
                        this._logger.error(`Cron job ID ${chalk.red(id)}. Workdir ${chalk.red(job_config.cwd)} not exist. Job dropped`);
                        continue;
                    }

                    let drop_flag = false;

                    for (const tag of job_config.tags) {
                        if (this._config.tags.includes(tag) === false) {
                            this._logger.info(`Cron job ID ${chalk.cyan(id)} dropped. Tag ${chalk.cyan(tag)} not found`);
                            drop_flag = true;
                        }
                    }

                    if (drop_flag === false) {
                        this._job_list[id] = new CronJobManagerJob(id, job_config, this._logger);
                    }

                } catch (error) {
                    this._logger.error(`Error parsing job file ${chalk.red(full_file_path)}. Error: ${chalk.red(error.message)}`);
                }
                
            }

        } catch (error) {
            this._logger.fatal(`Error parsing job files. Error: ${chalk.red(error.message)}`);
            this._logger.debug(error.stack);
            process.exit(1);
        }

        this._logger.debug("Cron job manager created");

    }

    get status (): ICronJobManagerJobStatus[] {
        const result = [];
        const jobs = Object.values(this._job_list);
        for (const job of jobs) {
            result.push(job.status);
        }
        return result;
    }

    get info (): ICronJobManagerJobInfo[] {
        const result = [];
        const jobs = Object.values(this._job_list);
        for (const job of jobs) {
            result.push(job.info);
        }
        return result;
    }

    exist (id: string): boolean {
        if (this._job_list[id] === undefined) {
            return false;
        }
        return true;
    }

    job (id: string): ICronJobManagerJob {
        return this._job_list[id];
    }

    async run (): Promise<void> {
        const jobs = Object.values(this._job_list);
        for (const job of jobs) {
            await job.run();
        }
    }

    async stop (): Promise<void> {
        const jobs = Object.values(this._job_list);
        for (const job of jobs) {
            await job.stop();
        }
    }

}