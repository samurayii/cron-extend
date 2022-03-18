import { Controller, Get, IFastifyContext } from "fastify-helpers";
import { Inject } from "di-ts-decorators";
import { CronJobManager, ICronJobManager } from "../../lib/cron-job-manager";

@Controller("/v1/status")
export class StatusController {

    constructor (
        private readonly _cron_manager: ICronJobManager = <ICronJobManager>Inject(CronJobManager)
    ) {}

    @Get("/")
    index(context: IFastifyContext): void {
        context.reply.code(200);
        context.reply.send(this._cron_manager.status);
    }
}
