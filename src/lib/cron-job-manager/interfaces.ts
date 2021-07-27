

export interface ICronJobManager {
    readonly info: TCronJobManagerJobInfo[]
    job: (id: string) => ICronJobManagerJob
    run: () => Promise<void>
    stop: () => Promise<void>
    exist: (id: string) => boolean
}

export interface ICronJobManagerJob {
    readonly info: TCronJobManagerJobInfo
    run: () => Promise<void>
    stop: () => Promise<void>
}

export type TCronJobManagerJobInfo = ICronJobManagerJobConfig & {
    id: string
    executing: boolean
    error?: boolean
    error_message?: string
}

export type TCronJobManagerConfig = {
    jobs_path: string
    tags: string[]
    env: {
        [key: string]: string
    }
}

export type ICronJobManagerJobConfig = {
    enable: boolean
    description: string
    timeout: number
    tags: string[]
    cwd: string
    command: string
    args: string[]
    env: {
        [key: string]: string
    }
    cron: {
        interval: string,
        time_zone: string
    }
}