import { IFastifySmallLogger } from "fastify-small-logger";
import { ICronJobManagerJob, ICronJobManagerJobConfig, ICronJobManagerJobInfo, ICronJobManagerJobStatus } from "../interfaces";
import * as chalk from "chalk";
import * as child_process from "child_process";
import { CronJob } from "cron";
import { ChildProcess } from "child_process";
import * as clone from "clone";
import { convertTime } from "../../tools/convert-time";

export class CronJobManagerJob implements ICronJobManagerJob {

    private _running_flag: boolean;
    private readonly _job: CronJob;
    private _interval: ReturnType<typeof setTimeout>;
    private _prc: ChildProcess;
    private _executing_flag: boolean;
    private _error_flag: boolean;
    private _error_message: string;

    constructor (
        private readonly _id: string,
        private readonly _config: ICronJobManagerJobConfig,
        private readonly _logger: IFastifySmallLogger
    ) {
        
        this._running_flag = false;
        this._executing_flag = false;
        this._error_flag = false;
        this._error_message = "";
        
        this._job = new CronJob(this._config.cron.interval, async () => {

            if (this._executing_flag === true) {
                return;
            }

            this._executing_flag = true;

            this._interval = setTimeout( async () => {
                this._logger.error(`Cron job ID ${chalk.red(this._id)} executing timeout ${chalk.red(this._config.timeout)} is over`);
                this._error_flag = true;
                this._error_message = `Timeout ${this._config.timeout} is over`;
                await this._close();
            }, convertTime(this._config.timeout)*1000);

            try {
                await this._exec();
                this._error_flag = false;
                this._error_message = "";
            } catch (error) {
                this._logger.error(`Cron job ID ${chalk.red(this._id)} error: ${chalk.red(error.message)}`);
                this._error_flag = true;
                this._error_message = `${error}`;
            }

            clearTimeout(this._interval);

            this._executing_flag = false;

        }, null, false, this._config.cron.time_zone);
        
        this._logger.debug(`Cron job ID ${chalk.cyan(this._id)} created`);
        
        if (this._config.enable === false) {
            this._logger.info(`Cron job ID ${chalk.cyan(this._id)} ${chalk.yellow("disabled")}`);
        }
        
    }

    get status (): ICronJobManagerJobStatus {
        return {
            id: this._id,
            enable: this._config.enable,
            description: this._config.description,
            executing: this._executing_flag,
            error: this._error_flag,
            error_message: this._error_message,
        };
    }

    get info (): ICronJobManagerJobInfo {
        return {
            ...this._config,
            executing: this._executing_flag,
            id: this._id,
            error: this._error_flag,
            error_message: this._error_message,
        };
    }

    async run (): Promise<void> {
        if (this._running_flag === true || this._config.enable === false) {
            return;
        }
        this._running_flag = true;
        this._job.start();
        this._logger.debug(`Cron job ID ${chalk.cyan(this._id)} running`);
    }

    async stop (): Promise<void> {
        if (this._running_flag === false || this._config.enable === false) {
            return;
        }
        this._running_flag = false;
        this._job.stop();
        clearTimeout(this._interval);
        this._logger.debug(`Cron job ID ${chalk.cyan(this._id)} stopped`);
    }

    private _exec (): Promise<void> {
        return new Promise( (resolve, reject) => {

            const env = Object.assign(process.env, clone(this._config.env));
            const logger = this._logger.child(`job: ${this._id}`);

            this._logger.debug(`Cron job ID ${chalk.cyan(this._id)} executing: ${this._config.command} ${this._config.args.join(" ")} (${this._config.cwd})`);

            this._prc = child_process.spawn(this._config.command, this._config.args, {
                cwd: this._config.cwd,
                env: env
            });

            this._prc.stdout.on("data", (data: Buffer) => {
                logger.info(data.toString().trim());
            });

            this._prc.stderr.on("data", (data: Buffer) => {
                logger.error(data.toString().trim());
            });

            this._prc.on("close", (code) => {
                if (code > 0) {
                    reject(new Error(`Process closed with code ${code}`));
                } else {
                    this._logger.debug(`Cron job ID ${chalk.cyan(this._id)} executing complete`);
                    resolve();
                }
            });

            this._prc.on("error", (error) => {
                reject(error);
            });

        });
    }

    private async _close (): Promise<void> {
        this._prc.kill();
    }

}