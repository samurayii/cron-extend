import config from "./lib/init";
import fastify, { FastifyInstance } from "fastify-helpers";
import * as chalk from "chalk";
import { FastifySmallLogger } from "fastify-small-logger";
import { FastifyLoggerInstance } from "fastify";
import { CronJobManager } from "./lib/cron-job-manager";
import { Singleton } from "di-ts-decorators";

import "./http";

const logger = new FastifySmallLogger(config.logger);

logger.debug(`\nCONFIG:\n${JSON.stringify(config, null, 4)}`);

const cron_job_manager = new CronJobManager(config.manager, logger.child("cron-manager"));

Singleton(CronJobManager, cron_job_manager);

const bootstrap = async () => {

    try {

        let api_server: FastifyInstance;

        if (config.api.enable === true) {

            api_server = fastify({
                logger: <FastifyLoggerInstance>logger.child("api-server"),
                trustProxy: config.api.trust_proxy,
                connectionTimeout: config.api.connection_timeout,
                bodyLimit: config.api.body_limit,
                keepAliveTimeout: config.api.keep_alive_timeout
            });

            await cron_job_manager.run();

            await api_server.register( (instance, opts, done) => {   
                instance.listen({
                    port: config.api.port,
                    host: config.api.hostname,
                    backlog: config.api.backlog
                });
                done();
            }, {
                prefix: config.api.prefix
            });
        }

        const stop_app = async () => {
            await api_server?.close();
            await cron_job_manager.stop();
            process.exit();
        };

        process.on("SIGTERM", async () => {
            logger.info(`Signal ${chalk.cyan("SIGTERM")} received`);
            await stop_app();
        });

        process.on("SIGINT", async () => {
            logger.info(`Signal ${chalk.cyan("SIGINT")} received`);
            await stop_app();
        });

    } catch (error) {
        logger.fatal(`Error application start.\n${error.stack}`);
        process.exit(1);
    }

};

bootstrap();