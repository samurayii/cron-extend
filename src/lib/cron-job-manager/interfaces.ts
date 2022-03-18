

export interface ICronJobManager {
    readonly info: ICronJobManagerJobInfo[]
    readonly status: ICronJobManagerJobStatus[]
    job: (id: string) => ICronJobManagerJob
    run: () => Promise<void>
    stop: () => Promise<void>
    exist: (id: string) => boolean
}

export interface ICronJobManagerJob {
    readonly info: ICronJobManagerJobInfo
    readonly status: ICronJobManagerJobStatus
    run: () => Promise<void>
    stop: () => Promise<void>
}

export interface ICronJobManagerJobInfo extends ICronJobManagerJobConfig {
    id: string
    executing: boolean
    error: boolean
    error_message: string
}

export interface ICronJobManagerJobStatus {
    id: string
    enable: boolean
    description: string
    executing: boolean
    error: boolean
    error_message: string
}

export interface ICronJobManagerConfig {
    jobs_path: string
    tags: string[]
    env: {
        [key: string]: string
    }
}

export interface ICronJobManagerJobConfig {
    enable: boolean
    description: string
    timeout: string
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