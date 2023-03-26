import gulpInst from 'gulp'
import type Undertaker from 'undertaker'
import type {Gulp} from 'gulp'
import {logEvents, logSyncTask} from "./task";
import {error} from "./log";

function registerExports(gulpInst: Gulp, tasks: Record<string, Undertaker.TaskFunction>) {
    const taskNames = Object.keys(tasks);

    if (taskNames.length) {
        taskNames.forEach(register);
    }

    function register(taskName: string) {
        const task = tasks[taskName];

        if (typeof task !== 'function') {
            return;
        }

        gulpInst.task(task.displayName || taskName, task);
    }
}

function exit(code: number) {
    /* istanbul ignore next */
    if (process.platform === 'win32' && process.stdout.bufferSize) {
        process.stdout.once('drain', function () {
            process.exit(code);
        });
        return;
    }
    process.exit(code);
}

/**
 * 执行gulp函数
 * @param exported
 * @param toRun
 */
export default function execute(exported: Record<string, Undertaker.TaskFunction> | Undertaker.TaskFunction, toRun = ['default']) {
    if (typeof exported === 'function') {
        const taskName = exported.displayName || exported.name || 'default';
        exported = {[taskName]: exported}
        toRun = [taskName]
    }
    logEvents(gulpInst);
    logSyncTask(gulpInst);

    registerExports(gulpInst, exported);
    try {
        gulpInst["parallel"](toRun)(function (err) {
            if (err) {
                exit(1);
            }
        });
    } catch (err: any) {
        error(err.message);
        error('To list available tasks, try running: gulp --tasks');
        exit(1);
    }
}