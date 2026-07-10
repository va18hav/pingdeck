import { InputJsonValue } from "@prisma/client/runtime/client"

export interface CreateJob {
    type: string
    payload: InputJsonValue
    availableAt?: string // ISO date-time string
    executeAfterMinutes?: number
    priority?: number
    userId?: string
}

export interface ScheduleJobInput {
    type: string
    payload: any
    schedule: 'daily' | 'hourly' | 'every-x-minutes' | 'cron'
    minutes?: number
    cronPattern?: string
    userId?: string
}