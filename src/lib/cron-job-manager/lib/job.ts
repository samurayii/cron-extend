import { IFastifySmallLogger } from "fastify-small-logger";
import { ICronJobManagerJob, ICronJobManagerJobConfig, TCronJobManagerJobInfo } from "../interfaces";
import * as chalk from "chalk";
import * as child_process from "child_process";
import { CronJob } from "cron";
import { ChildProcess } from "child_process";
import * as clone from "clone";

export class CronJobManagerJob implements ICronJobManagerJob {

    private _running_flag: boolean
    private readonly _job: CronJob
    private _interval: ReturnType<typeof setTimeout>
    private _prc: ChildProcess
    private _executing_flag: boolean
    private _error_flag: boolean
    private _error_message: string

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
            this._error_flag = false;
            this._error_message = "";

            this._interval = setTimeout( async () => {
                this._logger.warn(`Cron job ID ${chalk.cyan(this._id)} executing timeout ${this._config.timeout} sec is over`);
                this._error_flag = true;
                this._error_message = `Timeout ${this._config.timeout} sec is over`;
                await this._close();
            }, this._config.timeout*1000);

            try {
                await this._exec();
            } catch (error) {
                this._logger.error(`Cron job ID ${chalk.cyan(this._id)} error: ${error.message}`);
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

    get info (): TCronJobManagerJobInfo {
        const result = clone(this._config) as TCronJobManagerJobInfo;
        
        result.executing = this._executing_flag;
        result.id = this._id;

        if (this._error_flag === true) {
            result.error = this._error_flag;
            result.error_message = this._error_message;
        }

        return result;
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